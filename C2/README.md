# Project-AOSL C2 Core Engine

The **AOSL C2 (Command & Control) Core Engine** is the central management service of the AOSL stateful AI-driven security assessment platform. It coordinates operators, manages agent nodes, dispatches execution tasks, and persists all assessment state. Package name: `aosl-c2`.

## Architecture and design

- **Framework**: FastAPI on Python 3.14+ (Uvicorn server)
- **Database**: SQLite (`data/c2.db`) as the single source of truth
- **Authentication**: Bearer API tokens with configurable expiration (default 24h)
- **Router modularization**: separate endpoint modules for users, agents, tasks, and system status

```
┌─────────────────┐       HTTP Bearer Auth        ┌─────────────────────────┐
│ Operator (CLI)  ├───────────────────────────────►                         │
└─────────────────┘                               │   AOSL C2 Core Server   │
                                                  │   (FastAPI Engine)      │
┌─────────────────┐       REST /api/v1           │                         │
│ Target Agents   ├───────────────────────────────►                         │
└─────────────────┘                               └────────────┬────────────┘
                                                               │
                                                        ┌──────▼──────┐
                                                        │ SQLite DB   │
                                                        │ (c2.db)     │
                                                        └─────────────┘
```

## Project layout

```
C2/
├── main.py                 # Entrypoint: starts Uvicorn on 0.0.0.0:<port>
├── config.py               # Env config: DB path, port, key lifetime, LLM settings
├── requirements.txt        # pip install target
├── pyproject.toml          # uv/pip project metadata (package: aosl-c2)
├── data/
│   ├── c2.db               # SQLite database (created automatically on startup)
│   └── log.db              # SQLite log database (created by logsink)
├── server/
│   ├── routes/
│   │   ├── server.py       # FastAPI app assembly + init_db on startup
│   │   ├── user_routes.py  # /api/v1 login/logout/user management
│   │   ├── agent_routes.py # /api/v1 agent registration and management
│   │   ├── task_routes.py  # /api/v1 task dispatch and tracking
│   │   └── system_routes.py # /api/v1 health and stats
│   ├── auth/
│   │   └── security.py     # Credential check, API key issue/invalidate, Bearer dep
│   ├── db/
│   │   └── database.py     # get_db context manager, init_db schema, admin seed
│   └── logsink.py          # SQLite-backed structured logging sink
├── tests/                  # unittest suite (see tests/README.md)
└── .env                    # Local environment overrides (not committed)
```

## Database schema

Three tables, created by `init_db()` on startup (`server/db/database.py`):

| Table | Key columns | Purpose |
| --- | --- | --- |
| `users` | `username` (unique), `password`, `api_key`, `api_key_expires`, `role` | Operator accounts and sessions |
| `agents` | `agent_id` (unique), `api_key` (unique), `name`, `ip`, `status`, `last_seen` | Registered agent nodes |
| `tasks` | `task_id` (unique), `agent_id` (FK → agents), `command`, `status`, `result` | Dispatched task queue |

If the users table is empty on startup, a default admin account is seeded: `admin` / `adminpass`. Change it immediately in any real deployment.

## Running the server

```bash
cd C2
pip install -r requirements.txt   # or: uv sync
python main.py
```

Interactive OpenAPI documentation is served at `/docs` while the server runs.

## Configuration

Environment variables (loaded from `.env` in `C2/` or any parent directory):

| Variable | Default | Description |
| --- | --- | --- |
| `C2_DB_PATH` | `data/c2.db` | SQLite database file path |
| `C2_PORT` (falls back to `PORT`) | `8000` | HTTP server port |
| `KEY_EXPIRATION_SECONDS` | `86400` (24h) | API key validity window |
| `LLM_API_KEY` | `""` | API key for the planner LLM integration |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | LLM endpoint base URL |
| `LLM_MODEL` | `gpt-4o-mini` | LLM model name |

## API reference (`/api/v1`)

### Users and authentication (`user_routes.py`)

- `POST /api/v1/login` — authenticate `username`/`password`, receive Bearer API key + expiry
- `POST /api/v1/logout` — invalidate the current session key
- `GET /api/v1/user` — list registered operators
- `GET /api/v1/user/userinfobyid` — fetch a profile by user ID
- `POST /api/v1/user/create` — create an operator account
- `DELETE /api/v1/user/delate` — remove an operator account

### Agents (`agent_routes.py`)

- `POST /api/v1/agent/register` — register an agent; returns generated `agent_id` + `api_key` (the key the agent uses on its own endpoints)
- `GET /api/v1/agent/list` — list all registered agents and statuses
- `GET /api/v1/agent/infobyid` — fetch agent metadata by ID
- `GET /api/v1/healt/infobyid` — check agent activity status
- `DELETE /api/v1/agent/delbyid` — decommission an agent record

### Tasks (`task_routes.py`)

- `POST /api/v1/task/new` — dispatch a command task to a target agent (status starts `pending`)
- `GET /api/v1/task/list` — list all dispatched tasks
- `GET /api/v1/task/taskinfobyid` — fetch task details and result

### System (`system_routes.py`)

- `GET /api/v1/healthC2` — server health check (`/api/v1/healtC2` also kept as a legacy alias)
- `GET /api/v1/statsC2` — counts of registered users, agents, and tasks

### Authentication flow

1. `POST /api/v1/login` with credentials → response contains `api_key` and `expires_at`.
2. Send `Authorization: Bearer <api_key>` on operator requests; `get_current_user` (`server/auth/security.py`) validates the key and expiry against the `users` table.
3. Agent-facing calls use the agent's own `api_key` issued at `POST /api/v1/agent/register`.
4. `POST /api/v1/logout` invalidates the operator key.

## Testing

```bash
cd C2
python -m unittest discover tests
```

See `tests/README.md` for what each suite covers.

## Current status

The package was recently moved from `middleware/` to `C2/` and is mid-refactor:

- `server/routes/server.py` imports `db.database`, which only resolves when `server/` is on the module path; route imports are being normalized.
- The unittest suite currently fails during this transition (import errors in route tests, one auth flow failure).
- `server/agent/` is reserved for outbound C2→agent communication and knowledge base handling (see `agent/todo.todo`).

## Deployment notes

1. **SQLite WAL mode** — for multi-threaded ASGI workloads, enable `PRAGMA journal_mode=WAL;`.
2. **Reverse proxy** — deploy behind Nginx/Caddy with TLS termination for C2–agent traffic.
3. **Persistence** — mount `data/` as a volume in containerized deployments to preserve state.
