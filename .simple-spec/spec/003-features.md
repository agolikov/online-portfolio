# Features

## Implemented
- [x] Public default portfolio — renders profile, skills, experience, projects, certificates, education, contact form, theme controls, and PDF export from local portfolio data.
- [x] Root default resume — `/` loads the database resume marked as default when one exists and is enabled; otherwise it falls back to bundled `portfolio.json` sample data.
- [x] Hash-based resume pages — public resume variants are accessible by `/:hash` when enabled.
- [x] Resume editor — development-only `/edit` page can create, update, toggle, annotate, delete, set default resume variants, and remember the last loaded resume.
- [x] Per-section visibility toggles — experience, projects, certificates, education, stories, and cover-letter entries carry `enabled` flags and can be shown/hidden from collapsed editor cards.
- [x] PostgreSQL-backed resume storage — stores resume JSON, generated hash, internal note, cover letter, enabled flag, and creation timestamp.
- [x] Tech suggestions — backend exposes categorized suggestions for editor autocomplete.
- [x] AI chat assistant — answers portfolio questions and can call tools to read resume data, update profile, skills, experience, projects, certificates, education, stories, and cover letters.
- [x] Persisted chat history — chat messages and assistant tool markers are stored per resume and reloaded in the chat UI.
- [x] AI action confirmation cards — detected mutating chat intents show an explicit OK/Reject card before the assistant call runs.
- [x] Chat management — chat history is persisted per resume and can be cleared from the chat UI.
- [x] Cover letter page — `/:hash/cover` supports vacancy text/file input, role-fit metrics, loading, manual creation, manual editing, saving, and AI generation of cover letters attached to a resume.
- [x] Cover letter editor tab — `/edit` includes a cover-letter tab that accepts job description text and optional hiring manager/recruiter name, generates a short candid letter plus candidate summary and role-fit metrics, and stores the result in the portfolio JSON.
- [x] Cover letter popup — public/home portfolio views show a `Show Cover Letter` button when enabled cover-letter metadata exists and open it automatically after the default resume loads.
- [x] PostHog analytics — captures contact form submission, PDF export, GitHub click, theme/accent changes, tech filters, and project clicks.
- [x] PDF export — exports the rendered portfolio/resume view to PDF with a visible `Download PDF` control label.
- [x] Behavioral stories display — public portfolio renders stories unless the per-story visibility toggle is disabled.
- [x] Unified development startup — `pnpm run dev` runs both the Vite frontend and Express backend.
- [x] Environment sample — `.env.example` documents database, server, AI, and PostHog settings.
- [x] Docker support — Dockerfile and Compose run the app on port `3004` using an externally supplied PostgreSQL `DATABASE_URL`.
- [x] DDoS mitigation — server-side `express-rate-limit` (120 req/min general; 10 req/min on AI chat and cover-generation endpoints) plus a Cloudflare setup guide (`docs/cloudflare-ddos-plan.md`) covering DNS proxy, WAF, cache rules, and escalation playbook.

## Planned
- [ ] Add richer vacancy-file parsing for PDF/DOCX attachments.
- [ ] Produce an old-repository PRD, current PRD, and explicit migration plan if migration work resumes.
