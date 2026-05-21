# Architecture

## Directory Structure
```
src/
  components/editor/      Development-only resume and cover-letter editing UI
  components/portfolio/   Public resume/portfolio presentation UI
  context/                Frontend runtime context providers
  lib/                    Browser-side API and portfolio helpers
  pages/                  Route-level React pages
server/
  ai.ts                   AI orchestration, resume tools, role-fit scoring, and cover-letter prompts
  app.ts                  Express API routes
```

## Module Responsibilities
- **`src/pages/EditPage.tsx`** — Owns the development-only editor shell, loaded resume state, local preview persistence, DB auto-save, and manual save-now behavior.
- **`src/components/editor/ResumeWizard.tsx`** — Owns the alias-first four-step resume creation flow, including radio/dropdown source selection, job context, AI alias generation, job-context refinement, cover-letter generation/follow-ups with preset prompts, consolidated accordion section editing, and final review.
- **`src/components/editor/CoverLetterTab.tsx`** — Owns cover-letter generation, manual edits, visibility toggles, preview rendering, and follow-up edit requests for loaded DB resumes.
- **`src/components/editor/StoriesTab.tsx`** — Owns behavioral story editing and AI-assisted story answer refinement, length changes, and improvement prompts.
- **`src/components/portfolio/ControlBar.tsx`** — Owns public page utility controls: black-and-white light/dark scheme toggle, GitHub link, edit shortcut in development, and PDF export.
- **`src/context/ThemeContext.tsx`** — Locks the visual mode to black-and-white (`data-mode="boring"`) and persists only the light/dark scheme preference.
- **`src/lib/resumesApi.ts`** — Browser-side API client for resume CRUD, chat streaming, cover-letter generation, cover-letter saving, and text editing endpoints.
- **`server/ai.ts`** — Owns AI tool orchestration, role-fit metrics, cover-letter generation/edit prompts, and evidence rules that prevent unsupported cover-letter claims.

## Data Flow
- Editor loads a DB resume through `resumesApi`, stores it in React state, mirrors it to localStorage for live preview, and writes loaded resume changes back through `PUT /api/resumes/:hash`.
- The onboarding wizard creates a temporary DB-backed resume once AI features or final creation need a persisted identifier; AI alias generation and job-context refinement reuse that draft, while the generated hash remains internal and the alias is shown as the public identity.
- Cover-letter generation writes through dedicated cover-letter endpoints; generation and edits use server-side evidence rules to prefer resume-backed achievements and avoid invented claims. Follow-up edit instructions reuse the existing streaming chat API so the assistant can call the cover-letter save tool, after which the editor reloads the updated resume.

## Auth Strategy
<!-- e.g. JWT, sessions, OAuth, Clerk-managed -->
