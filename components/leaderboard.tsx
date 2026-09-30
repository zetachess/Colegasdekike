"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ChartNoAxesCombined,
  CircleAlert,
  ExternalLink,
  RefreshCw,
  Search,
  Swords,
  X,
} from "lucide-react";
import NumberTicker from "./number-ticker";
import SparklesTitle from "./sparkles-title";

type Player = {
  playerId: string;
  username: string;
  points: number;
  tournaments: number;
};

type RankedPlayer = Player & { rank: number };
type Period = "week" | "all";

type BoardData = {
  allTime: Player[];
  thisWeek: Player[];
  updatedAt: string | null;
  coverageFrom: string | null;
  tournamentCount: number;
  weekTournamentCount: number;
  totalPoints: number;
  weekStart: string | null;
};

const EMPTY_BOARD: BoardData = {
  allTime: [],
  thisWeek: [],
  updatedAt: null,
  coverageFrom: null,
  tournamentCount: 0,
  weekTournamentCount: 0,
  totalPoints: 0,
  weekStart: null,
};

const periods: { value: Period; label: string }[] = [
  { value: "week", label: "TOP SEMANAL!" },
  { value: "all", label: "Siempre" },
];

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

function TrophyPodium({ players }: { players: Player[] }) {
  const winners = [
    { player: players[1], rank: 2 },
    { player: players[0], rank: 1 },
    { player: players[2], rank: 3 },
  ].filter((winner): winner is { player: Player; rank: number } => Boolean(winner.player));
  if (!players.length) return null;

  return (
    <section className={`trophy-podium trophy-podium--${winners.length}`} aria-label="Podio de los tres primeros">
      {winners.map(({ player, rank }) => (
        <a className={`podium-place podium-place--${rank}`} href={profileUrl(player.username)} target="_blank" rel="noreferrer" key={player.playerId}>
          <span className="podium-medal" aria-hidden="true"><Image src="/trophy-3d.png" alt="" width={72} height={72} /></span>
          <span className="podium-rank">{rank === 1 ? "1.º puesto" : `${rank}.º puesto`}</span>
          <strong className="podium-player" title={player.username}>{player.username}</strong>
          <span className="podium-points">{formatPoints(player.points)} <small>puntos</small></span>
          <span className="podium-tournaments">{player.tournaments} {player.tournaments === 1 ? "torneo" : "torneos"}</span>
        </a>
      ))}
    </section>
  );
}

function PeriodTabs({ value, onChange }: { value: Period; onChange: (period: Period) => void }) {
  return (
    <div className="period-switch" role="tablist" aria-label="Periodo de clasificación">
      {periods.map((period, index) => (
        <button
          key={period.value}
          id={`tab-${period.value}`}
          type="button"
          role="tab"
          aria-controls="ranking-panel"
          aria-selected={value === period.value}
          tabIndex={value === period.value ? 0 : -1}
          className={value === period.value ? "is-active" : ""}
          onClick={() => onChange(period.value)}
          onKeyDown={(event) => {
            let next = index;
            if (event.key === "ArrowRight") next = (index + 1) % periods.length;
            else if (event.key === "ArrowLeft") next = (index - 1 + periods.length) % periods.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = periods.length - 1;
            else return;
            event.preventDefault();
            onChange(periods[next].value);
            const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
            tabs?.[next]?.focus();
          }}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

function PlayerTable({
  title,
  subtitle,
  players,
  totalPlayers,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  players: RankedPlayer[];
  totalPlayers: number;
  emptyMessage: string;
}) {
  return (
    <section className="ranking-card" aria-label={title}>
      <div className="ranking-card__heading">
        <div>
          <p className="section-kicker">Clasificación</p>
          <h2>{title}</h2>
        </div>
        <span className="ranking-card__period">{players.length === totalPlayers ? `${totalPlayers} jugadores` : `${players.length} de ${totalPlayers}`} <span aria-hidden="true">·</span> {subtitle}</span>
      </div>
      <div className="table-scroll">
        <table className="compact-table">
          <thead>
            <tr>
              <th className="column-rank" scope="col">#</th>
              <th scope="col">Jugador</th>
              <th className="column-score" scope="col">Puntos</th>
              <th className="column-events" scope="col">Torneos</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr><td className="table-empty" colSpan={4}>{emptyMessage}</td></tr>
            ) : players.map((player) => (
              <tr key={player.playerId}>
                <td className={`rank-number${player.rank <= 3 ? ` rank-number--${player.rank}` : ""}`}>
                  {String(player.rank).padStart(2, "0")}
                </td>
                <td className="player-cell">
                  <a href={profileUrl(player.username)} target="_blank" rel="noreferrer" title={`Ver ${player.username} en Lichess`}>
                    <span className="player-name">{player.username}</span><ExternalLink size={12} strokeWidth={1.8} aria-hidden="true" />
                  </a>
                </td>
                <td className="score-cell">
                  <div className="score-value">
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
  const [searchTerm, setSearchTerm] = useState("");
  const [period, setPeriod] = useState<Period>("week");
  const searchRef = useRef<HTMLInputElement>(null);

  const loadBoard = useCallback(async (initial = false) => {
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
    const initialTimer = window.setTimeout(() => void loadBoard(true), 0);
    const timer = window.setInterval(() => void loadBoard(), 5 * 60 * 1000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [loadBoard]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("es");
  const filterPlayers = (players: Player[]): RankedPlayer[] => players
    .map((player, index) => ({ ...player, rank: index + 1 }))
    .filter((player) => !normalizedSearch
      || player.username.toLocaleLowerCase("es").includes(normalizedSearch)
      || player.playerId.toLocaleLowerCase("es").includes(normalizedSearch));
  const sourcePlayers = period === "week" ? data.thisWeek : data.allTime;
  const players = filterPlayers(sourcePlayers);
  const hasData = Boolean(data.updatedAt || data.allTime.length);

  const stats = [
    { label: "Torneos contados", value: data.tournamentCount, icon: Swords },
    { label: "Puntos sumados", value: data.totalPoints, icon: ChartNoAxesCombined },
  ];

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <a className="team-link" href="https://lichess.org/team/colegas-de-kike" target="_blank" rel="noreferrer">
          Ver equipo <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
        </a>
      </header>

      <div className="dashboard-title">
        <div>
          <p className="dashboard-eyebrow"><span className="status-dot" /> Torneos por equipos</p>
          <SparklesTitle />
        </div>
        <span className="week-range">{formatWeekRange(data.weekStart)}</span>
      </div>

      {error && (
        <div className="dashboard-error" role="alert">
          <CircleAlert size={17} aria-hidden="true" />
          <span>{error}</span>
          <button type="button" onClick={() => { setLoading(true); void loadBoard(true); }}><RefreshCw size={15} aria-hidden="true" /> Reintentar</button>
        </div>
      )}

      {loading ? (
        <div className="dashboard-loading" aria-label="Cargando clasificación">
          <RefreshCw className="loading-icon" size={19} aria-hidden="true" /> Cargando puntos de los torneos…
        </div>
      ) : !hasData && error ? null : (
        <>
          <section className="stats-grid" aria-label="Resumen histórico">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <stat.icon className="stat-mark" size={21} strokeWidth={1.7} aria-hidden="true" />
                <strong><NumberTicker value={stat.value} /></strong>
                <span className="stat-label">{stat.label}</span>
              </article>
            ))}
          </section>

          <section className="single-ranking" aria-label="Clasificación de jugadores">
            <PeriodTabs value={period} onChange={setPeriod} />
            <div id="ranking-panel" role="tabpanel" aria-labelledby={`tab-${period}`}>
              <div className="player-search">
                <div className="search-field">
                  <Search size={18} strokeWidth={1.8} aria-hidden="true" />
                  <label className="visually-hidden" htmlFor="player-search">Buscar jugador por nombre</label>
                  <input
                    id="player-search"
                    ref={searchRef}
                    type="search"
                    placeholder="Buscar jugador por nombre"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setSearchTerm("");
                        event.currentTarget.blur();
                      }
                    }}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {searchTerm ? (
                    <button className="search-clear" type="button" onClick={() => { setSearchTerm(""); searchRef.current?.focus(); }} aria-label="Borrar búsqueda"><X size={16} aria-hidden="true" /></button>
                  ) : (
                    <kbd className="search-shortcut">Ctrl K</kbd>
                  )}
                </div>
                <span className="search-hint">{normalizedSearch ? `${players.length} ${players.length === 1 ? "resultado" : "resultados"}` : "Busca entre todos los jugadores"}</span>
              </div>
              {!normalizedSearch && <TrophyPodium players={sourcePlayers.slice(0, 3)} />}
              <PlayerTable
                title={`Jugadores · ${period === "week" ? "TOP SEMANAL!" : "Siempre"}`}
                subtitle={period === "all" ? "Histórico" : `${data.weekTournamentCount} ${data.weekTournamentCount === 1 ? "torneo" : "torneos"}`}
                players={players}
                totalPlayers={sourcePlayers.length}
                emptyMessage={normalizedSearch
                  ? "No hay jugadores que coincidan."
                  : period === "all" ? "Aún no hay puntos históricos disponibles." : "Todavía no hay puntos esta semana."}
              />
            </div>
          </section>
        </>
      )}

      <footer className="dashboard-footer">
        <span className="footer-sync"><RefreshCw size={13} strokeWidth={1.8} aria-hidden="true" /> Actualizado {formatDate(data.updatedAt, { hour: "2-digit", minute: "2-digit" })}</span>
        <span>Histórico desde {formatDate(data.coverageFrom)}</span>
        <span>Semana natural · hora de Madrid</span>
      </footer>
    </main>
  );
}
