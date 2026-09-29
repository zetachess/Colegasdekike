export function madridDateKey(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function mondayKeyInMadrid(now) {
  const [year, month, day] = madridDateKey(now).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function upsertTournament(dataset, tournament) {
  const index = dataset.tournaments.findIndex((item) => item.id === tournament.id);
  if (index === -1) dataset.tournaments.push(tournament);
  else dataset.tournaments[index] = tournament;
  dataset.tournaments.sort((a, b) => a.startAt.localeCompare(b.startAt) || a.id.localeCompare(b.id));
  dataset.coverageFrom = dataset.tournaments[0]?.startAt ?? null;
  return dataset;
}

export function rankPlayers(dataset, period = "all", now = new Date()) {
  const weekStart = period === "week" ? mondayKeyInMadrid(now) : null;
  // The team Arena endpoint contains the team's Team Battle events. Swiss
  // tournaments remain outside this leaderboard, which is about team battles.
  const tournaments = dataset.tournaments.filter((tournament) =>
    tournament.type === "arena"
    && (!weekStart || madridDateKey(new Date(tournament.startAt)) >= weekStart),
  );
  const players = new Map();
  for (const tournament of tournaments) {
    for (const result of tournament.results) {
      const current = players.get(result.playerId) ?? {
        playerId: result.playerId,
        username: result.username,
        points: 0,
        tournaments: 0,
      };
      current.points += result.points;
      current.tournaments += 1;
      current.username = result.username || current.username;
      players.set(result.playerId, current);
    }
  }
  const entries = [...players.values()]
    .filter((player) => player.points > 0)
    .sort((a, b) => b.points - a.points || a.username.localeCompare(b.username, "es", { sensitivity: "base" }))
    .slice(0, 10);
  return { entries, weekStart, tournamentCount: tournaments.length };
}
