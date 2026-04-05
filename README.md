# Code Battle Arena

Real-time 1v1 competitive coding platform. Two players get matched by ELO, solve the same problem, and race to finish first — with live spectating and replays.

Built with MERN + TypeScript, Socket.IO for real-time sync, Redis for matchmaking/leaderboards, and local code execution via child_process.

![Landing Page](image-2.png)
![Battle Arena](image-1.png)
![Leaderboard](image.png)

## What it does

- **1v1 code battles** — matchmaking pairs players within ±200 ELO (expands by ±50 every 10s)
- **Monaco Editor** with syntax highlighting for C++, Python, JavaScript, Java
- **Code execution** via local compilation (gcc, python3, node, javac) with 10s timeout, memory limits, and compilation caching — each test case returns AC, WA, TLE, RTE, or CE
- **ELO system** (K=32) with tiers: Bronze, Silver, Gold, Platinum, Diamond, Master
- **Spectator mode** — watch live matches with real-time code updates
- **Match replays** — dual-editor timeline scrubber with play/pause, 1x/2x/4x/8x speed, event markers for submissions and test runs
- **Anti-cheat** — paste detection (>50 chars), tab-switch monitoring (warns after 3), code similarity checks (Jaccard >80%), 500ms opponent code delay, 10s submission rate limit
- **Custom rooms** — challenge friends via shareable invite links with configurable difficulty and time limit
- **Resizable panels** — drag handles between problem description, editor, opponent view, and test results
- **Auto-reconnect** — reconnects during battles with 60s grace period before forfeit
- **Sound effects** — match found, countdown, submission, victory fanfare, defeat
- **Confetti** on match victory
- **Leaderboard** — global and weekly rankings backed by Redis sorted sets
- **User profiles** — rating history chart (Recharts), language distribution pie chart, match history
- **Admin panel** — full problem CRUD with test case management
- **20 seeded problems** — classic CP problems (Two Sum, Valid Parentheses, LRU Cache, etc.) with starter code for all 4 languages

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind, Zustand |
| Editor | Monaco Editor (`@monaco-editor/react`), react-resizable-panels |
| Charts | Recharts (rating history, language distribution) |
| Backend | Node.js, Express, TypeScript |
| Real-time | Socket.IO |
| Database | MongoDB + Mongoose |
| Cache/Queue | Redis (ioredis) |
| Code execution | Local child_process (gcc, python3, node, javac) with Judge0 fallback |
| Auth | JWT + bcryptjs |
| Production | Helmet, compression, connection pooling |

## How it works

```
React Client  ──REST──>  Express Server  ──>  MongoDB
     ↕ Socket.IO              |
                             Redis (matchmaking queue + leaderboards)
                              |
                         Local child_process (code execution)
```

- REST handles auth, problems, match history, submissions, leaderboard, user profiles
- Socket.IO handles matchmaking, live code sync, spectator updates, match state machine, challenge rooms
- Redis stores the matchmaking queue (sorted set by ELO) and leaderboards (global + weekly)
- Code runs locally via child_process with per-execution temp directories, 10s execution timeout, 30s compilation timeout, `ulimit` memory caps, and compilation caching by code hash

## Setup

You'll need Node 18+, MongoDB, and Redis running locally.

```bash
git clone https://github.com/Anubhav1410/code-battle-arena.git
cd code-battle-arena
npm install
```

Create `server/.env`:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/code-battle-arena
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-this-to-something-random
JWT_EXPIRES_IN=7d
JUDGE0_API_URL=https://judge0-ce.p.swisspol.ch  # optional — local execution is the default
JUDGE0_API_KEY=                                  # optional — only for RapidAPI hosted Judge0
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

Seed the database with 20 problems:

```bash
npm run seed -w server
```

Run it:

```bash
npm run dev
# Client runs on :5173, server on :5001
```

Register accounts via the UI at http://localhost:5173/register.

### Code execution

For local development, code executes via whatever compilers you have installed (python3, node, gcc, javac). In production, the Docker image installs all four.

The executor tries Judge0 first (if `JUDGE0_API_URL` is set), then falls back to local `child_process` execution. Compilation has a 30s timeout (slow on free-tier hosts), execution has a 10s timeout. Compiled C++/Java binaries are cached by code hash for 5 minutes so repeated test case runs skip recompilation.

## Challenges & what I learned

**Syncing editor state in real-time** was the trickiest part. Monaco fires `onChange` on every keystroke, so sending raw updates over Socket.IO would flood the connection. I ended up debouncing at 300ms on the sender side and adding a 500ms delay before showing opponent code — which also doubles as an anti-cheat measure since you can't just copy what your opponent is typing.

**Matchmaking with ELO expansion** took some iteration. Initially I tried a simple queue where you match the closest ELO, but that meant high-rated players would wait forever. The current system starts with a ±200 window and expands by ±50 every 10 seconds, which keeps wait times reasonable without creating unfair matches.

**Replay system** — storing every code change and event during a match makes the MongoDB documents pretty large. I went with an append-only events array embedded in the match document rather than a separate collection, which simplified queries for the replay player at the cost of larger documents. For a production app I'd probably move to a separate events collection with cursor-based pagination.

**Redis sorted sets** turned out to be perfect for both the matchmaking queue (sorted by ELO for range queries) and leaderboards (sorted by rating for rank queries). Weekly leaderboard resets are handled by a simple key rotation.

**Code execution on free-tier hosts** — external APIs (Piston, Judge0) were unreachable from Render's free tier due to SSL/network issues. Ended up installing compilers directly in the Docker image and running code via child_process with timeout and ulimit protections. Compilation caching made a huge difference — C++ went from ~4s to ~10ms on cache hits.

## Deployment

For production I used:
- **MongoDB Atlas** (free tier) for the database
- **Upstash** (free tier) for Redis
- **Render** for the backend (Docker deployment with gcc/python3/node/javac installed)
- **Vercel** for the frontend

Set `CLIENT_URL` on Render to your Vercel URL, and `VITE_API_URL` / `VITE_SOCKET_URL` on Vercel to your Render URL. Run the seed script against your Atlas URI and you're good.

The Dockerfile installs compilers directly in the container so code execution works without any external API dependency.

## Known issues / TODO

- [ ] Battle arena isn't mobile-responsive (needs desktop)
- [ ] Code similarity analysis is basic (token-level Jaccard) — could be improved with AST-based comparison
- [ ] Local code execution has no process-level sandboxing (ulimit only) — production would benefit from nsjail or similar
- [ ] Weekly leaderboard reset is not automated (no cron job set up)

## Project structure

```
code-battle-arena/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── battle/        # Battle room components
│       │   ├── editor/        # Monaco editor wrapper
│       │   ├── layout/        # Navbar, NavbarLayout
│       │   ├── problem/       # Test case panel
│       │   └── ui/            # ProtectedRoute, AdminRoute, ErrorBoundary, ResizeHandle
│       ├── pages/             # 16 route-level pages
│       │   ├── Home.tsx       # Landing page (redirects to dashboard if logged in)
│       │   ├── BattleArena.tsx # Split-screen battle room with resizable panels
│       │   ├── Replay.tsx     # Match replay with timeline scrubber
│       │   ├── Spectate.tsx   # Live match listing
│       │   ├── SpectateView.tsx # Live spectator view
│       │   ├── Dashboard.tsx  # Find Match, Challenge a Friend, recent matches
│       │   ├── Leaderboard.tsx # Global/weekly rankings
│       │   ├── Profile.tsx    # User profile with charts
│       │   ├── MatchHistory.tsx # Filtered match history with code comparison
│       │   ├── ProblemList.tsx # Problem bank with filters
│       │   ├── ProblemDetail.tsx # Problem solver with editor
│       │   ├── Challenge.tsx  # Join challenge room via link
│       │   ├── AdminPanel.tsx # Problem CRUD
│       │   └── Login/Register/NotFound
│       ├── store/             # Zustand stores (authStore, battleStore)
│       ├── services/          # API client (Axios + JWT interceptor), Socket.IO singleton
│       ├── hooks/             # useAntiCheat
│       └── utils/             # tiers, sounds
├── server/                    # Express backend
│   ├── Dockerfile             # Multi-stage build with gcc, python3, node, openjdk
│   └── src/
│       ├── config/            # MongoDB, Redis, env vars
│       ├── models/            # User, Problem, Match (Mongoose)
│       ├── routes/            # auth, problems, matches, leaderboard, users, admin
│       ├── controllers/       # Request handlers
│       ├── services/          # executor, matchmaking, eloService, leaderboardService, antiCheat
│       ├── socket/            # matchHandler, matchmakingHandler, spectatorHandler, challengeHandler
│       ├── middleware/        # JWT auth, admin guard, error handler
│       └── seeds/             # 20 CP problems with test cases and starter code
└── docker-compose.piston.yml  # Optional Piston setup for local dev
```
