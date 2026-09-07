# Agent Test Suite

Unittest suite for the AOSL Agent. Covers configuration loading and the agent REST API. Each test run uses a fresh temp SQLite database (`AGENT_DB_PATH` is pointed at a throwaway file before imports) so tests never touch `agent.db`.

## Running

```bash
cd agent
python -m unittest discover tests
# verbose:
python -m unittest discover tests -v
```

## Coverage

Single module: `test_agent.py`, two test classes:

| Class | What it checks |
| --- | --- |
| `ConfigSettingsTest` | `config.DEFAULT_PORT` fallback to 8000, `AGENT_PORT` env override (e.g. 9000), `.env` file override behavior (e.g. 8190) with reload |
| `AgentApiTest` | FastAPI `TestClient` flows: `POST /agent/v1/register` (missing apikey → 400, success, duplicate → 409), `GET /agent/v1/health` (no key → 401, bad key → 401, success), task creation and retrieval |

## Current status

10 tests, 7 currently failing with `404 != 200`: the route modules in `src/server/route/` (`agent.py`, `task.py`) define endpoints on the shared router but are not imported by `main.py`, so the endpoints the tests exercise are not mounted. Importing the route modules in `main.py` (or finishing the `src/aosl_agent` package layout migration declared in `pyproject.toml`) should turn the suite green.
