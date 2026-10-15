import path from "node:path";
import { pathToFileURL } from "node:url";
import { createLichessClient, isFinished, tournamentStart } from "../lib/lichess.mjs";
import { readDataset, writeDataset } from "../lib/leaderboard-store.mjs";
import { upsertTournament } from "../lib/leaderboard.mjs";

export async function syncLeaderboard({
  teamId = process.env.LICHESS_TEAM_ID || "colegas-de-kike",
  // Lichess returns the newest tournaments first. Keep this above the current
  // history so the leaderboard can backfill older team battles instead of
  // silently stopping at the first 1,000 events, without making the NDJSON
  // response too large for a scheduled sync.
  tournamentHistoryLimit = Number(process.env.LICHESS_TOURNAMENT_LIMIT || 2_000),
  outputPath = process.env.LEADERBOARD_DATA_PATH || path.resolve("data/leaderboard.json"),
  client = createLichessClient({ teamId, tournamentHistoryLimit }),
  read = readDataset,
  write = writeDataset,
  logger = console,
  now = () => new Date(),
} = {}) {
  if (!Number.isInteger(tournamentHistoryLimit) || tournamentHistoryLimit < 1) {
    throw new Error("LICHESS_TOURNAMENT_LIMIT must be a positive integer.");
  }

  const dataset = await read(outputPath, teamId);
  dataset.team = teamId;
  dataset.tournaments = dataset.tournaments.filter((tournament) => tournament.type === "arena");

  const knownIds = new Set(dataset.tournaments.map((tournament) => tournament.id));
  dataset.unavailableTournamentIds = Array.isArray(dataset.unavailableTournamentIds)
    ? dataset.unavailableTournamentIds
    : [];
  for (const id of dataset.unavailableTournamentIds) knownIds.add(id);

  let failed = false;
  let completedLists = 0;

  for (const type of ["arena"]) {
    let events;
    try {
      events = await client.getTournamentList(type);
      completedLists += 1;
    } catch (error) {
      failed = true;
      logger.error("Could not list " + type + " tournaments:", error);
      continue;
    }

    for (const event of events) {
      const lichessId = event.id ?? event.tournament?.id;
      if (!lichessId || !isFinished(event)) continue;

      const compositeId = type + ":" + lichessId;
      if (knownIds.has(compositeId)) continue;

      const startAt = tournamentStart(event);
      if (!startAt) {
        failed = true;
        logger.error("Skipping " + compositeId + ": Lichess did not provide a usable start date.");
        continue;
      }

      try {
        const results = await client.getTournamentResults(type, lichessId);
        const name = String(event.name ?? event.fullName ?? event.tournament?.name ?? "Torneo de Colegas de Kike");
        upsertTournament(dataset, {
          id: compositeId,
          lichessId,
          type,
          name,
          startAt,
          url: "https://lichess.org/tournament/" + encodeURIComponent(lichessId),
          results,
        });
        knownIds.add(compositeId);
        await write(outputPath, dataset);
        logger.log("Imported " + compositeId + ": " + results.length + " players.");
      } catch (error) {
        if (error instanceof Error && error.message.includes("Lichess returned 404")) {
          // Some old team Arena listings outlive the team-specific standings page.
          // Record them once so scheduled syncs do not retry permanently missing data.
          dataset.unavailableTournamentIds.push(compositeId);
          knownIds.add(compositeId);
          await write(outputPath, dataset);
          logger.warn("Historical results unavailable for " + compositeId + "; recorded as missing.");
        } else {
          failed = true;
          logger.error("Could not import " + compositeId + ":", error);
        }
      }
    }
  }

  if (completedLists === 1 && !failed) dataset.updatedAt = now().toISOString();
  dataset.coverageFrom = dataset.tournaments[0]?.startAt ?? null;
  await write(outputPath, dataset);
  logger.log(
    "Saved " + dataset.tournaments.length + " tournaments; "
      + dataset.unavailableTournamentIds.length
      + " historical results unavailable; sync status: " + (failed ? "partial" : "complete") + ".",
  );
  return { dataset, failed };
}

const currentScript = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (currentScript === import.meta.url) {
  const { failed } = await syncLeaderboard();
  if (failed) process.exitCode = 1;
}
