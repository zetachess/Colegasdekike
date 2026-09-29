import test from "node:test";
import assert from "node:assert/strict";
import { mondayKeyInMadrid, rankPlayers, upsertTournament } from "../lib/leaderboard.mjs";

const result = (playerId, username, points) => ({ playerId, username, points, rank: 1 });
const tournament = (id, startAt, type, results) => ({ id, startAt, type, name: id, url: "", results });

test("reimport replaces the same tournament instead of adding points twice", () => {
  const dataset = { tournaments: [], coverageFrom: null };
  upsertTournament(dataset, tournament("arena:x", "2026-09-28T19:00:00.000Z", "arena", [result("ana", "Ana", 10)]));
  upsertTournament(dataset, tournament("arena:x", "2026-09-28T19:00:00.000Z", "arena", [result("ana", "Ana", 12)]));
  assert.equal(dataset.tournaments.length, 1);
  assert.equal(rankPlayers(dataset).entries[0].points, 12);
});

test("ranking counts Team Battle Arena only and uses the start date in Madrid for weekly points", () => {
  const dataset = { tournaments: [
    tournament("arena:crossing", "2026-09-27T20:30:00.000Z", "arena", [result("ana", "Ana", 7)]),
    tournament("swiss:monday", "2026-09-28T09:00:00.000Z", "swiss", [result("ana", "Ana", 5), result("bea", "Bea", 9)]),
    tournament("arena:monday", "2026-09-28T09:00:00.000Z", "arena", [result("ana", "Ana", 3)]),
  ] };
  assert.equal(mondayKeyInMadrid(new Date("2026-09-28T00:15:00.000Z")), "2026-09-28");
  const allTime = rankPlayers(dataset, "all");
  assert.equal(allTime.entries.find((player) => player.playerId === "ana").points, 10);
  assert.equal(allTime.entries.some((player) => player.playerId === "bea"), false);
  assert.equal(allTime.tournamentCount, 2);
  const weekly = rankPlayers(dataset, "week", new Date("2026-09-30T12:00:00.000Z"));
  assert.equal(weekly.weekStart, "2026-09-28");
  assert.deepEqual(weekly.entries.map((player) => player.username), ["Ana"]);
  assert.equal(weekly.entries[0].points, 3);
  assert.equal(weekly.tournamentCount, 1);
});
