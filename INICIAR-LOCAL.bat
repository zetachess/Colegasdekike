@echo off
cd /d "%~dp0"
echo Iniciando Lichess Team Leaderboard en http://localhost:3000
echo Para detener el servidor, cierra esta ventana.
call npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
pause
