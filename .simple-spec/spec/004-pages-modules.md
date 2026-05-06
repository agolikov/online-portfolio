# Pages / Modules

## Module: Portfolio Presentation

**Responsibility:** Public portfolio and resume rendering, filtering, contact, theme controls, and PDF export.

| Type | Path / Name | Description | Status |
|------|-------------|-------------|--------|
| page | `/` | Default portfolio from bundled JSON data. | done |
| page | `/:hash` | Public hash-based resume view loaded from the API. | done |
| component | `<Header />` | Profile identity, summary, and key links. | done |
| component | `<TechFilter />` | Skill/tag filtering and analytics capture. | done |
| component | `<ExperienceList />` | Work history rendering. | done |
| component | `<ProjectGrid />` | Project cards and outbound click tracking. | done |
| component | `<CertificateList />` | Certification display. | done |
| component | `<EducationList />` | Education display. | done |
| component | `<StoriesList />` | Behavioral story display. | done |
| component | `<ControlBar />` | Theme controls, GitHub link, and PDF export. | done |
| util | `src/lib/exportPdf.ts` | HTML-to-PDF export. | done |

---

## Module: Resume Management

**Responsibility:** Owner-facing resume variant management and editor workflows.

| Type | Path / Name | Description | Status |
|------|-------------|-------------|--------|
| page | `/edit` | Development-only editor for profile, skills, experience, projects, certificates, education, stories, chat, and resume variants. | done |
| api | `GET /api/resumes` | List all resumes, including disabled ones. | done |
| api | `POST /api/resumes` | Create a resume with generated hash. | done |
| api | `PUT /api/resumes/:hash` | Update resume JSON data. | done |
| api | `PATCH /api/resumes/:hash/note` | Update internal note. | done |
| api | `PATCH /api/resumes/:hash/toggle` | Toggle public enabled state. | done |
| api | `DELETE /api/resumes/:hash` | Delete a resume. | done |
| api | `GET /api/tech-suggestions` | Read categorized tech suggestions. | done |

---

## Module: AI Assistant

**Responsibility:** Chat-driven portfolio assistance and controlled data updates.

| Type | Path / Name | Description | Status |
|------|-------------|-------------|--------|
| component | `<ChatWidget />` | Compact chat assistant on resume pages. | done |
| component | `<ChatPane />` | Chat panel used in editor/cover workflows. | done |
| api | `POST /api/chat/:hash` | Runs assistant with tool calling over a resume. | done |
| service | `server/ai.ts` | OpenAI-compatible client, system prompt, tool execution, and cover-letter generation. | done |
| config | `server/tools.json` | Tool schemas for assistant capabilities. | done |
| feature | Confirmation cards | UI confirmation before tool mutations. | planned |
| feature | Chat persistence | Database-backed conversation history. | planned |

---

## Module: Cover Letters

**Responsibility:** Generate, save, edit, and publish role-specific cover letters.

| Type | Path / Name | Description | Status |
|------|-------------|-------------|--------|
| page | `/:hash/cover` | Cover letter viewer/editor for a resume hash. | done |
| api | `GET /api/resumes/:hash/cover` | Load saved cover letter. | done |
| api | `PUT /api/resumes/:hash/cover` | Save manual cover letter edits. | done |
| api | `POST /api/resumes/:hash/cover/generate` | Generate a cover letter via AI or fallback template. | done |
| feature | Vacancy input | Text/file input to guide generation. | planned |
| feature | Fit metrics | Role-fit metrics before or during generation. | planned |

---

## Module: Analytics

**Responsibility:** Product analytics for public portfolio usage.

| Type | Path / Name | Description | Status |
|------|-------------|-------------|--------|
| service | `src/main.tsx` | Initializes PostHog with Vite environment variables. | done |
| event | `contact_form_submitted` | Contact conversion event. | done |
| event | `pdf_exported` | PDF export event. | done |
| event | `github_link_clicked` | GitHub outbound event. | done |
| event | `theme_mode_toggled`, `color_scheme_toggled`, `accent_changed` | UI customization events. | done |
| event | `tech_filter_applied`, `tech_filter_cleared` | Skill filtering events. | done |
| event | `project_link_clicked` | Project outbound click event. | done |
