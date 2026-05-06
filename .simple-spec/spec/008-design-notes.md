# System Design Notes

- The app keeps portfolio content as structured JSON so a single schema can drive display, editing, AI context, PDF export, and hash-based resume variants.
- The root `/` route prefers an enabled database resume marked as default. If none exists, it deliberately ignores editor localStorage and uses the bundled `portfolio.json` sample data.
- The edit page stores the last loaded resume hash in localStorage and reloads it from the resume list when returning to edit mode.
- Public resume access is hash-based and gated by an `enabled` flag, but this is not authentication. Owner write endpoints still need real access control before production exposure.
- AI tools are declared in `server/tools.json`; server execution logic lives in `server/ai.ts`. This keeps model-facing schemas separate from backend mutation code. Section update tools replace whole portfolio sections, so the assistant must call `get_resume` first and preserve unrelated entries.
- Chat confirmation cards intercept detected mutating user intent before the assistant request is sent and show inferred tool parameters from the user request. This is a UI safety layer, not a server-side tool approval boundary.
- Chat history is stored per resume and can be cleared from the chat UI, which deletes rows from `chat_messages`.
- Cover letters are mirrored in the resume row and in `resumeData.coverLetters.current`. This preserves legacy access while attaching vacancy text and role-fit metrics to the portfolio JSON.
- Generated cover letters also persist a short candidate summary for the public popup and editor preview.
- PostHog is initialized in the browser and captures targeted events only; no backend analytics pipeline exists.
- `/:hash` and `/:hash/cover` are public routes. `/edit` is development-only in the frontend router.
- Vite proxies `/api` to Express in development, and Vercel rewrites `/api/*` to the Express function in production, which lets frontend code use relative API paths.
- Docker Compose intentionally does not include PostgreSQL; it expects an external database URL so local containers and cloud databases use the same connection model.
