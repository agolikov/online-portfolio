# Stack

## Architecture Style

**Unified full-stack repository** — the frontend and backend live in one codebase. In development, Express serves the API and mounts Vite middleware on the same app port. Deployment shape is not finalized.

## Separated Stack

### Frontend

| Property | Value |
|----------|-------|
| Language | TypeScript |
| Framework | React 18, Vite |
| Styling | Tailwind CSS, shadcn-style Radix UI components |
| State management | React Query for app-level API context; local React state for editor/forms |
| Hosting | TBD |
| Communicates with backend via | REST endpoints under `/api` |

### Backend

| Property | Value |
|----------|-------|
| Language | TypeScript |
| Framework | Express 5 |
| Runtime / version | Node.js via `tsx`; exact production runtime TBD |
| Database | PostgreSQL |
| ORM / query layer | Drizzle ORM and Drizzle Kit migrations |
| Hosting | TBD |
| Auth | None implemented; edit route is dev-only in the frontend |

### Shared

- **API contract:** REST API implemented in `server/index.ts`; no generated OpenAPI contract yet.
- **Environment separation:** Frontend uses Vite env vars for PostHog; backend uses `.env` with database and AI provider settings.

---

## Infrastructure

- Development app server: Express API plus Vite middleware on port `3004`.
- Standalone Vite configuration also uses port `3004`.
- Vite proxy target is `http://localhost:3004` for consistency with the single app port.
- Database migrations live in `server/migrations/`.
- Test runner: Vitest with jsdom.

## Key Services / Integrations

- OpenAI-compatible chat completions API for portfolio assistant and cover letter generation.
- PostHog analytics for conversion, export, filtering, navigation, and theme interaction events.
- PostgreSQL database for resume variants, notes, cover letters, enabled state, and tech suggestions.
