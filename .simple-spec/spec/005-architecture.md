# Architecture

## Directory Structure
```
.
├── src/                         # React/Vite frontend
│   ├── components/portfolio/     # Portfolio-specific UI
│   ├── components/ui/            # Reusable Radix/shadcn-style UI primitives
│   ├── context/                  # Theme context
│   ├── data/                     # Bundled default portfolio JSON
│   ├── lib/                      # API client, PDF export, helpers
│   ├── pages/                    # Route-level components
│   ├── test/                     # Vitest setup/tests
│   └── types/                    # Portfolio TypeScript types
├── server/                       # Express API, AI service, DB, migrations
│   ├── migrations/               # Drizzle migrations
│   ├── ai.ts                     # AI client, prompts, tool execution
│   ├── db.ts                     # Postgres pool and Drizzle client
│   ├── index.ts                  # REST API routes
│   ├── app.ts                    # Shared Express app used by local dev and Vercel
│   ├── schema.ts                 # Drizzle schema
│   ├── seed.ts                   # Seed data
│   └── tools.json                # AI tool schemas
├── api/                          # Vercel function entrypoints
│   └── index.ts                  # Exports the Express app for /api/* requests
├── .simple-spec/                 # Project specification framework
├── package.json                  # Scripts and dependencies
├── vercel.json                   # Vercel build/output and rewrite configuration
├── Dockerfile                    # Container image for the app server
├── docker-compose.yml            # App-only Compose service using external DATABASE_URL
├── vite.config.ts                # Frontend dev server and API proxy
└── drizzle.config.ts             # Drizzle migration config
```

## Module Responsibilities
- **`src/pages/`** — route composition for public portfolio, hash resume, cover letter, editor, and not-found views.
- **`src/components/portfolio/`** — public-facing portfolio sections and assistant widgets.
- **`src/components/ui/`** — shared UI primitives.
- **`src/lib/resumesApi.ts`** — typed REST client for resume, chat, and cover-letter endpoints.
- **`src/lib/exportPdf.ts`** — browser-side PDF export.
- **`server/app.ts`** — Express REST API for resumes, suggestions, chat, and cover letters.
- **`server/index.ts`** — local development entrypoint that mounts Vite middleware, and production/Docker entrypoint that serves `dist` static assets and starts the app on port `3004`.
- **`api/index.ts`** — Vercel function entrypoint that exports the Express app for `/api/*` requests.
- **`server/ai.ts`** — OpenAI-compatible assistant behavior, tool execution, and cover-letter generation.
- **`server/schema.ts`** — database tables for resumes, tech suggestions, and chat messages.
- **`server/migrations/`** — database schema history.

## Data Flow
Default portfolio data loads from `src/data/portfolio.json` for `/`. Hash-based pages call `src/lib/resumesApi.ts`, which sends REST requests through Vite's `/api` proxy locally or Vercel rewrites in production. Express reads or writes PostgreSQL via Drizzle and returns JSON rows containing resume metadata plus `resumeData`.

AI chat requests send the visible message thread to `POST /api/chat/:hash`. The frontend shows an OK/Reject card before sending detected mutating intents. The backend persists the latest user message, loads the resume from PostgreSQL, sends the thread and tool schemas to the configured OpenAI-compatible provider, executes tool calls, writes mutations through Drizzle, persists the assistant response, and returns assistant text plus flags indicating changed data or saved cover letters. Chat history reloads from `GET /api/chat/:hash/history`.

Cover-letter flows keep the legacy `coverLetter` column in sync while attaching the current cover letter, vacancy text, and role-fit metrics inside `resumeData.coverLetters.current`. AI generation either uses a fallback template when no AI key exists or asks the assistant to generate and save the letter.

PostHog events are captured in frontend components and sent directly from the browser using `posthog-js`.

## Auth Strategy
No authentication is implemented. The editor route is only registered in Vite development mode, but backend mutation endpoints are not protected. Production deployment must add an owner auth strategy before exposing edit or write APIs.
