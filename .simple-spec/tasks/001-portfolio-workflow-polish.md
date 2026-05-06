# Task: Portfolio Workflow Polish

> Status: done
> Priority: high
> Created: 2026-05-05
> Updated: 2026-05-05

---

## Rough Idea

Improve the portfolio workflow around PDF export, story visibility, environment onboarding, chat persistence, AI action confirmation, dev startup, and cover-letter role fit scoring.

---

## Refined Description

**What:** Add the requested public/editor/API changes for PDF labeling, story public toggles, `.env.example`, persisted chat history, confirmation cards for detected mutating chat intents, unified dev startup, cover-letter vacancy input, role-fit metrics, portfolio-attached cover letters, and smaller PDF name typography.
**Why:** The app should be easier to run locally, safer when AI may mutate data, better at tailoring cover letters to roles, and more precise about what public visitors can see.
**Scope:** In scope are frontend controls, API contracts, Drizzle schema/migration, AI generation prompt/fallbacks, and spec updates. Out of scope is production-grade file parsing beyond reading attached vacancy text files.

---

## Evaluation

**Is it valuable?**
Yes. These are owner-facing workflow and public presentation improvements that reduce friction and accidental AI mutations.

**Can it be improved?**
Future work can add richer vacancy-file parsing for PDFs/DOCX. This task keeps confirmation in the current chat UI.

**Risks / concerns:**
Database migration is required for chat history. Existing portfolio JSON needs backward-compatible defaults for story visibility and cover-letter metadata.

---

## Implementation Plan

### Affected Modules
- `src/types/portfolio.ts` — add story visibility and portfolio cover-letter metadata.
- `src/pages/EditPage.tsx`, `src/pages/Index.tsx`, `src/components/portfolio/StoriesList.tsx` — story toggle and public filtering.
- `src/components/portfolio/ControlBar.tsx`, `src/lib/exportPdf.ts` — PDF label and smaller PDF name.
- `server/schema.ts`, `server/index.ts`, `server/ai.ts`, `src/lib/resumesApi.ts` — chat history, cover-letter metrics, portfolio-attached cover letters.
- `src/components/portfolio/ChatPane.tsx`, `src/components/portfolio/ChatWidget.tsx` — history load and action confirmation cards.
- `src/pages/CoverLetterPage.tsx` — vacancy text/file input and role-fit controls at the top.
- `package.json`, `.env.example`, `.simple-spec/spec/*` — dev script, env sample, spec sync.

### Steps
1. Extend shared types and database schema.
2. Add migration for chat messages.
3. Update APIs to persist/load chat and return cover-letter metadata.
4. Add frontend controls for story visibility, chat confirmation, and cover-letter vacancy inputs/metrics.
5. Update scripts, env sample, and spec docs.
6. Run type/build verification.

### Trade-offs
- Chat action confirmation is implemented in the UI intent layer for this task.
- Vacancy file support reads text files through the browser; binary PDF/DOCX vacancy parsing remains future work.

---

## Checklist

- [x] Phase 1 — Refined & approved
- [x] Phase 2 — Plan approved
- [x] Phase 3 — Implemented
- [x] Phase 4 — SPEC.md updated
- [x] Phase 5 — User reviewed & approved
