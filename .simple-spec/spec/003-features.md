# Features

## Implemented
- [x] Public default portfolio — renders profile, skills, experience, projects, certificates, education, contact form, black-and-white light/dark controls, and PDF export from local portfolio data.
- [x] Root default resume — `/` loads the database resume marked as default when one exists and is enabled; otherwise it falls back to bundled `portfolio.json` sample data.
- [x] Hash-based resume pages — public resume variants are accessible by `/:hash` when enabled.
- [x] Alias-based resume pages — resumes can also be accessed by a user-defined alias `/:alias`; the editor presents aliases as the shareable identity while keeping generated hashes internal.
- [x] Resume editor — development-only `/edit` page can create resume variants through an alias-first onboarding wizard, update, toggle, annotate, delete, set default resume variants, manually save the loaded DB resume, auto-save edits, remember the last loaded resume, and return to the public route that opened the editor.
- [x] Resume onboarding wizard — `Create` opens a four-step guided flow: start from existing resume data or imported JSON, paste job context and optionally generate a job-aware alias/cover letter, tailor profile/tech/experience/certificates/projects/education/stories in one accordion screen, and review before creating.
- [x] Per-section visibility toggles — experience, projects, certificates, education, stories, and cover-letter entries carry `enabled` flags and can be shown/hidden from collapsed editor cards.
- [x] Item reordering — experience, projects, certificates, education, and stories cards each have ↑ / ↓ buttons to reorder entries within their section.
- [x] PostgreSQL-backed resume storage — stores resume JSON, generated hash, internal note, cover letter, alias, enabled flag, and creation timestamp.
- [x] Tech suggestions — backend exposes categorized suggestions for editor autocomplete.
- [x] AI chat assistant — answers portfolio questions and can call tools to read resume data, update profile, skills, experience, projects, certificates, education, stories, and cover letters.
- [x] Streaming AI chat — chat responses stream token-by-token via SSE; tool badges appear as tools fire mid-stream.
- [x] Persisted chat history — chat messages and assistant tool markers are stored per resume and reloaded in the chat UI.
- [x] AI action confirmation cards — detected mutating chat intents show an explicit OK/Reject card before the assistant call runs.
- [x] Chat management — chat history is persisted per resume and can be cleared from the chat UI.
- [x] Cover letter page — `/:hash/cover` supports vacancy text/file input, role-fit metrics, loading, manual creation, manual editing, saving, and AI generation of cover letters attached to a resume.
- [x] Cover letter editor tab — `/edit` includes a cover-letter tab and wizard step that accept job description text and optional hiring manager/recruiter name, generate a short candid letter plus candidate summary and role-fit metrics using resume-backed evidence rules, support free-form follow-up edit instructions after a letter exists, and store the result in the portfolio JSON.
- [x] Streaming cover letter generation — cover letter text streams token-by-token into the editor with a live cursor; saves to DB when complete.
- [x] Cover letter popup — public/home portfolio views show a `Show Cover Letter` button when enabled cover-letter metadata exists and open it automatically after the default resume loads.
- [x] PostHog analytics — captures contact form submission, PDF export, GitHub click, color scheme toggles, tech filters, and project clicks.
- [x] PDF export — exports the rendered portfolio/resume view to PDF with a visible `Download PDF` control label, escaped profile-summary text, and simple max-width body text rendering.
- [x] Behavioral stories display — public portfolio renders stories unless the per-story visibility toggle is disabled.
- [x] Story AI actions — story answers can be refined, lengthened, shortened, or improved through AI-assisted editor controls when a DB-backed resume is loaded.
- [x] Page loading spinner — a centered spinner shows while lazy routes load, while the default resume fetches on the index page, and while the hash-based resume loads.
- [x] Unified development startup — `pnpm run dev` runs both the Vite frontend and Express backend.
- [x] Environment sample — `.env.example` documents database, server, AI, and PostHog settings.
- [x] Docker support — Dockerfile and Compose run the app on port `3004` using an externally supplied PostgreSQL `DATABASE_URL`.
- [x] DDoS mitigation — server-side `express-rate-limit` (120 req/min general; 10 req/min on AI chat and cover-generation endpoints) plus a Cloudflare setup guide (`docs/cloudflare-ddos-plan.md`) covering DNS proxy, WAF, cache rules, and escalation playbook.
- [x] Project year field — projects carry an optional `year` string; shown as a muted badge in the grid and `project · year` in PDF export (hidden when `hideYears` is set).
- [x] Cover letter edit/preview tabs — the cover-letter editor tab splits the result area into "Edit" (textarea / streaming cursor) and "Preview" (rendered `CoverLetterPanel`) sub-tabs.
- [x] Short PDF link labels — PDF export maps contact and project URLs to brand short-names (GitHub, LinkedIn, LeetCode, etc.) via hostname matching instead of printing full URLs.
- [x] Per-resume hide-years setting — `portfolio.settings.hideYears` (stored in the JSONB blob, no DB migration) suppresses year badges on projects, certificates, and education in both the public view and PDF export; toggled per resume from the editor profile tab.

## Planned
