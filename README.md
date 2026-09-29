# Clasificación de Colegas de Kike

Web pública con el top 10 de puntos individuales sumados por los miembros de Colegas de Kike en Batallas por equipos de Lichess, de todos los tiempos y de la semana actual.

## Cómo funciona

- GitHub Actions consulta cada hora hasta 1.000 torneos Arena asociados al equipo `colegas-de-kike`; la API los devuelve del más reciente al más antiguo. En el histórico consultado, esos eventos son Batallas por equipos. Puedes ajustar el límite con `LICHESS_TOURNAMENT_LIMIT`.
- Importa la tabla pública de jugadores de Colegas de Kike dentro de cada batalla, no la clasificación general que mezcla a todos los equipos. Los torneos Swiss no se cuentan en este ranking.
- La acción importa los resultados solo cuando el torneo termina. Cada torneo y jugador se guardan una sola vez, así que una nueva ejecución no duplica puntos.
- Los datos persisten como JSON en la rama `leaderboard-data`. GitHub Actions usa el `GITHUB_TOKEN` automático del repositorio; no hay base de datos externa ni claves que crear.
- No requiere registrarte en otro servicio: utiliza tus cuentas de GitHub y Vercel, que ya forman parte del plan.
- Vercel sirve la web desde `main` y lee el JSON público de `leaderboard-data`. `vercel.json` evita despliegues cada vez que cambia solo la información; los cambios del frontend en `main` sí se despliegan.
- El top semanal usa la semana natural de Madrid y asigna los puntos a la semana en que empezó el torneo.

## Publicar

1. Crea un repositorio **público** en GitHub y sube el contenido de esta carpeta a su rama principal. Al subirlo, la importación inicial arranca sola; después se ejecuta cada hora.
2. En GitHub, permite a Actions escribir en el repositorio: **Settings → Actions → General → Workflow permissions → Read and write permissions**. El workflow usa su token integrado, no un token personal.
3. GitHub puede retrasar los trabajos programados cuando tiene mucha carga. También puedes lanzarlo en cualquier momento desde **Actions → Actualizar clasificación → Run workflow**.
4. Importa el repositorio en Vercel. Activa la exposición de variables de sistema de Git en el proyecto para que la web detecte automáticamente el propietario y el nombre del repositorio.

La rama `leaderboard-data` debe ser pública para que Vercel pueda leer el JSON sin credenciales. La importación recoge el histórico de Batallas por equipos accesible por la API (hasta el límite configurado de 1.000); la web indica la fecha más antigua disponible. Los resultados futuros se agregan sin intervención manual.

## Desarrollo local

Requiere Node.js 20.9 o posterior.

```bash
npm install
npm run dev
```

Para probar la sincronización manualmente:

```bash
node scripts/sync-leaderboard.mjs
```

Los datos se obtienen de la API pública de Lichess y de su página pública de resultados por equipo para Arena; las solicitudes se hacen secuencialmente. Si Lichess devuelve `429`, el recolector espera un minuto antes de reintentar. Si Lichess cambia la estructura de la tabla Arena, la importación de ese torneo falla de forma visible en Actions en vez de atribuir puntos de otros equipos.
