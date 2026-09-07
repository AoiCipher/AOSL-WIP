# AOSL Operator Website

Next.js dashboard for AOSL operators: launch security assessments, track their progress, review findings, manage the knowledge base, and administer users.

**Status: frontend-only.** All state comes from an in-repo mock data store (`src/lib/contents.ts`); no C2 API calls yet. The store is structured so it can be swapped for API middleware later.

## Tech stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS 4
- lucide-react icons, class-variance-authority, tailwind-merge

## Getting started

```bash
cd GUI/website
npm install        # or: bun install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Pages

| Route | Description |
| --- | --- |
| `/` | Redirects to `/dashboard` when authenticated, otherwise `/login` |
| `/login` | Operator sign-in (mock users from the data store) |
| `/dashboard` | Redirects to `/dashboard/pentest` |
| `/dashboard/pentest` | Assessment overview + creation wizard (single/bulk domains, out-of-scope, focus areas, context/goals, knowledge base toggle) |
| `/dashboard/history` | Past and running assessment history |
| `/dashboard/findings` | Findings list with severity badges and search |
| `/dashboard/knowledge` | Knowledge base browser/editor |
| `/dashboard/admin` | Admin panel: user management, roles, permissions |

Access control: `/(auth)/layout.tsx` and `dashboard/layout.tsx` check the session via `SessionContext` and redirect unauthenticated users to `/login`.

## Project structure

```
src/
├── app/                    # App Router pages (see table above)
│   ├── (auth)/login/       # Sign-in route group
│   └── dashboard/          # Protected dashboard route group
├── components/
│   ├── layout/Sidebar.tsx  # Dashboard navigation
│   └── shared/             # StatsCard, StatusBadge, SeverityBadge, LogViewer
├── contexts/
│   └── SessionContext.tsx  # Session state: user, active role, permissions, localStorage persistence
└── lib/
    ├── contents.ts         # Mock data store + CRUD helpers (users, assessments, findings, knowledge)
    ├── theme.ts            # Status/severity style maps and ordering
    └── utils.ts            # cn() class merge helper
```

## Session and mock data model

- **SessionContext** (`src/contexts/SessionContext.tsx`) — exposes `user`, `activeRole`, `isAuthenticated`, `login()`, `logout()`, `toggleRole()`, and `hasPermission()`. The session is persisted to `localStorage` under the `aosl_session` key and restored on load.
- **Mock store** (`src/lib/contents.ts`, single source of truth):
  - `mockUsers` — accounts with `UserRole` (`ADMIN`/`USER`) and `Permission[]` (e.g. `can_create_assessments`, `can_manage_users`, `can_view_findings`)
  - `mockAssessments` — assessments with status (`running`/`queued`/`completed`/`error`/`canceled`), focus areas (OWASP Top 10, API Security, ...), planner logs
  - `mockFindings` — findings with severity (`critical` → `info`) linked to assessments
  - `mockKnowledgeBase` — knowledge entries
  - CRUD helpers (`getUsers`, `createAssessment`, `getFindingsByAssessment`, ...) mimic future backend endpoints.

## Integration path

The mock store was designed for a straight swap to the C2 REST API (`/api/v1`): replace the helper functions in `contents.ts` with fetch calls, keep the page components untouched. Auth will move from mock plaintext users to the C2's `POST /api/v1/login` Bearer key flow.
