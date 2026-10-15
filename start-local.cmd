@echo off
cd /d "%~dp0"
echo Starting Lichess Team Leaderboard at http://localhost:3001
call npm.cmd run dev -- -p 3001
pause
