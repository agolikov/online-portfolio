# Features

## Implemented
- [x] Public default portfolio — renders profile, skills, experience, projects, certificates, education, contact form, theme controls, and PDF export from local portfolio data.
- [x] Hash-based resume pages — public resume variants are accessible by `/:hash` when enabled.
- [x] Resume editor — development-only `/edit` page can create, update, toggle, annotate, and delete resume variants.
- [x] PostgreSQL-backed resume storage — stores resume JSON, generated hash, internal note, cover letter, enabled flag, and creation timestamp.
- [x] Tech suggestions — backend exposes categorized suggestions for editor autocomplete.
- [x] AI chat assistant — answers portfolio questions and can call tools to read resume data, update profile, skills, experience, projects, certificates, education, stories, and cover letters.
- [x] Persisted chat history — chat messages and assistant tool markers are stored per resume and reloaded in the chat UI.
- [x] AI action confirmation cards — detected mutating chat intents show an explicit OK/Reject card before the assistant call runs.
- [x] Cover letter page — `/:hash/cover` supports vacancy text/file input, role-fit metrics, loading, manual editing, saving, and AI generation of cover letters attached to a resume.
- [x] PostHog analytics — captures contact form submission, PDF export, GitHub click, theme/accent changes, tech filters, and project clicks.
- [x] PDF export — exports the rendered portfolio/resume view to PDF with a visible `Download PDF` control label.
- [x] Behavioral stories display — public portfolio renders stories unless the per-story public toggle is disabled.
- [x] Unified development startup — `pnpm run dev` runs both the Vite frontend and Express backend.
- [x] Environment sample — `.env.example` documents database, server, AI, and PostHog settings.

## Planned
- [ ] Add richer vacancy-file parsing for PDF/DOCX attachments.
- [ ] Produce an old-repository PRD, current PRD, and explicit migration plan if migration work resumes.
