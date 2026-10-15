import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export function createEmptyDataset(teamId) {
  return {
    team: teamId,
    updatedAt: null,
    coverageFrom: null,
    unavailableTournamentIds: [],
    tournaments: [],
  };
}

export async function readDataset(filePath, teamId) {
  let contents;
  try {
    contents = await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return createEmptyDataset(teamId);
    throw error;
  }

  const dataset = JSON.parse(contents);
  if (!dataset || typeof dataset !== "object" || !Array.isArray(dataset.tournaments)) {
    throw new Error("Leaderboard data must contain a tournaments array.");
  }
  return dataset;
}

export async function writeDataset(filePath, dataset) {
  const directory = path.dirname(filePath);
  await mkdir(directory, { recursive: true });

  const temporaryPath = filePath + "." + randomUUID() + ".tmp";
  try {
    await writeFile(temporaryPath, JSON.stringify(dataset, null, 2) + String.fromCharCode(10), "utf8");
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}
