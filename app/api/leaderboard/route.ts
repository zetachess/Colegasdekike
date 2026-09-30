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

export async function GET() {
  try {
    const dataset = await loadDataset();
    const now = new Date();
    const allTime = rankPlayers(dataset, "all", now);
    const thisWeek = rankPlayers(dataset, "week", now);
    const results = dataset.tournaments
      .filter((tournament) => tournament.type === "arena")
      .flatMap((tournament) => tournament.results);

    const response = NextResponse.json({
      allTime: allTime.entries,
      thisWeek: thisWeek.entries,
      updatedAt: dataset.updatedAt,
      coverageFrom: dataset.coverageFrom,
      tournamentCount: allTime.tournamentCount,
      weekTournamentCount: thisWeek.tournamentCount,
      uniquePlayers: new Set(results.map((result) => result.playerId)).size,
      totalPoints: results.reduce((sum, result) => sum + result.points, 0),
      unavailableTournamentCount: dataset.unavailableTournamentIds?.length ?? 0,
      weekStart: thisWeek.weekStart,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Leaderboard read failed", error);
    return NextResponse.json({ error: "No se pudo cargar la clasificación." }, { status: 503 });
  }
}
