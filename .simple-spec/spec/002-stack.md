# Stack

## Architecture Style

**Unified full-stack repository** — the frontend and backend live in one codebase. In development, Express serves the API and mounts Vite middleware on the same app port. On Vercel, the Vite build is served from `dist` and `/api/*` rewrites to a Vercel Function that exports the Express app.

## Separated Stack

### Frontend

| Property | Value |
|----------|-------|
| Language | TypeScript |
| Framework | React 18, Vite |
| Styling | Tailwind CSS, shadcn-style Radix UI components |
| State management | React Query for app-level API context; local React state for editor/forms |
| Hosting | Vercel static output from `dist` |
| Communicates with backend via | REST endpoints under `/api` |

### Backend

| Property | Value |
|----------|-------|
| Language | TypeScript |
| Framework | Express 5 |
| Runtime / version | Node.js via `tsx` locally; Vercel Node.js Function in production |
| Database | PostgreSQL |
| ORM / query layer | Drizzle ORM and Drizzle Kit migrations |
| Hosting | Vercel Function under `/api/*` |
| Auth | None implemented; edit route is dev-only in the frontend |

### Shared

- **API contract:** REST API implemented in `server/app.ts`; no generated OpenAPI contract yet.
- **Environment separation:** Frontend uses Vite env vars for PostHog; backend uses `.env` with database and AI provider settings.

---

## Infrastructure

- Development app server: Express API plus Vite middleware on port `3004`.
- Standalone Vite configuration also uses port `3004`.
- Vite proxy target is `http://localhost:3004` for consistency with the single app port.
- Vercel build command is `pnpm run build`, output directory is `dist`, and rewrites route `/api/*` to `api/index.ts` plus all non-API paths to `index.html`.
- Dockerfile builds the Vite app and runs the Express server in production mode on port `3004`.
- Docker Compose starts only the app service; `DATABASE_URL` must point to an external PostgreSQL database.
- Database migrations live in `server/migrations/`.
- Test runner: Vitest with jsdom.

## Key Services / Integrations

- OpenAI-compatible chat completions API for portfolio assistant and cover letter generation.
- PostHog analytics for conversion, export, filtering, navigation, and theme interaction events.
- PostgreSQL database for resume variants, notes, cover letters, enabled state, and tech suggestions.
