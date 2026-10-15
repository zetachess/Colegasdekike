const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export function parseRecords(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) return JSON.parse(trimmed);
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Tournament lists and results are normally newline-delimited JSON.
    }
  }
  return trimmed.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

export function parseDate(value) {
  if (typeof value === "number") {
    const date = new Date(value < 10_000_000_000 ? value * 1_000 : value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

export function tournamentStart(event) {
  return parseDate(event.startsAt ?? event.startAt ?? event.startDate ?? event.createdAt);
}

export function isFinished(event) {
  const status = String(event.status ?? "").toLowerCase();
  // Lichess encodes tournament state as 10 (created), 20 (started), 30 (finished).
  return status === "finished" || Number(event.status) === 30 || event.finished === true;
}

export function normalizePlayer(row) {
  const rawUsername = row.username ?? row.user?.name ?? row.user?.username ?? row.name;
  if (typeof rawUsername !== "string" || !rawUsername.trim()) return null;

  const username = rawUsername.trim();
  const rawPoints = row.score ?? row.points ?? row.point;
  const points = Number(rawPoints);
  if (!Number.isFinite(points)) return null;

  const rank = Number(row.rank);
  return {
    playerId: username.toLowerCase(),
    username,
    points,
    rank: Number.isFinite(rank) && rank > 0 ? rank : null,
  };
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

export function parseTeamBattleHtml(html) {
  const table = html.match(/<table\b[^>]*\btour__team-info\b[^>]*>([\s\S]*?)<\/table>/i)?.[1];
  if (!table) throw new Error("Lichess did not return the team-specific Arena standings table.");

  const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => match[1]);
  const players = [];
  for (const row of rows) {
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
    if (cells.length < 3) continue;

    const link = cells[1].match(/href=["']\/@\/([^"']+)["']/i);
    if (!link) continue;

    const username = decodeHtml(link[1]);
    const pointsText = decodeHtml(cells[2].replace(/<[^>]*>/g, "")).replace(/[\s,]/g, "").trim();
    const points = Number(pointsText);
    if (!Number.isFinite(points)) continue;

    const rankText = decodeHtml(cells[0].replace(/<[^>]*>/g, "")).trim();
    const rank = Number(rankText);
    players.push({
      playerId: username.toLowerCase(),
      username,
      points,
      rank: Number.isFinite(rank) && rank > 0 ? rank : null,
    });
  }
  return players;
}

export function createLichessClient({
  teamId,
  tournamentHistoryLimit,
  fetchImpl = fetch,
  sleepImpl = sleep,
}) {
  async function fetchText(url, accept = "application/x-ndjson, application/json", timeoutMs = 45_000) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetchImpl(url, {
        headers: {
          Accept: accept,
          "User-Agent": "lichess-team-leaderboard/1.0",
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.status === 429) {
        console.warn("Lichess rate limited this request; waiting 60 seconds.");
        await sleepImpl(61_000);
        continue;
      }
      if (response.status >= 500 && attempt < 3) {
        await sleepImpl(2 ** attempt * 2_000);
        continue;
      }
      if (!response.ok) throw new Error("Lichess returned " + response.status + " for " + url);
      return response.text();
    }
    throw new Error("Lichess request retries exhausted: " + url);
  }

  async function getTournamentList(type) {
    const endpoint = type === "arena" ? "arena" : "swiss";
    const url = "https://lichess.org/api/team/" + encodeURIComponent(teamId) + "/" + endpoint
      + "?max=" + encodeURIComponent(tournamentHistoryLimit);
    const body = await fetchText(url, "application/x-ndjson, application/json", 600_000);
    return parseRecords(body);
  }

  async function getTournamentResults(type, id) {
    if (type === "arena") {
      const encodedTeamId = encodeURIComponent(teamId);
      const html = await fetchText(
        "https://lichess.org/tournament/" + encodeURIComponent(id) + "/team/" + encodedTeamId,
        "text/html,application/xhtml+xml",
      );
      return parseTeamBattleHtml(html);
    }

    const body = await fetchText("https://lichess.org/api/swiss/" + encodeURIComponent(id) + "/results");
    const rows = parseRecords(body);
    const players = new Map();
    for (const row of rows) {
      const player = normalizePlayer(row);
      if (!player) continue;
      const current = players.get(player.playerId);
      if (!current || player.points > current.points) players.set(player.playerId, player);
    }
    return [...players.values()];
  }

  return { getTournamentList, getTournamentResults };
}
