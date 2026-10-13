<a id="readme-top"></a>

<div align="center">
  <h1>♟️ Lichess Team Leaderboard</h1>
  <p>
    Automated weekly and all-time rankings for Lichess team battles.
    <br />
    <a href="https://colegasdekike.vercel.app/">View the live leaderboard</a>
    ·
    <a href="https://github.com/zetachess/Lichess-Team-Leaderboard/issues">Report a problem</a>
    ·
    <a href="https://github.com/zetachess/Lichess-Team-Leaderboard/issues">Request an improvement</a>
  </p>

  <p>
    <a href="https://github.com/zetachess/Lichess-Team-Leaderboard/actions/workflows/sync-leaderboard.yml"><img src="https://github.com/zetachess/Lichess-Team-Leaderboard/actions/workflows/sync-leaderboard.yml/badge.svg" alt="Leaderboard sync status"></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js" alt="Next.js 16"></a>
    <a href="https://lichess.org/"><img src="https://img.shields.io/badge/data-Lichess-000000?logo=lichess&logoColor=white" alt="Lichess data"></a>
    <a href="https://vercel.com/"><img src="https://img.shields.io/badge/deploy-Vercel-000000?logo=vercel&logoColor=white" alt="Deploy with Vercel"></a>
  </p>
</div>

## Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Adapt It for Another Team](#adapt-it-for-another-team)
- [Languages](#languages)
- [Data and Reliability](#data-and-reliability)
- [Technology](#technology)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## About the Project

Lichess Team Leaderboard turns a Lichess team's public tournament results into a polished leaderboard for a club, school, or online community.

The current deployment was built for [Colegas de Kike](https://lichess.org/team/colegas-de-kike). It calculates player points, highlights the podium, supports weekly and all-time views, and refreshes automatically without a database or personal Lichess token.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Features

- **Weekly and all-time standings** with eligible players sorted by score.
- **Dynamic podium** for the top three players in the selected period.
- **Team-aware scoring** that excludes players representing opposing teams.
- **Automatic synchronization** through GitHub Actions every 20 minutes.
- **English, Spanish, and French interfaces** with localized dates and numbers.
- **Player search** with responsive and keyboard-friendly controls.
- **Database-free persistence** using JSON on the `leaderboard-data` branch.
- **Public-data collection** with GitHub's built-in `GITHUB_TOKEN`; no personal Lichess token is required.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## How It Works

```text
Lichess team battles
        │
        ▼
Scheduled GitHub Action
        │
        ▼
Tournament collection and point validation
        │
        ▼
Deduplicated data/leaderboard.json
        │
        ▼
Next.js API and multilingual leaderboard
```

The synchronization job requests up to 1,000 Arena tournaments associated with the configured team. It imports completed events, reads the standings for the selected team, and deduplicates tournament and player records so repeated runs do not award points twice.

The current scoring model excludes Swiss tournaments. Weekly standings follow the calendar week in the `Europe/Madrid` time zone and assign a tournament to the week in which it started.

Production code runs from `main`. Generated leaderboard data lives on `leaderboard-data`, so routine score updates do not require a frontend deployment.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

### Prerequisites

- Node.js 20.9 or newer.
- npm.
- A public Lichess team with Arena tournament history.

### Installation

```bash
git clone https://github.com/zetachess/Lichess-Team-Leaderboard.git
cd Lichess-Team-Leaderboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run the checks

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

### Run the collector manually

```bash
node scripts/sync-leaderboard.mjs
```

By default, the collector writes to `data/leaderboard.json`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `LICHESS_TEAM_ID` | `colegas-de-kike` | Lichess team slug collected by the synchronizer |
| `LICHESS_TOURNAMENT_LIMIT` | `1000` | Maximum number of Arena tournaments requested |
| `LEADERBOARD_DATA_PATH` | `data/leaderboard.json` | Local output path for generated data |

The scheduled workflow is defined in [`.github/workflows/sync-leaderboard.yml`](.github/workflows/sync-leaderboard.yml).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Adapt It for Another Team

1. Fork the repository and enable **Settings → Actions → General → Workflow permissions → Read and write permissions**.
2. Set `LICHESS_TEAM_ID` for the synchronization workflow or replace the collector's default team ID.
3. Update the raw data URL and expected team ID in [`app/api/leaderboard/route.ts`](app/api/leaderboard/route.ts) so the deployed app reads your fork's `leaderboard-data` branch.
4. Replace the team name, link, visual identity, and metadata in the interface.
5. Run **Actions → Actualizar clasificación → Run workflow** once to create the initial data.
6. Import the repository into [Vercel](https://vercel.com/) and configure the production deployment.

The current API implementation expects the `leaderboard-data` branch to be publicly readable. No separate database is required.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Languages

| Route | Language |
| --- | --- |
| `/` | English (default) |
| `/en` | English compatibility route |
| `/es` | Spanish |
| `/fr` | French |

Interface copy is maintained in [`lib/translations.ts`](lib/translations.ts). Player names and scores remain unchanged when switching languages.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Data and Reliability

The collector is intentionally conservative:

- Imports only finished tournaments.
- Stores each tournament and player result once.
- Processes Lichess requests sequentially.
- Waits and retries after an HTTP `429` rate-limit response.
- Records unavailable historical standings instead of retrying forever.
- Fails visibly if the source structure changes, avoiding silent attribution of incorrect points.

All standings come from publicly accessible Lichess tournament data. Players do not need to provide passwords, access tokens, or private account information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Technology

| Technology | Role |
| --- | --- |
| Next.js 16 and React 19 | Web application and interface |
| TypeScript | Typed frontend and API code |
| GitHub Actions | Scheduled data synchronization |
| GitHub | Source control and JSON persistence |
| Vercel | Production hosting |
| Lichess | Public tournament data |
| Lucide React | Interface icons |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributing

Bug reports, translations, documentation improvements, and code contributions are welcome.

Before opening a pull request:

1. Create a focused branch.
2. Explain the behavior or documentation change.
3. Run the lint, typecheck, build, and test commands.
4. Include screenshots for meaningful interface changes.
5. Keep generated leaderboard data and source code changes clearly separated.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

No license has been added yet. Until a `LICENSE` file is included, the repository is publicly visible but no open-source license is granted.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Acknowledgments

Built for **Colegas de Kike** with appreciation for [Lichess](https://lichess.org/), its public platform, and the communities that make online team chess possible.

<p align="right">(<a href="#readme-top">back to top</a>)</p>