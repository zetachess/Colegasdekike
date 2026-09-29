"use client";

import { useCallback, useEffect, useState } from "react";

type Player = {
  playerId: string;
  username: string;
  points: number;
  tournaments: number;
};

type BoardData = {
  entries: Player[];
  updatedAt: string | null;
  coverageFrom: string | null;
  tournamentCount: number;
};

type Period = "all" | "week";

const EMPTY_BOARD: BoardData = {
  entries: [],
  updatedAt: null,
  coverageFrom: null,
  tournamentCount: 0,
};

function formatPoints(points: number) {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(points);
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

function profileUrl(username: string) {
  return `https://lichess.org/@/${encodeURIComponent(username)}`;
}

function initials(username: string) {
  return username.trim().slice(0, 1).toUpperCase() || "?";
}

function PlayerLink({ username, className = "" }: { username: string; className?: string }) {
  return (
    <a className={`player-link ${className}`} href={profileUrl(username)} target="_blank" rel="noreferrer">
      {username}
      <span aria-hidden="true" className="external-mark">↗</span>
    </a>
  );
}

function Podium({ players }: { players: Player[] }) {
  const podiumOrder = [players[1], players[0], players[2]].filter(Boolean);
  return (
    <div className="podium" aria-label="Podio de la clasificación">
      {podiumOrder.map((player) => {
        const rank = players.indexOf(player) + 1;
        return (
          <article className={`podium-card podium-card--${rank}`} key={player.playerId}>
            <div className="podium-card__topline">
              <span className="podium-card__rank">{String(rank).padStart(2, "0")}</span>
              <span className="podium-card__label">{rank === 1 ? "LÍDER" : rank === 2 ? "SEGUNDO" : "TERCERO"}</span>
            </div>
            <div className="podium-card__avatar" aria-hidden="true">{initials(player.username)}</div>
            <PlayerLink username={player.username} className="podium-card__name" />
            <div className="podium-card__score">
              {formatPoints(player.points)} <span>pts</span>
            </div>
            <div className="podium-card__events">{player.tournaments} {player.tournaments === 1 ? "torneo" : "torneos"}</div>
          </article>
        );
      })}
      {players.length === 0 && <div className="podium-empty" />}
    </div>
  );
}

export default function Leaderboard() {
  const [period, setPeriod] = useState<Period>("all");
  const [data, setData] = useState<BoardData>(EMPTY_BOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(async (selectedPeriod: Period, initial = false) => {
    if (initial) setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?period=${selectedPeriod}`, { cache: "no-store" });
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
    void loadBoard(period, true);
    const timer = window.setInterval(() => void loadBoard(period), 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [period, loadBoard]);

  const players = data.entries.slice(0, 10);
  const weekLabel = "Lunes a domingo · hora de Madrid";

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="https://lichess.org/team/colegas-de-kike" target="_blank" rel="noreferrer">
          <span className="brand-mark" aria-hidden="true">♞</span>
          <span className="brand-copy"><strong>COLEGAS</strong><small>DE KIKE · LICHESS</small></span>
        </a>
        <a className="team-link" href="https://lichess.org/team/colegas-de-kike" target="_blank" rel="noreferrer">
          Ver el equipo <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="intro">
        <div className="intro-copy">
          <p className="eyebrow"><span className="live-dot" /> PUNTUACIÓN DEL EQUIPO</p>
          <h1>¿Quién<br /><em>manda?</em></h1>
          <p className="intro-description">Los puntos de cada torneo, sumados para ver quién está arriba.</p>
        </div>
        <div className="intro-stamp" aria-hidden="true">
          <span className="stamp-ring">CLASIFICACIÓN · LICHESS · COLEGAS DE KIKE · </span>
          <span className="stamp-knight">♞</span>
          <span className="stamp-year">PUNTOS<br />EN JUEGO</span>
        </div>
      </section>

      <section className="board-section" aria-labelledby="ranking-heading">
        <div className="board-header">
          <div>
            <p className="eyebrow eyebrow--dark">EL MARCADOR</p>
            <h2 id="ranking-heading">Top 10 <span>{period === "all" ? "de siempre" : "de la semana"}</span></h2>
          </div>
          <div className="period-switch" role="tablist" aria-label="Periodo de clasificación">
            <button type="button" role="tab" aria-selected={period === "all"} className={period === "all" ? "is-active" : ""} onClick={() => setPeriod("all")}>Siempre</button>
            <button type="button" role="tab" aria-selected={period === "week"} className={period === "week" ? "is-active" : ""} onClick={() => setPeriod("week")}>Esta semana</button>
          </div>
        </div>

        {period === "week" && <p className="period-note">{weekLabel}</p>}

        {error && <div className="notice notice--error" role="alert">{error}</div>}

        {loading ? (
          <div className="loading-state" aria-label="Cargando clasificación">
            <span className="loader" /> Cargando los puntos…
          </div>
        ) : players.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__glyph" aria-hidden="true">♟</span>
            <h3>Aún no hay puntos cargados</h3>
            <p>La primera actualización automática recogerá los resultados disponibles del equipo.</p>
            <a href="https://lichess.org/team/colegas-de-kike/tournaments" target="_blank" rel="noreferrer">Ver torneos del equipo <span aria-hidden="true">↗</span></a>
          </div>
        ) : (
          <>
            <Podium players={players.slice(0, 3)} />
            {players.length > 3 && (
              <div className="table-wrap">
                <table className="ranking-table">
                  <thead>
                    <tr><th scope="col">PUESTO</th><th scope="col">JUGADOR</th><th scope="col">TORNEOS</th><th scope="col">PUNTOS</th></tr>
                  </thead>
                  <tbody>
                    {players.slice(3).map((player, index) => (
                      <tr key={player.playerId}>
                        <td className="rank-cell">{String(index + 4).padStart(2, "0")}</td>
                        <td><span className="table-avatar" aria-hidden="true">{initials(player.username)}</span><PlayerLink username={player.username} /></td>
                        <td className="event-cell">{player.tournaments}</td>
                        <td className="points-cell">{formatPoints(player.points)} <span>pts</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      <footer className="board-footer">
        <div className="footer-meta"><span className="sync-icon" aria-hidden="true">↻</span><span>Actualizado {formatDate(data.updatedAt, { hour: "2-digit", minute: "2-digit" })}</span></div>
        <div className="footer-meta">{period === "week" ? weekLabel : `Histórico desde ${formatDate(data.coverageFrom)}`}</div>
        <div className="footer-meta">{data.tournamentCount} {data.tournamentCount === 1 ? "torneo contado" : "torneos contados"}</div>
      </footer>
      <div className="site-credit"><span>HECHO PARA JUGAR EN EQUIPO</span><span>DATOS PÚBLICOS DE LICHESS</span></div>
    </main>
  );
}
