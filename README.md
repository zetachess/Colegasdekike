<a id="readme-top"></a>

<div align="center">
  <h1>♟️ Lichess Team Leaderboard</h1>
  <p>
    Automated weekly and all-time rankings for Lichess team battles.
    <br />
    <a href="https://colegasdekike.vercel.app/">View the live leaderboard</a>
    ·
    <a href="https://github.com/zetachess/Lichess-Team-Leaderboard/issues">Report a problem or suggest an improvement</a>
  </p>

  <p>
    <a href="https://github.com/zetachess/Lichess-Team-Leaderboard/actions/workflows/sync-leaderboard.yml"><img src="https://github.com/zetachess/Lichess-Team-Leaderboard/actions/workflows/sync-leaderboard.yml/badge.svg" alt="Leaderboard sync status"></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js" alt="Next.js 16"></a>
    <a href="https://lichess.org/"><img src="https://img.shields.io/badge/data-Lichess-000000?logo=lichess&logoColor=white" alt="Lichess data"></a>
    <a href="https://vercel.com/"><img src="https://img.shields.io/badge/deploy-Vercel-000000?logo=vercel&logoColor=white" alt="Deploy with Vercel"></a>
  </p>
</div>

## Contents

- [About](#about)
- [Features](#features)
- [How it works](#how-it-works)
- [Languages](#languages)
- [Data and privacy](#data-and-privacy)
- [Technology](#technology)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## About

Lichess Team Leaderboard turns a Lichess team's public tournament results into a leaderboard for a club, school, or online community.

This deployment was built for [Colegas de Kike](https://lichess.org/team/colegas-de-kike). It tracks player points, highlights the podium, and shows weekly and all-time rankings.

## Features

- Weekly and all-time rankings.
- Podium for the top three players.
- Team-aware scoring that excludes players representing opposing teams.
- Automatic results synchronization every 20 minutes.
- English, Spanish, and French interfaces.
- Responsive player search.
- No separate database: leaderboard data is published as JSON.

## How it works

```text
Public Lichess tournament results
              │
              ▼
     Scheduled GitHub Action
              │
              ▼
   Validated leaderboard data
              │
              ▼
      Live leaderboard on Vercel
```

The synchronizer collects completed Arena tournaments, checks the standings for the team, and avoids counting the same tournament or player result twice. Swiss tournaments are excluded. Weekly rankings use the `Europe/Madrid` time zone and the tournament's start date.

## Languages

| Route | Language |
| --- | --- |
| `/` | English |
| `/en` | English |
| `/es` | Spanish |
| `/fr` | French |

## Data and privacy

The leaderboard uses publicly available Lichess tournament results. Players do not need to provide passwords, access tokens, or private account information.

GitHub Actions saves updated scores using the repository's built-in workflow permissions. No personal Lichess credentials are needed.

## Technology

| Technology | Role |
| --- | --- |
| Next.js and React | Web application |
| TypeScript | Application code |
| GitHub Actions | Scheduled synchronization |
| GitHub | Source control and leaderboard data |
| Vercel | Hosting |
| Lichess | Public tournament data |
| Lucide React | Interface icons |

## Contributing

Bug reports, translations, documentation improvements, and code contributions are welcome. Please open an issue to report a problem or suggest an improvement.

## License

No license has been added yet. The repository is publicly visible, but reuse is not granted under an open-source license until a `LICENSE` file is added.

## Acknowledgments

Built for **Colegas de Kike** with appreciation for [Lichess](https://lichess.org/) and the communities that make online team chess possible.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
