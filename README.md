# Family Feud

Production-ready React game-show board for creating and playing Family Feud rounds. Built with Vite, React, TypeScript, and Material UI.

## Features

- **Board creator** — surveys with custom answers and point values; import/export JSON
- **Live game board** — classic numbered panels, reveal animations, round points
- **Teams & scoreboard** — named families with live scores
- **Strike system** — three strikes then steal opportunity
- **Steal rounds** — host resolves steal success/failure and awards points
- **Fast Money** — timed two-player round with host scoring and target (200)
- **Host controls** — reveal answers, strikes, control/face-off, score adjust, sound toggle
- **Sound effects** — Web Audio buzzers, reveals, wins (no external audio files required)

## Quick start (development)

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

## Deploy on Ubuntu (Docker Compose)

The deploy script installs Docker Engine and the Compose plugin if they are missing, then builds and starts the app.

```bash
chmod +x deploy.sh
./deploy.sh
```

Optional custom port:

```bash
PORT=80 ./deploy.sh
```

App listens on host port **8080** by default (`http://localhost:8080`).

Useful Compose commands from the project directory:

```bash
docker compose ps
docker compose logs -f
docker compose down
```

## How to play (host)

1. Set team names on the home screen.
2. Create a board (or import `public/sample-board.json`).
3. Open **Play** and keep **Host Controls** available on a second screen or tablet.
4. Face-off: assign control to the winning team, reveal answers, add strikes on misses.
5. At three strikes, resolve the steal from Host Controls.
6. Award the round (or let steal resolution award automatically), then reveal remaining answers.
7. Start **Fast Money** from the top bar when ready.

## Stack

- React 19 + TypeScript + Vite
- Material UI
- Nginx (production container)
- Docker Compose
