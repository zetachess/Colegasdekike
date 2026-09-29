import { NextResponse } from "next/server";
import { rankPlayers } from "../../../lib/leaderboard.mjs";

export const runtime = "nodejs";

const leaderboardUrl = "https://raw.githubusercontent.com/zetachess/Colegasdekike/leaderboard-data/data/leaderboard.json";

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

async function loadDataset(): Promise<Dataset> {
  const response = await fetch(leaderboardUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`No se pudo leer el archivo de puntos (${response.status}).`);
  const dataset = (await response.json()) as Dataset;
  if (dataset.team !== "colegas-de-kike" || !Array.isArray(dataset.tournaments)) {
    throw new Error("El archivo público de puntos no tiene el formato esperado.");
  }
  return dataset;
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
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Leaderboard read failed", error);
    return NextResponse.json({ error: "No se pudo cargar la clasificación." }, { status: 503 });
  }
}
