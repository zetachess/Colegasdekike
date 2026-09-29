"use client";

import { useCallback, useEffect, useState } from "react";

type Player = {
  playerId: string;
  username: string;
  points: number;
  tournaments: number;
};

type BoardData = {
  allTime: Player[];
  thisWeek: Player[];
  updatedAt: string | null;
  coverageFrom: string | null;
  tournamentCount: number;
  weekTournamentCount: number;
  uniquePlayers: number;
  totalPoints: number;
  unavailableTournamentCount: number;
  weekStart: string | null;
};

const EMPTY_BOARD: BoardData = {
  allTime: [],
  thisWeek: [],
  updatedAt: null,
  coverageFrom: null,
  tournamentCount: 0,
  weekTournamentCount: 0,
  uniquePlayers: 0,
  totalPoints: 0,
  unavailableTournamentCount: 0,
  weekStart: null,
};

const numberFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

function formatPoints(points: number) {
  return numberFormat.format(points);
}

function formatDate(value: string | null, options: Intl.DateTimeFormatOptions = {}) {
  if (!value) return "Pendiente";
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(value));
}

function formatWeekRange(weekStart: string | null) {
  if (!weekStart) return "Semana actual · hora de Madrid";
  const start = new Date(`${weekStart}T12:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const format = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "short" });
  return `${format.format(start)} – ${format.format(end)} · Madrid`;
}

function profileUrl(username: string) {
  return `https://lichess.org/@/${encodeURIComponent(username)}`;
}

function PlayerTable({
  title,
  subtitle,
  players,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  players: Player[];
  emptyMessage: string;
}) {
  const maxPoints = players[0]?.points || 1;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <section className="ranking-card" aria-label={title}>
      <div className="ranking-card__heading">
        <div>
          <p className="section-kicker"><span aria-hidden="true">♟</span> CLASIFICACIÓN</p>
          <h2>{title}</h2>
        </div>
        <span className="ranking-card__period">{subtitle}</span>
      </div>
      <div className="table-scroll">
        <table className="compact-table">
          <thead>
            <tr>
              <th className="column-rank" scope="col">#</th>
              <th scope="col">JUGADOR</th>
              <th className="column-score" scope="col">PUNTOS</th>
              <th className="column-events" scope="col">BATALLAS</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr><td className="table-empty" colSpan={4}>{emptyMessage}</td></tr>
            ) : players.map((player, index) => (
              <tr key={player.playerId}>
                <td className={`rank-number${index < 3 ? ` rank-number--${index + 1}` : ""}`}>
                  {medals[index] ?? String(index + 1).padStart(2, "0")}
                </td>
                <td className="player-cell">
                  <a href={profileUrl(player.username)} target="_blank" rel="noreferrer">
                    {player.username}<span aria-hidden="true">↗</span>
                  </a>
                </td>
                <td className="score-cell">
                  <div className="score-value">
                    <span className="score-track" aria-hidden="true">
                      <span style={{ width: `${Math.max(4, (player.points / maxPoints) * 100)}%` }} />
                    </span>
                    <strong>{formatPoints(player.points)}</strong>
                  </div>
                </td>
                <td className="event-count">{player.tournaments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Leaderboard() {
  const [data, setData] = useState<BoardData>(EMPTY_BOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!response.ok) throw new Error("No se pudo cargar la clasificación.");
      const result = (await response.json()) as BoardData;
      setData(result);
      setError(null);
    } catch {
      setError("Ahora mismo no se pueden cargar los puntos. Prueba de nuevo en un momento.");
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBoard(true);
    const timer = window.setInterval(() => void loadBoard(), 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [loadBoard]);

  const stats = [
    { label: "BATALLAS CONTADAS", value: numberFormat.format(data.tournamentCount), mark: "♜" },
    { label: "JUGADORES", value: numberFormat.format(data.uniquePlayers), mark: "♟" },
    { label: "PUNTOS SUMADOS", value: numberFormat.format(data.totalPoints), mark: "✦" },
  ];

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <a className="dashboard-brand" href="https://lichess.org/team/colegas-de-kike" target="_blank" rel="noreferrer">
          <span className="brand-knight" aria-hidden="true">♞</span>
          <span><strong>COLEGAS DE KIKE</strong><small>MARCADOR DE LICHESS</small></span>
        </a>
        <a className="team-link" href="https://lichess.org/team/colegas-de-kike" target="_blank" rel="noreferrer">
          Abrir equipo <span aria-hidden="true">↗</span>
        </a>
      </header>

      <div className="dashboard-title">
        <div>
          <p className="dashboard-eyebrow"><span className="status-dot" /> BATALLAS POR EQUIPOS</p>
          <h1>Marcador del equipo</h1>
        </div>
        <span className="week-range">{formatWeekRange(data.weekStart)}</span>
      </div>

      {error && <div className="dashboard-error" role="alert">{error}</div>}

      {loading ? (
        <div className="dashboard-loading" aria-label="Cargando clasificación">
          <span className="loader" /> Cargando puntos de las batallas…
        </div>
      ) : (
        <>
          <section className="stats-grid" aria-label="Resumen histórico">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <span className="stat-mark" aria-hidden="true">{stat.mark}</span>
                <strong>{stat.value}</strong>
                <span className="stat-label">{stat.label}</span>
              </article>
            ))}
          </section>

          <section className="rankings-grid" aria-label="Clasificación de jugadores">
            <PlayerTable
              title="Top jugadores · Siempre"
              subtitle="Histórico disponible"
              players={data.allTime}
              emptyMessage="Aún no hay puntos históricos disponibles."
            />
            <PlayerTable
              title="Top jugadores · Esta semana"
              subtitle={`${data.weekTournamentCount} ${data.weekTournamentCount === 1 ? "batalla" : "batallas"}`}
              players={data.thisWeek}
              emptyMessage="Todavía no hay puntos esta semana."
            />
          </section>
        </>
      )}

      <footer className="dashboard-footer">
        <span><span className="sync-mark" aria-hidden="true">↻</span> Actualizado {formatDate(data.updatedAt, { hour: "2-digit", minute: "2-digit" })}</span>
        <span>Histórico desde {formatDate(data.coverageFrom)}</span>
        <span>Semana natural · hora de Madrid</span>
      </footer>
      {data.unavailableTournamentCount > 0 && (
        <p className="coverage-note">
          Lichess ya no ofrece los resultados de {data.unavailableTournamentCount} batallas antiguas; no se incluyen en los puntos.
        </p>
      )}
    </main>
  );
}
