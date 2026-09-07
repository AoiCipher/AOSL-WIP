# GUI — Operator Interfaces

Operator-facing interfaces for the AOSL platform. Operators authenticate against the C2 server (`C2/`, see its README) and use these tools to manage assessments, agents, and findings.

## Contents

| Folder | What it is | Status |
| --- | --- | --- |
| [`website/`](website/README.md) | Next.js web dashboard — assessments, findings, knowledge base, user admin | In progress, runs on mock data |
| [`CLI/`](CLI/README.md) | Command-line operator client | Planned, not started |

## How they fit the platform

```
┌──────────────┐   ┌──────────────┐      REST /api/v1     ┌───────────┐
│ GUI/website  │   │   GUI/CLI    │ ─────────────────────► │ C2 server │
│ (browser)    │   │ (terminal)   │                        │ (FastAPI) │
└──────────────┘   └──────────────┘                        └───────────┘
```

Both interfaces are thin clients: all state lives in the C2's SQLite database, and every action goes through the C2's `/api/v1` REST endpoints (login → Bearer API key → operator calls).

The website currently ships with a mock data store (`src/lib/contents.ts`) that mirrors the C2 API shapes, so pages can be built before backend integration; see `website/README.md` for the integration plan.
