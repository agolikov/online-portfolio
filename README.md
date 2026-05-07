# Online Portfolio

A full-stack personal portfolio and resume application. Share your professional experience publicly, create multiple hash-based resume variants for specific roles, generate targeted cover letters with AI, and manage everything from a built-in editor.

---

## What it does

**Public portfolio** — visitors land on `/` and see your profile, skills, work history, projects, certificates, education, and behavioral stories. The page is filterable by tech stack, exports to PDF, and auto-opens a cover letter popup when one is attached.

**Hash-based resume variants** — each resume lives at a short URL like `/a3f9c1b2`. You control which variants are public, which is the default home page, and you can create as many as you need — one per role, seniority level, or company.

**AI assistant** — an in-page chat lets you ask questions about the resume or instruct it to update sections directly: *"add Python and FastAPI to the skills"*, *"rewrite the summary to be more concise"*. Changes are confirmed before they run and saved to the database immediately.

**Cover letters** — paste a job description, optionally add the hiring manager's name, and generate a short candid cover letter via AI (or a fallback template when no AI key is configured). The letter is attached to the resume and shown in a popup on the public page.

**Editor** — a dev-only `/edit` page manages all resume variants, edits every section inline with auto-save, and includes the AI chat panel.

---

## Features

| Feature | Details |
|---------|---------|
| Public portfolio | Profile, skills, experience, projects, certs, education, stories, contact form |
| Tech filter | Filter experience and projects by stack tag; state syncs to the URL |
| PDF export | One-click export of the rendered view |
| Hash resume variants | Multiple resumes at `/:hash`; each independently enabled/disabled |
| Default home resume | One resume can be pinned as the root `/` page |
| Resume editor | Create, edit, toggle, annotate, delete, and set-default variants |
| Per-section visibility | Toggle individual experience, project, cert, edu, and story entries on/off |
| Cover letters | AI-generated or manual; attached per resume; shown as a popup on the public page |
| AI chat assistant | OpenAI-compatible; reads and writes all resume sections via tool calls |
| Confirmation cards | Detected mutating intents show an OK/Reject card before the AI runs |
| Persisted chat history | Conversation stored per resume in the database; clearable |
| PostHog analytics | Contact form, PDF export, GitHub clicks, theme changes, tech filter, project clicks |
| Rate limiting | 120 req/min general; 10 req/min on AI chat and cover-generation endpoints |
| Docker support | Dockerfile + Compose on port 3004; expects an external PostgreSQL URL |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express 5, TypeScript (`tsx`) |
| Database | PostgreSQL via Drizzle ORM |
| AI | OpenAI-compatible API (configurable model and base URL) |
| Analytics | PostHog (browser-side, optional) |
| Deployment | Vercel (frontend + Express serverless) or Docker |

---

## Quick start

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database (local or hosted)

### 1. Clone and install

```bash
git clone <repo-url>
cd online-portfolio
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required — PostgreSQL connection string
DATABASE_URL=postgres://user:password@localhost:5432/online_portfolio

# Optional — enables AI chat and cover-letter generation
AI_API_KEY=sk-...
AI_BASE_URL=                        # leave empty for OpenAI; set for Ollama or compatible APIs
AI_MODEL=gpt-4o-mini

# Optional — PostHog analytics
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

AI features degrade gracefully: chat returns a disabled message and cover letters use a built-in fallback template when `AI_API_KEY` is not set.

### 3. Set up the database

```bash
pnpm db:push        # apply schema to the database
pnpm db:seed        # optional — seed tech suggestions
```

### 4. Start the dev server

```bash
pnpm dev
```

Opens at `http://localhost:3004`. The Express API and Vite frontend run on the same port.

---

## Usage

### Editing your portfolio

1. Open `http://localhost:3004/edit`
2. Edit the **Profile**, **Skills**, **Experience**, **Projects**, **Certificates**, **Education**, and **Stories** tabs
3. Changes auto-save to the database after 1.5 s when a resume is loaded

### Creating resume variants

1. Go to the **Resumes** tab in `/edit`
2. Click **Create from current** to snapshot the editor state as a new resume
3. Toggle a resume **On** to make it publicly accessible at `/:hash`
4. Click **Open** next to any resume to preview it in a new tab
5. Set one resume as **Default** to use it as the home page `/`

### Generating a cover letter

1. Load a resume in the editor and open the **Cover Letter** tab
2. Paste the job description into the **Job Description** field
3. Optionally add the hiring manager's name
4. Click **Generate** — the letter is saved and will appear as a popup on the public resume page

### Using the AI assistant

The AI chat panel is available on the **Chat** tab in `/edit` and as a floating widget on public resume pages. Example prompts:

- *"Summarise this resume in 3 bullet points"*
- *"Add Python and FastAPI to the skills"*
- *"Rewrite the profile summary to sound more senior"*
- *"Generate a cover letter for a staff engineer role"*

Mutating actions (anything that changes data) require confirmation before the AI runs.

---

## Docker

```bash
# Build and start (supply your database URL)
DATABASE_URL=postgres://... docker compose up --build
```

The Compose file does not include a database container — point `DATABASE_URL` at an existing PostgreSQL instance. The app listens on port `3004`.

---

## Deployment (Vercel)

1. Import the repository in Vercel
2. Set all environment variables from `.env.example` in the Vercel project settings
3. `DATABASE_URL` must point to a hosted PostgreSQL instance (Neon, Supabase, Railway, etc.)
4. Deploy — Vercel rewrites `/api/*` to the Express function automatically

See `docs/cloudflare-ddos-plan.md` for recommended Cloudflare configuration in front of the Vercel deployment.

---

## Project structure

```
server/          Express API, Drizzle schema, AI service, tool definitions
src/
  components/    UI components (portfolio sections, chat, editor pieces)
  pages/         Route pages — Index, ResumeHashPage, EditPage, NotFound
  lib/           API client, PDF export, portfolio store, visibility helpers
  types/         Portfolio TypeScript types
  data/          Bundled portfolio.json fallback data
docs/            Deployment and operations guides
```
