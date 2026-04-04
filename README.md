<div align="center">

```
  ______          _        ____        _   _   _           _
 / _____|        | |      |  _ \      | | | | | |         / \
| |     ___   __| | ___  | |_) | __ _| |_| |_| | ___    /   \  _ __ ___ _ __   __ _
| |    / _ \ / _` |/ _ \ |  _ < / _` | __| __| |/ _ \  / /_\ \| '__/ _ \ '_ \ / _` |
| |___| (_) | (_| |  __/ | |_) | (_| | |_| |_| |  __/ / _____ \ | |  __/ | | | (_| |
 \_____\___/ \__,_|\___| |____/ \__,_|\__|\__|_|\___| /_/     \_\_|  \___|_| |_|\__,_|
```

**Real-time competitive coding. Match. Battle. Rise.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

A real-time multiplayer competitive coding platform where two developers get matched by ELO rating, receive the same algorithmic problem, and race to solve it live -- with spectators watching, full match replays, and a global leaderboard. Think **LeetCode meets Chess.com**.

---

## Screenshots

<!-- screenshot: Landing Page -->
_Landing Page -- dark-themed hero section with matchmaking CTA, live match ticker, and leaderboard preview._

<!-- screenshot: Battle Arena -->
_Battle Arena -- split-screen Monaco editors, problem panel, live timer, test case results, and opponent code view with 500ms delay._

<!-- screenshot: Leaderboard -->
_Leaderboard -- global and weekly rankings with ELO ratings, win rates, tier badges, and pagination._

<!-- screenshot: Replay System -->
_Replay System -- dual Monaco editors with timeline scrubber, playback speed controls, and event markers for submissions and test runs._

<!-- screenshot: Profile Page -->
_Profile Page -- rating history chart, language distribution pie chart, match history, win streak stats, and tier badge._

---

## Features

- **Real-time 1v1 code battles** with ELO-based matchmaking (initial range +/-200, expanding +/-50 every 10s)
- **Monaco Editor** (the VS Code engine) with full syntax highlighting for C++, Python, JavaScript, and Java
- **Sandboxed code execution** via Piston API with per-test-case verdicts: AC, WA, TLE, RTE, CE
- **ELO rating system** (K=32) with competitive tiers: Bronze, Silver, Gold, Platinum, Diamond, Master
- **Live spectator mode** -- watch any in-progress match with real-time code updates from both players
- **Full match replay system** with timeline scrubber, play/pause, speed controls (1x/2x/4x), and event markers
- **User profiles** with rating history charts, language distribution, solve time stats, and win streaks
- **Global and weekly leaderboards** backed by Redis sorted sets with automatic weekly resets
- **Problem bank** with 20+ classic algorithmic problems, difficulty filters (easy/medium/hard), and tag filters
- **Custom challenge rooms** -- invite friends to private matches with shareable links
- **Anti-cheat system** -- paste detection, tab-switch monitoring, code similarity analysis, and 500ms opponent code delay
- **Admin panel** for full problem CRUD (create, edit, delete problems and test cases)
- **Match history** with filters, side-by-side code comparison, and detailed per-test-case results
- **Sound effects** for match events and victory confetti animation
- **Responsive design** -- mobile-responsive on all pages except the battle arena (desktop-only with a "desktop required" notice on mobile)

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS | Fast HMR, strict types, utility-first CSS with zero runtime cost |
| **State** | Zustand | Lightweight, zero boilerplate, no providers or reducers |
| **Editor** | Monaco Editor (`@monaco-editor/react`) | Full VS Code editing engine -- syntax highlighting, IntelliSense, minimap |
| **Charts** | Recharts | Composable, declarative, built for React |
| **Real-time** | Socket.IO | WebSocket with automatic HTTP long-polling fallback, built-in rooms and namespaces |
| **Backend** | Node.js + Express + TypeScript | Non-blocking I/O for concurrent matches, shared types with frontend |
| **Database** | MongoDB + Mongoose | Flexible schema for embedded match events, fast writes for real-time event logging |
| **Cache / Queue** | Redis via ioredis | Sorted sets for leaderboards and matchmaking queue, sub-millisecond reads |
| **Code Execution** | Piston API | Sandboxed multi-language execution, Docker-isolated, supports 60+ languages |
| **Auth** | JWT + bcryptjs | Stateless authentication, secure password hashing with salt rounds |

---

## Architecture

```
                                   +------------------+
                                   |   Piston API     |
                                   | (Code Execution) |
                                   +--------+---------+
                                            |
+-------------------+              +--------+---------+           +-------------+
|                   |   REST API   |                  |           |             |
|   React Client   +------------->+  Express Server  +---------->+   MongoDB   |
|   (Vite @ 5173)  |              |   (Port 5000)    |           |  (Database) |
|                   +<------------>+                  |           |             |
+-------------------+  Socket.IO   +--------+---------+           +-------------+
        |                                   |
        |                                   |
        v                          +--------+---------+
   Browser (User)                  |                  |
                                   |      Redis       |
                                   | (Cache + Queue)  |
                                   +------------------+
```

**Data flow:**
- REST API handles auth, problem CRUD, match history, leaderboard queries, and code submission
- Socket.IO handles real-time matchmaking, live code sync between opponents, spectator updates, and match state transitions
- Redis stores the matchmaking queue (sorted set by ELO), global/weekly leaderboards (sorted sets), and active match metadata
- MongoDB persists users, problems, matches (with full event logs for replay), and submissions
- Piston API executes user code in sandboxed Docker containers and returns stdout/stderr per test case

---

## Monorepo Structure

```
code-battle-arena/
+-- package.json                  # Root workspace config (npm workspaces)
+-- docker-compose.piston.yml    # Piston API local setup
+-- CLAUDE.md                    # Project specification
+-- README.md
+-- client/                      # React frontend
|   +-- public/
|   +-- src/
|   |   +-- main.tsx
|   |   +-- App.tsx
|   |   +-- components/
|   |   |   +-- layout/          # Navbar, Sidebar, Footer
|   |   |   +-- editor/          # Monaco editor wrapper, read-only viewer
|   |   |   +-- battle/          # Battle room UI (timer, status, panels)
|   |   |   +-- match/           # Matchmaking queue, countdown, results
|   |   |   +-- problem/         # Problem description, test case panel
|   |   |   +-- replay/          # Replay player, timeline scrubber
|   |   |   +-- leaderboard/     # Leaderboard table, filters
|   |   |   +-- profile/         # Profile card, stats charts
|   |   |   +-- admin/           # Problem CRUD, admin dashboard
|   |   |   +-- ui/              # Reusable primitives (Button, Modal, Toast)
|   |   +-- pages/               # Route-level page components
|   |   +-- store/               # Zustand stores (auth, battle, match, ui)
|   |   +-- services/            # API client, Socket.IO singleton, Piston client
|   |   +-- hooks/               # Custom hooks (useAuth, useBattle, useSocket, useTimer)
|   |   +-- types/               # Shared TypeScript interfaces
|   |   +-- utils/               # ELO calc, formatters, constants
|   |   +-- styles/              # globals.css (Tailwind directives)
|   +-- index.html
|   +-- tailwind.config.ts
|   +-- tsconfig.json
|   +-- vite.config.ts
|   +-- package.json
+-- server/                      # Express backend
|   +-- src/
|   |   +-- index.ts             # Entry point (Express + Socket.IO bootstrap)
|   |   +-- config/              # MongoDB, Redis, env validation
|   |   +-- models/              # Mongoose models (User, Problem, Match, Submission)
|   |   +-- routes/              # Express route definitions
|   |   +-- controllers/         # Request handlers (thin, delegate to services)
|   |   +-- services/            # Business logic (matchmaking, executor, ELO, replay)
|   |   +-- socket/              # Socket.IO server setup + event handlers
|   |   +-- middleware/          # Auth, admin, error handler, rate limiter
|   |   +-- types/               # Server-specific TypeScript interfaces
|   |   +-- utils/               # Constants, helper functions
|   +-- tsconfig.json
|   +-- package.json
+-- shared/                      # Shared types (optional)
    +-- types.ts
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm 9+
- **MongoDB** (local install or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
- **Redis** (local install, [Redis Cloud](https://redis.com/try-free/), or Docker: `docker run -p 6379:6379 redis`)
- **Docker** (optional, for self-hosting Piston API -- the public API is used by default in development)

### 1. Clone the repository

```bash
git clone https://github.com/Anubhav1410/code-battle-arena.git
cd code-battle-arena
```

### 2. Install dependencies

The project uses npm workspaces. A single install from the root handles both client and server:

```bash
npm install
```

### 3. Configure environment variables

**Server** -- create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/code-battle-arena
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
PISTON_API_URL=https://emkc.org/api/v2/piston
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Client** -- create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Start Piston API (optional -- for local code execution)

The public Piston API at `https://emkc.org/api/v2/piston` is used by default during development. To self-host:

```bash
docker compose -f docker-compose.piston.yml up -d
```

Install language runtimes:

```bash
# Install C++, Python, JavaScript, and Java runtimes
curl -X POST http://localhost:2000/api/v2/packages -H 'Content-Type: application/json' \
  -d '{"language": "cpp", "version": "10.2.0"}'
curl -X POST http://localhost:2000/api/v2/packages -H 'Content-Type: application/json' \
  -d '{"language": "python", "version": "3.10.0"}'
curl -X POST http://localhost:2000/api/v2/packages -H 'Content-Type: application/json' \
  -d '{"language": "javascript", "version": "18.15.0"}'
curl -X POST http://localhost:2000/api/v2/packages -H 'Content-Type: application/json' \
  -d '{"language": "java", "version": "15.0.2"}'
```

### 5. Seed the database

Populate the database with test users, an admin account, and 20 algorithmic problems:

```bash
npm run seed -w server
```

This creates:
- **Admin account:** username `admin` / password `admin123`
- **Test accounts:** username `player1` / password `test123`, username `player2` / password `test123`
- **20 problems** across easy, medium, and hard difficulty with full test suites

### 6. Start the development servers

```bash
npm run dev
```

This runs both the client (Vite on port 5173) and server (Express on port 5000) concurrently.

### 7. Open the app

Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Create a new account | No |
| `POST` | `/api/auth/login` | Login, returns JWT | No |
| `GET` | `/api/auth/me` | Get current user profile | Yes |

### Problems

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/problems` | List problems (filterable by difficulty, tags) | Yes |
| `GET` | `/api/problems/:slug` | Get problem details by slug | Yes |
| `POST` | `/api/problems/:slug/run` | Run code against visible test cases | Yes |
| `POST` | `/api/problems/:slug/submit` | Submit code against all test cases (including hidden) | Yes |

### Matches

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/matches/history` | Get current user's match history | Yes |
| `GET` | `/api/matches/live/list` | List in-progress matches available for spectating | Yes |
| `GET` | `/api/matches/:id` | Get match details | Yes |
| `GET` | `/api/matches/:id/replay` | Get full match replay data (events array) | Yes |

### Leaderboard

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/leaderboard` | Get leaderboard (`?type=global\|weekly&page=1&limit=50`) | No |

### Users

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/users/profile/:username` | Get public profile by username | No |
| `GET` | `/api/users/matches` | Get authenticated user's match history | Yes |

### Admin

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/admin/problems` | List all problems (admin view) | Admin |
| `POST` | `/api/admin/problems` | Create a new problem | Admin |
| `PUT` | `/api/admin/problems/:id` | Update a problem | Admin |
| `DELETE` | `/api/admin/problems/:id` | Delete a problem | Admin |

---

## Socket Events

### Client to Server

| Event | Payload | Description |
|---|---|---|
| `matchmaking:join` | `{ language }` | Enter the matchmaking queue |
| `matchmaking:cancel` | -- | Leave the matchmaking queue |
| `match:ready` | `{ matchId }` | Confirm player is ready in the battle room |
| `code:update` | `{ matchId, code, language }` | Send code update to opponent (debounced 300ms) |
| `match:run_tests` | `{ matchId, code, language }` | Run code against visible test cases |
| `match:submit` | `{ matchId, code, language }` | Submit code against all test cases |
| `spectate:join` | `{ matchId }` | Join a match as spectator |
| `spectate:leave` | `{ matchId }` | Leave spectator room |

### Server to Client

| Event | Payload | Description |
|---|---|---|
| `matchmaking:queued` | `{ position, estimatedWait }` | Confirmation of queue entry |
| `match:found` | `{ matchId, opponent, problem }` | Match has been found, transition to battle room |
| `match:countdown` | `{ seconds }` | Countdown tick before match starts |
| `match:start` | `{ problem, startTime }` | Match begins, problem revealed |
| `code:opponent_update` | `{ code }` | Opponent's code update (500ms delayed) |
| `match:test_result` | `{ results: [{ verdict, time, output }] }` | Test run results |
| `match:submit_result` | `{ passed, total, verdict }` | Submission results |
| `match:finished` | `{ winner, players, ratingChanges }` | Match ended, final results |
| `match:opponent_disconnected` | `{ gracePeriod }` | Opponent lost connection (60s grace period) |
| `spectate:update` | `{ player1Code, player2Code, scores }` | Live state update for spectators |
| `spectate:count` | `{ count }` | Updated spectator count |

---

## ELO Rating Tiers

| Tier | Rating Range | Color |
|---|---|---|
| Bronze | 0 -- 1199 | `#CD7F32` |
| Silver | 1200 -- 1399 | `#C0C0C0` |
| Gold | 1400 -- 1599 | `#FFD700` |
| Platinum | 1600 -- 1799 | `#00CED1` |
| Diamond | 1800 -- 1999 | `#B9F2FF` |
| Master | 2000+ | `#FF4500` |

---

## Deployment

### Step 1: MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user and whitelist `0.0.0.0/0` for access from Railway
3. Get the connection string: `mongodb+srv://user:pass@cluster.mongodb.net/code-battle-arena`

### Step 2: Upstash Redis

1. Create a free database at [Upstash](https://upstash.com/)
2. Copy the Redis URL (starts with `rediss://`)

### Step 3: Backend on Railway

1. Push your code to GitHub
2. Go to [Railway](https://railway.app/) and create a new project from your repo
3. Set the root directory to `server`
4. Railway will detect the `Dockerfile` and build automatically
5. Set these environment variables in Railway dashboard:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `REDIS_URL` | Your Upstash Redis URL |
| `JWT_SECRET` | A strong random string (run `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | `7d` |
| `PISTON_API_URL` | Your Piston API URL (see Step 5) |
| `CLIENT_URL` | Your Vercel frontend URL (e.g., `https://code-battle.vercel.app`) |
| `NODE_ENV` | `production` |

6. Railway auto-assigns `PORT` -- no need to set it
7. After deploy, note your backend URL (e.g., `https://your-app.up.railway.app`)
8. Verify: `curl https://your-app.up.railway.app/api/health`

### Step 4: Frontend on Vercel

1. Go to [Vercel](https://vercel.com/) and import the same GitHub repo
2. Set the **root directory** to `client`
3. The `vercel.json` handles build settings and SPA rewrites automatically
4. Set environment variables:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-app.up.railway.app/api` |
| `VITE_SOCKET_URL` | `https://your-app.up.railway.app` |

5. Deploy. Vercel auto-detects Vite
6. Copy your Vercel URL and update `CLIENT_URL` in Railway to match

### Step 5: Piston Code Execution

Piston requires Docker and cannot run on Railway. Options:

**Option A: Cheap VPS (recommended for production)**

1. Get a $5/mo VPS (DigitalOcean, Hetzner, Linode)
2. Install Docker and run:

```bash
docker compose -f docker-compose.piston.yml up -d

# Install language runtimes
curl -X POST http://localhost:2000/api/v2/packages -H 'Content-Type: application/json' -d '{"language":"gcc","version":"10.2.0"}'
curl -X POST http://localhost:2000/api/v2/packages -H 'Content-Type: application/json' -d '{"language":"python","version":"3.10.0"}'
curl -X POST http://localhost:2000/api/v2/packages -H 'Content-Type: application/json' -d '{"language":"node","version":"18.15.0"}'
curl -X POST http://localhost:2000/api/v2/packages -H 'Content-Type: application/json' -d '{"language":"java","version":"15.0.2"}'
```

3. Set `PISTON_API_URL=http://your-vps-ip:2000/api/v2` in Railway

**Option B: Public Piston API (temporary/development)**

Set `PISTON_API_URL=https://emkc.org/api/v2/piston` in Railway. This may have rate limits or require an API key.

### Step 6: Seed the Database

Run the seed script against your production MongoDB:

```bash
MONGODB_URI="your-atlas-connection-string" npm run seed -w server
```

### Step 7: Verify

1. Open your Vercel URL
2. Register an account
3. Browse problems at `/problems`
4. Pick a problem, write a solution, click Run -- you should see test results

---

## Scripts Reference

| Command | Description |
|---|---|
| `npm install` | Install all dependencies (root + client + server via workspaces) |
| `npm run dev` | Run client and server concurrently in development mode |
| `npm run build` | Build both client and server for production |
| `npm run dev -w client` | Run only the frontend dev server |
| `npm run dev -w server` | Run only the backend dev server |
| `npm run seed -w server` | Seed the database with test data |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please follow the coding conventions outlined in [CLAUDE.md](CLAUDE.md) -- TypeScript strict mode, async/await, no `any` types, 2-space indentation, single quotes, no semicolons.

---

## License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2025 Code Battle Arena

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
