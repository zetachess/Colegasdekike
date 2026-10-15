import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createLichessClient, parseRecords, parseTeamBattleHtml } from "../lib/lichess.mjs";
import { createEmptyDataset, readDataset, writeDataset } from "../lib/leaderboard-store.mjs";
import { syncLeaderboard } from "../scripts/sync-leaderboard.mjs";

const quietLogger = { log() {}, warn() {}, error() {} };

test("Lichess parsing handles NDJSON and Arena team standings", () => {
  assert.deepEqual(parseRecords(['{"id":"one"}', '{"id":"two"}'].join(String.fromCharCode(10))), [
    { id: "one" },
    { id: "two" },
  ]);
  const html = '<table class="tour__team-info"><tr><td>1</td><td><a href="/@/Ana_Chess">Ana</a></td><td>1,250</td></tr></table>';
  assert.deepEqual(parseTeamBattleHtml(html), [
    { playerId: "ana_chess", username: "Ana_Chess", points: 1250, rank: 1 },
  ]);
  assert.throws(() => parseTeamBattleHtml("<table></table>"), /team-specific Arena standings table/);
});

test("Lichess client builds encoded team requests", async () => {
  let requestedUrl;
  const client = createLichessClient({
    teamId: "team name",
    tournamentHistoryLimit: 50,
    fetchImpl: async (url) => {
      requestedUrl = url;
      return new Response('{"id":"event1","status":30}' + String.fromCharCode(10), { status: 200 });
    },
  });
  assert.deepEqual(await client.getTournamentList("arena"), [{ id: "event1", status: 30 }]);
  assert.equal(requestedUrl, "https://lichess.org/api/team/team%20name/arena?max=50");
});

test("dataset storage preserves corrupt files and round-trips atomically", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "leaderboard-store-"));
  const filePath = path.join(directory, "nested", "data.json");
  const dataset = createEmptyDataset("team-slug");
  try {
    assert.deepEqual(await readDataset(filePath, "team-slug"), dataset);
    await writeDataset(filePath, dataset);
    assert.deepEqual(await readDataset(filePath, "team-slug"), dataset);
    await writeFile(filePath, "{broken", "utf8");
    await assert.rejects(readDataset(filePath, "team-slug"), SyntaxError);
    assert.equal(await readFile(filePath, "utf8"), "{broken");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("syncLeaderboard imports completed tournaments using injected dependencies", async () => {
  const dataset = createEmptyDataset("team-slug");
  const savedSnapshots = [];
  const client = {
    async getTournamentList(type) {
      assert.equal(type, "arena");
      return [
        { id: "finished", status: 30, startsAt: "2026-10-14T18:00:00Z", name: "Finished event" },
        { id: "running", status: 20, startsAt: "2026-10-14T19:00:00Z", name: "Running event" },
      ];
    },
    async getTournamentResults(type, id) {
      assert.equal(type, "arena");
      assert.equal(id, "finished");
      return [{ playerId: "ana", username: "Ana", points: 12, rank: 1 }];
    },
  };
  const result = await syncLeaderboard({
    teamId: "team-slug",
    tournamentHistoryLimit: 10,
    outputPath: "/tmp/leaderboard.json",
    client,
    read: async () => dataset,
    write: async (_filePath, value) => savedSnapshots.push(structuredClone(value)),
    logger: quietLogger,
    now: () => new Date("2026-10-15T06:00:00.000Z"),
  });
  assert.equal(result.failed, false);
  assert.equal(result.dataset.tournaments.length, 1);
  assert.equal(result.dataset.tournaments[0].id, "arena:finished");
  assert.equal(result.dataset.tournaments[0].results[0].points, 12);
  assert.equal(result.dataset.updatedAt, "2026-10-15T06:00:00.000Z");
  assert.equal(savedSnapshots.length, 2);
});
