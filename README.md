# Project-AOSL

Stateful AI-driven security assessment orchestration platform. The database is the source of truth, the planner is replaceable, and humans remain in control.

> [!WARNING]
> **Project Announcement** Development of this project will be suspended for four months, until January 2027.

## What it does

Project-AOSL coordinates security assessments through a Command & Control (C2) architecture:

- **C2 server** (`C2/`) — central FastAPI REST API where operators register users, manage agents, dispatch tasks, and track findings. SQLite-backed; all state lives in the database.
- **Agent** (`agent/`) — lightweight FastAPI server deployed on target/host machines. Registers with the C2 using a C2-issued API key, reports health telemetry (CPU/RAM/storage), and receives tasks (dorking, commands) over REST.
- **GUI** (`GUI/`) — operator interfaces: a Next.js website dashboard (in progress) and a planned CLI.

Flow: operator logs into the C2 → C2 issues a 1-day API key → agents register with C2-issued keys → operators dispatch tasks → agents report results → everything is persisted in SQLite.

```
┌──────────┐   REST /api/v1   ┌─────────────┐   REST /agent/v1   ┌──────────┐
│ Operator │ ───────────────▶ │  C2 Server  │ ◀────────────────  │  Agents  │
│ (CLI/Web)│                  │  (FastAPI)  │                    │ (FastAPI)│
└──────────┘                  └─────────────┘                    └──────────┘
                                      │
                                ┌─────▼─────┐
                                │  SQLite   │
                                │ (truth)   │
                                └───────────┘
```

## Repository layout

```
Project-AOSL/
├── C2/             # C2 Core Engine — central FastAPI REST API (see C2/README.md)
│   ├── server/     #   routes, auth, db packages (see C2/server/ via C2/README.md)
│   ├── tests/      #   unittest suite (see C2/tests/README.md)
│   └── data/       #   c2.db SQLite database (created automatically)
├── agent/          # AOSL Agent — host-side task runner (see agent/README.md)
│   ├── src/        #   db + server packages
│   └── tests/      #   unittest suite (see agent/tests/README.md)
├── GUI/            # Operator interfaces (see GUI/README.md)
│   ├── website/    #   Next.js operator dashboard (see GUI/website/README.md)
│   └── CLI/        #   operator CLI (planned, see GUI/CLI/README.md)
└── LICENSE
```

## Components

| Component | Path | Stack | Port | Status |
| --- | --- | --- | --- | --- |
| C2 Core Engine | `C2/` | FastAPI + SQLite | 8000 | Backend implemented, mid-refactor |
| Agent | `agent/` | FastAPI + SQLite + psutil | 8000 | Endpoints implemented, mid-refactor |
| Website | `GUI/website/` | Next.js 16 + React 19 + Tailwind 4 | 3000 | UI against mock data |
| CLI | `GUI/CLI/` | — | — | Planned |

## Quick start

### C2 server

```bash
cd C2
pip install -r requirements.txt   # or: uv sync
python main.py                    # http://localhost:8000, OpenAPI docs at /docs
```

### Agent

```bash
cd agent
uv sync
uv run python main.py             # port 8000 by default, AGENT_PORT to override
```

### Website

```bash
cd GUI/website
npm install
npm run dev                       # http://localhost:3000
```

## Development guide

### Prerequisites

- Python 3.14 (see `.python-version`)
- [uv](https://docs.astral.sh/uv/) for the agent and C2 packages; pip works for C2 via `requirements.txt`
- Node.js + npm (or bun) for the website

### Code conventions

- **State lives in SQLite** — endpoints read/write through a `get_db` context manager that commits on exit and rolls back on error. No in-memory session state.
- **Route modules per domain** — each routes module owns one `APIRouter` under a versioned prefix: `/api/v1` (C2-side, operator-facing) and `/agent/v1` (agent-side).
- **Pydantic models for request bodies**, plain dicts in responses.
- **Auth** — C2: Bearer API key issued at login, validated by the `get_current_user` dependency; agent: `X-Api-Key` header validated against its own local database.
- **Schema** — created in `init_db()` on startup with plain SQL `CREATE TABLE IF NOT EXISTS`. No migration framework; edit the schema there and adjust tests.
- **Tests** — stdlib `unittest` per module with temp DB paths; see `C2/tests/README.md` and `agent/tests/README.md`.

### Current status / known work in progress

- The C2 package was recently moved from `middleware/` to `C2/`; its import layout (`server.routes.server` importing `db.database`) expects `server/` on the module path, and the test suite currently fails while this settles.
- The agent package is transitioning to a `src/aosl_agent` layout (`pyproject.toml` script `aosl-agent`), while `main.py` still wires routes from `src/server`. The `src/server/route/` task modules are not yet included in the app router, so only `/agent/v1` routes from `src/server/routes.py` are live.
- Task execution on the agent (`run`, `dorking` actions) is a placeholder — commands are echoed, not executed.
- The website runs entirely on mock data (`GUI/website/src/lib/contents.ts`) ahead of C2 API integration.

## License

See [LICENSE](LICENSE).
