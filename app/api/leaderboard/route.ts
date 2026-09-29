import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { rankPlayers } from "../../../lib/leaderboard.mjs";

export const runtime = "nodejs";

type TournamentResult = {
  playerId: string;
  username: string;
  points: number;
  rank: number | null;
};

type Tournament = {
  id: string;
  type: "arena" | "swiss";
  name: string;
  startAt: string;
  url: string;
  results: TournamentResult[];
};

type Dataset = {
  team: string;
  updatedAt: string | null;
  coverageFrom: string | null;
  unavailableTournamentIds?: string[];
  tournaments: Tournament[];
};

const EMPTY_DATA: Dataset = {
  team: "colegas-de-kike",
  updatedAt: null,
  coverageFrom: null,
  unavailableTournamentIds: [],
  tournaments: [],
};

async function loadDataset(): Promise<Dataset> {
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.VERCEL_GIT_REPO_SLUG;

  if (owner && repo) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/leaderboard-data/data/leaderboard.json`;
    const response = await fetch(rawUrl, { next: { revalidate: 300 } });
    if (response.ok) return (await response.json()) as Dataset;
    if (response.status !== 404) throw new Error(`No se pudo leer el archivo de puntos (${response.status}).`);
  }

  try {
    const localFile = path.join(process.cwd(), "data", "leaderboard.json");
    return JSON.parse(await readFile(localFile, "utf8")) as Dataset;
  } catch {
    return EMPTY_DATA;
  }
}

export async function GET(request: Request) {
  try {
    const dataset = await loadDataset();
    const period = new URL(request.url).searchParams.get("period") === "week" ? "week" : "all";
    const { entries, weekStart, tournamentCount } = rankPlayers(dataset, period, new Date());

    const response = NextResponse.json({
      entries,
      updatedAt: dataset.updatedAt,
      coverageFrom: dataset.coverageFrom,
      tournamentCount,
      unavailableTournamentCount: dataset.unavailableTournamentIds?.length ?? 0,
      period,
      weekStart,
    });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return response;
  } catch (error) {
    console.error("Leaderboard read failed", error);
    return NextResponse.json({ error: "No se pudo cargar la clasificación." }, { status: 503 });
  }
}
