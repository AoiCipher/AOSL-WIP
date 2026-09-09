# C2 Test Suite

Unittest suite for the C2 Core Engine. One test module per routes/domain module. Route tests patch `server.db.database.DB_PATH` to a temp SQLite file so they never touch `data/c2.db`; `test_auth.py` passes `db_path=` to the internal auth helpers directly.

## Running

```bash
cd C2
python -m unittest discover tests
# verbose:
python -m unittest discover tests -v
# single module:
python -m unittest tests.test_user_routes -v
```

## Coverage

| File | Covers | What it checks |
| --- | --- | --- |
| `test_auth.py` | `server/auth/security.py` | Credential authentication, API key issuance, expiry, invalidation (`authenticate_credentials`, `get_user_by_api_key`, `invalidate_api_key`) |
| `test_user_routes.py` | `server/routes/user_routes.py` | `/api/v1/login`, `/logout`, user create/list/info/delete flow via TestClient |
| `test_agent_routes.py` | `server/routes/agent_routes.py` | `/api/v1/agent/register` → list → info → health → delete lifecycle via TestClient |
| `test_task_routes.py` | `server/routes/task_routes.py` | `/api/v1/task/new` → list → `taskinfobyid` dispatch/tracking flow via TestClient |
| `test_system_routes.py` | `server/routes/system_routes.py` | `/api/v1/healthC2` and `/api/v1/statsC2` counts |

## Current status

The suite is red while the package settles after the `middleware/` → `C2/` rename:

- Route test modules fail to import — `server/routes/server.py` imports `db.database`, which only resolves with `server/` on the module path; import normalization is in progress.
- `test_auth.TestAuthSecurity.test_auth_flow` fails (`authenticate_credentials` returns None) pending the same import fix.

Fix the imports in `server/routes/*.py` (and matching test imports) to bring the suite back to green.
