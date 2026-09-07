# GUI/CLI — Operator CLI (Planned)

Terminal client for AOSL operators. **Not started** — this folder is a placeholder.

## What it will do

Wrap the C2 server's `/api/v1` REST API for terminal workflows:

- `login` — authenticate against `POST /api/v1/login`, hold the Bearer API key for the session
- Agent operations — list/register/decommission agents (`/api/v1/agent/*`)
- Task dispatch — queue commands and dorking jobs, poll status (`/api/v1/task/*`)
- Findings and history — browse assessment results
- User admin — create/remove operators (MODERATOR privilege)

## Design notes

- Same contract as the website: thin client, all state stays in the C2 database.
- Auth identical to the web flow: one-day Bearer API key from login, invalidated by logout.
- Implementation language and layout will be decided when work starts (likely Python, matching the rest of the backend).
