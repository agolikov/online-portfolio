# System Design Notes

- The app keeps portfolio content as structured JSON so a single schema can drive display, editing, AI context, PDF export, and hash-based resume variants.
- Public resume access is hash-based and gated by an `enabled` flag, but this is not authentication. Owner write endpoints still need real access control before production exposure.
- AI tools are declared in `server/tools.json`; server execution logic lives in `server/ai.ts`. This keeps model-facing schemas separate from backend mutation code. Section update tools replace whole portfolio sections, so the assistant must call `get_resume` first and preserve unrelated entries.
- Chat confirmation cards intercept detected mutating user intent before the assistant request is sent. This is a UI safety layer, not a server-side tool approval boundary.
- Cover letters are mirrored in the resume row and in `resumeData.coverLetters.current`. This preserves legacy access while attaching vacancy text and role-fit metrics to the portfolio JSON.
- PostHog is initialized in the browser and captures targeted events only; no backend analytics pipeline exists.
- `/:hash` and `/:hash/cover` are public routes. `/edit` is development-only in the frontend router.
- Vite proxies `/api` to Express in development, and Vercel rewrites `/api/*` to the Express function in production, which lets frontend code use relative API paths.
