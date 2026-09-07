# Project-AOSL Agent

The **AOSL Agent** is a lightweight, host-side HTTP server designed to run on managed endpoint nodes. It communicates with the central AOSL Command & Control (C2) server to register with C2-issued API keys, report node telemetry, and receive task assignments. Package name: `aosl-agent`.

## Architecture and design

- **Framework**: FastAPI + Uvicorn (asynchronous ASGI application)
- **Database**: SQLite (`agent.db`) for local state persistence
- **Authentication**: pre-shared API key issued by the C2, validated via the `X-Api-Key` HTTP header
- **Telemetry**: hardware metric sampling via `psutil` (CPU, memory, storage)

```
┌──────────────┐         REST /agent/v1           ┌──────────────┐
│  AOSL C2     ├──────────────────────────────────►  AOSL Agent   │
│  Central     │  X-Api-Key authentication        │  (Host Node) │
└──────────────┘                                  └──────┬───────┘
                                                         │
                                                  ┌──────▼───────┐
                                                  │ SQLite DB    │
                                                  │ (agent.db)   │
                                                  └──────────────┘
```

## Project layout

```
agent/
├── main.py                # Entrypoint: FastAPI app, init_db on startup, Uvicorn runner
├── config.py              # Env config: DB path (AGENT_DB_PATH), port (AGENT_PORT)
├── pyproject.toml         # uv project metadata (package: aosl-agent)
├── src/
│   ├── db/
│   │   └── db.py          # get_db context manager, init_db schema, key validation
│   └── server/
│       ├── routes.py      # APIRouter (prefix /agent/v1) + _require_agent auth helper
│       └── route/
│           ├── agent.py   # POST /agent/v1/register, GET /agent/v1/health
│           └── task.py    # GET /agent/v1/tasks (run/dorking placeholder actions)
└── tests/                 # unittest suite (see tests/README.md)
```

## Database schema

Two tables, created by `init_db()` on startup (`src/db/db.py`):

| Table | Key columns | Purpose |
| --- | --- | --- |
| `agents` | `api_key` (unique), `name`, `ip`, `status`, `last_seen` | This node's registration record |
| `tasks` | `task_id`, `command`, `status`, `result`, timestamps | Local task queue/results |

All endpoints go through the `get_db(db_path=...)` context manager, which commits on success and rolls back on error.

## Running the agent

```bash
cd agent
uv sync
uv run python main.py
```

The server binds `0.0.0.0` on the configured port (default 8000) and initializes the SQLite schema on startup.

## Configuration

Environment variables (loaded from `.env` in `agent/`):

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `AGENT_PORT` | int | `8000` | HTTP server port |
| `AGENT_DB_PATH` | str | `agent.db` | SQLite database file path |

## API reference (`/agent/v1`)

All endpoints require registration first; everything except `/register` requires the `X-Api-Key` header and returns 401 when the key is missing or unknown. A successful authenticated call also updates the agent's `last_seen` timestamp.

### 1. Register with C2-issued key

- **POST** `/agent/v1/register`
- **Body**: `{"apikey": "...", "name": "target-node-01", "ip": "10.0.0.5"}` (`ip` optional — falls back to `X-Forwarded-For` then `0.0.0.0`)
- **Errors**: 400 when `apikey` is missing, 409 when the key is already registered
- **Response** (200):
  ```json
  {"message": "Agent registered", "agent_id": 1, "api_key": "..."}
  ```

### 2. Node health and metrics

- **GET** `/agent/v1/health`
- **Auth**: header `X-Api-Key: <key>`
- **Response** (200):
  ```json
  {
    "status": "ok",
    "agent_name": "target-node-01",
    "cpu_percent": 12.4,
    "memory_percent": 45.2,
    "disk_percent": 38.1,
    "timestamp": 1757000000.0
  }
  ```

### 3. Tasks

- **GET** `/agent/v1/tasks` (`src/server/route/task.py`, not yet wired into the app router)
- **Auth**: header `X-Api-Key: <key>`
- **Body actions**:
  - `{"action": "run", "command": "whoami"}` — placeholder: echoes the command back, no execution
  - `{"action": "dorking", "query": "...", "engineID": 1}` — placeholder: echoes query and engine ID
- **Errors**: 400 for unknown actions

> Task execution is a placeholder. Commands are acknowledged and echoed; nothing is executed on the host yet.

## Testing

```bash
cd agent
python -m unittest discover tests     # via venv, or: uv run with a Python 3.14 interpreter
```

See `tests/README.md` for what each suite covers.

## Current status

The package is mid-refactor while moving to a `src/aosl_agent` import layout:

- `pyproject.toml` declares the `aosl-agent` script pointing at `aosl_agent.app:main`, but the code still uses `src/`-relative imports — `uv run aosl-agent` fails until the layout migration finishes.
- Route modules in `src/server/route/` (`agent.py`, `task.py`) define endpoints on the shared router but are not imported by `main.py`, so only routes defined at module top-level of `src/server/routes.py` are currently served.
- The unittest suite currently reports failures tied to the unwired task routes.
