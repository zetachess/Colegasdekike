# ♟️ Lichess Team Leaderboard

### Automated rankings for Lichess Team Battles

Turn a Lichess team's public tournament results into a polished weekly and all-time leaderboard. The application collects each player's points, highlights the podium, and keeps the standings up to date without a database or a personal Lichess token.

Originally built for **[Colegas de Kike](https://lichess.org/team/colegas-de-kike)**, the project can also serve as a foundation for chess clubs, schools, and online communities.

[**View the live leaderboard →**](https://colegasdekike.vercel.app/)

[![Leaderboard sync](https://github.com/zetachess/Lichess-Team-Leaderboard/actions/workflows/sync-leaderboard.yml/badge.svg)](https://github.com/zetachess/Lichess-Team-Leaderboard/actions/workflows/sync-leaderboard.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org/)
[![Lichess](https://img.shields.io/badge/data-Lichess-000000?logo=lichess&logoColor=white)](https://lichess.org/)
[![Deploy with Vercel](https://img.shields.io/badge/deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

## Features

- **Weekly and all-time standings** with every eligible player in score order.
- **Dynamic podium** for the top three players in the selected period.
- **Team-specific scoring** that excludes players representing opposing teams.
- **Automatic synchronization** every 20 minutes through GitHub Actions.
- **English, Spanish, and French** interfaces with localized dates and numbers.
- **Player search**, responsive layouts, and keyboard-friendly controls.
- **Database-free persistence** using JSON in the `leaderboard-data` branch.
- **No private credentials**: the collector reads public Lichess data and uses GitHub's built-in `GITHUB_TOKEN`.

## How it works

```text
Lichess Team Battles
        │
        ▼
GitHub Actions (every 20 minutes)
        │
        ▼
Tournament collector and point validation
        │
        ▼
data/leaderboard.json on leaderboard-data
        │
        ▼
Next.js API and leaderboard interface
```

The synchronization job requests up to 1,000 Arena tournaments associated with the team, imports only completed events, and reads the standings for that specific team. Tournament and player records are deduplicated, so repeated runs do not award points twice.

Swiss tournaments are not part of the current scoring model. The weekly table follows the calendar week in the `Europe/Madrid` time zone and assigns each tournament to the week in which it started. The interface also shows the earliest date covered by the available Lichess history.

The production application runs from `main`. Its generated data lives in `leaderboard-data`, so routine score updates do not trigger a new frontend deployment.

## Languages

| Route | Language |
|---|---|
| `/` | English (default) |
| `/en` | English compatibility route |
| `/es` | Spanish |
| `/fr` | French |

Interface copy is maintained in [`lib/translations.ts`](lib/translations.ts). Player names and scores are left unchanged when switching languages.

## Run locally

You need Node.js 20.9 or newer and npm.

```bash
git clone https://github.com/zetachess/Lichess-Team-Leaderboard.git
cd Lichess-Team-Leaderboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To run the project checks:

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

You can also run the collector manually:

```bash
node scripts/sync-leaderboard.mjs
```

The collector writes to `data/leaderboard.json` by default. These optional environment variables are supported:

| Variable | Default | Purpose |
|---|---|---|
| `LICHESS_TEAM_ID` | `colegas-de-kike` | Lichess team slug collected by the script |
| `LICHESS_TOURNAMENT_LIMIT` | `1000` | Maximum number of Arena tournaments requested |
| `LEADERBOARD_DATA_PATH` | `data/leaderboard.json` | Local output file for generated data |

## Adapt it for another team

1. Fork the repository and enable **Settings → Actions → General → Workflow permissions → Read and write permissions**.
2. Set `LICHESS_TEAM_ID` for the collection step in [`.github/workflows/sync-leaderboard.yml`](.github/workflows/sync-leaderboard.yml), or replace the collector's default team ID.
3. Update the raw data URL and expected team ID in [`app/api/leaderboard/route.ts`](app/api/leaderboard/route.ts) so the deployed app reads your fork's `leaderboard-data` branch.
4. Replace the team link, name, and metadata in the interface with your own branding.
5. Run **Actions → Actualizar clasificación → Run workflow** once to create the initial data, then import the repository into [Vercel](https://vercel.com/).

The `leaderboard-data` branch must remain publicly readable for the current API implementation. No separate database is required.

## Reliability and data integrity

The collector is intentionally conservative:

- It imports only finished tournaments.
- It stores each tournament and player result once.
- It processes Lichess requests sequentially.
- It waits and retries after an HTTP `429` rate-limit response.
- It records unavailable historical standings instead of retrying them forever.
- It fails visibly if the team results page no longer has the expected structure, avoiding silent attribution of incorrect points.

All standings come from publicly accessible Lichess tournament data. Players do not need to provide passwords, access tokens, or private account information.

## Technology

| Technology | Role |
|---|---|
| Next.js 16 and React 19 | Web application and user interface |
| TypeScript | Typed frontend and API code |
| GitHub Actions | Scheduled data synchronization |
| GitHub | Source control and JSON persistence |
| Vercel | Production hosting |
| Lichess | Public tournament data |
| Lucide React | Interface icons |

## Contributing

Bug reports, translations, documentation improvements, and code contributions are welcome. Fork the repository, create a focused branch, run the checks above, and open a pull request explaining the change.

## License

No license has been added yet. Until a `LICENSE` file is included, the repository's source is publicly visible but no open-source license is granted.

## Acknowledgments

Built for **Colegas de Kike** with appreciation for [Lichess](https://lichess.org/), its open platform, and the communities that make online team chess possible.
