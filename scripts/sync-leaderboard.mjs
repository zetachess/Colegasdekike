import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { upsertTournament } from "../lib/leaderboard.mjs";

const teamId = process.env.LICHESS_TEAM_ID || "colegas-de-kike";
const tournamentHistoryLimit = Number(process.env.LICHESS_TOURNAMENT_LIMIT || 1_000);
const outputPath = process.env.LEADERBOARD_DATA_PATH || path.resolve("data/leaderboard.json");
const emptyDataset = { team: teamId, updatedAt: null, coverageFrom: null, tournaments: [] };

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchText(url, accept = "application/x-ndjson, application/json", timeoutMs = 45_000) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Accept: accept,
        "User-Agent": "colegas-de-kike-leaderboard/1.0",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.status === 429) {
      console.warn(`Lichess rate limited this request; waiting 60 seconds: ${url}`);
      await sleep(61_000);
      continue;
    }
    if (response.status >= 500 && attempt < 3) {
      await sleep(2 ** attempt * 2_000);
      continue;
    }
    if (!response.ok) throw new Error(`Lichess returned ${response.status} for ${url}`);
    return response.text();
  }
  throw new Error(`Lichess request retries exhausted: ${url}`);
}

function parseRecords(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) return JSON.parse(trimmed);
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Results and team tournament listings are normally newline-delimited JSON.
    }
  }
  return trimmed.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function parseDate(value) {
  if (typeof value === "number") {
    const date = new Date(value < 10_000_000_000 ? value * 1_000 : value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

function tournamentStart(event) {
  return parseDate(event.startsAt ?? event.startAt ?? event.startDate ?? event.createdAt);
}

function isFinished(event) {
  const status = String(event.status ?? "").toLowerCase();
  // Lichess encodes tournament state as 10 (created), 20 (started), 30 (finished).
  return status === "finished" || Number(event.status) === 30 || event.finished === true;
}

function normalizePlayer(row) {
  const rawUsername = row.username ?? row.user?.name ?? row.user?.username ?? row.name;
  if (typeof rawUsername !== "string" || !rawUsername.trim()) return null;
  const username = rawUsername.trim();
  const rawPoints = row.score ?? row.points ?? row.point;
  const points = Number(rawPoints);
  if (!Number.isFinite(points)) return null;
  const rank = Number(row.rank);
  return {
    playerId: username.toLowerCase(),
    username,
    points,
    rank: Number.isFinite(rank) && rank > 0 ? rank : null,
  };
}

async function readDataset() {
  try {
    return JSON.parse(await readFile(outputPath, "utf8"));
  } catch {
    return structuredClone(emptyDataset);
  }
}

async function writeDataset(dataset) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
}

async function getTournamentList(type) {
  const endpoint = type === "arena" ? "arena" : "swiss";
  const body = await fetchText(
    `https://lichess.org/api/team/${teamId}/${endpoint}?max=${tournamentHistoryLimit}`,
    "application/x-ndjson, application/json",
    180_000,
  );
  return parseRecords(body);
}

async function getTournamentResults(type, id) {
  if (type === "arena") {
    // Arena standings include every team in the battle. Use the public team
    // detail page to get only the players representing Colegas de Kike.
    const html = await fetchText(
      `https://lichess.org/tournament/${id}/team/${teamId}`,
      "text/html,application/xhtml+xml",
    );
    return parseTeamBattleHtml(html);
  }

  const body = await fetchText(`https://lichess.org/api/swiss/${id}/results`);
  const rows = parseRecords(body);
  const players = new Map();
  for (const row of rows) {
    const player = normalizePlayer(row);
    if (!player) continue;
    const current = players.get(player.playerId);
    if (!current || player.points > current.points) players.set(player.playerId, player);
  }
  return [...players.values()];
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function parseTeamBattleHtml(html) {
  const table = html.match(/<table\b[^>]*\btour__team-info\b[^>]*>([\s\S]*?)<\/table>/i)?.[1];
  if (!table) throw new Error("Lichess did not return the team-specific Arena standings table.");

  const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => match[1]);
  const players = [];
  for (const row of rows) {
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
    if (cells.length < 3) continue;
    const link = cells[1].match(/href=["']\/@\/([^"']+)["']/i);
    if (!link) continue;
    const username = decodeHtml(link[1]);
    const pointsText = decodeHtml(cells[2].replace(/<[^>]*>/g, "")).replace(/[\s,]/g, "").trim();
    const points = Number(pointsText);
    if (!Number.isFinite(points)) continue;
    const rankText = decodeHtml(cells[0].replace(/<[^>]*>/g, "")).trim();
    const rank = Number(rankText);
    players.push({
      playerId: username.toLowerCase(),
      username,
      points,
      rank: Number.isFinite(rank) && rank > 0 ? rank : null,
    });
  }
  return players;
}

const dataset = await readDataset();
dataset.team = teamId;
dataset.tournaments = Array.isArray(dataset.tournaments) ? dataset.tournaments : [];
const knownIds = new Set(dataset.tournaments.map((tournament) => tournament.id));
let failed = false;
let completedLists = 0;

for (const type of ["arena", "swiss"]) {
  let events;
  try {
    events = await getTournamentList(type);
    completedLists += 1;
  } catch (error) {
    failed = true;
    console.error(`Could not list ${type} tournaments:`, error);
    continue;
  }

  for (const event of events) {
    const lichessId = event.id ?? event.tournament?.id;
    if (!lichessId || !isFinished(event)) continue;
    const compositeId = `${type}:${lichessId}`;
    if (knownIds.has(compositeId)) continue;
    const startAt = tournamentStart(event);
    if (!startAt) {
      failed = true;
      console.error(`Skipping ${compositeId}: Lichess did not provide a usable start date.`);
      continue;
    }

    try {
      const results = await getTournamentResults(type, lichessId);
      const name = String(event.name ?? event.fullName ?? event.tournament?.name ?? "Torneo de Colegas de Kike");
      upsertTournament(dataset, {
        id: compositeId,
        lichessId,
        type,
        name,
        startAt,
        url: type === "arena" ? `https://lichess.org/tournament/${lichessId}` : `https://lichess.org/swiss/${lichessId}`,
        results,
      });
      knownIds.add(compositeId);
      await writeDataset(dataset);
      console.log(`Imported ${compositeId}: ${results.length} players.`);
    } catch (error) {
      failed = true;
      console.error(`Could not import ${compositeId}:`, error);
    }
  }
}

if (completedLists === 2 && !failed) dataset.updatedAt = new Date().toISOString();
dataset.coverageFrom = dataset.tournaments[0]?.startAt ?? null;
await writeDataset(dataset);
console.log(`Saved ${dataset.tournaments.length} tournaments; sync status: ${failed ? "partial" : "complete"}.`);
if (failed) process.exitCode = 1;
