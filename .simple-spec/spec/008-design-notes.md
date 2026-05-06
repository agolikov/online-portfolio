# System Design Notes

- The app keeps portfolio content as structured JSON so a single schema can drive display, editing, AI context, PDF export, and hash-based resume variants.
- Public resume access is hash-based and gated by an `enabled` flag, but this is not authentication. Owner write endpoints still need real access control before production exposure.
- AI tools are declared in `server/tools.json`; server execution logic lives in `server/ai.ts`. This keeps model-facing schemas separate from backend mutation code.
- The assistant currently performs tool mutations directly after model tool calls. Planned confirmation cards should intercept user intent before any data-changing tool is executed.
- Cover letters are stored on the resume row rather than as a separate table. This is simple for one letter per resume hash, but may need normalization if multiple vacancies per resume are required.
- PostHog is initialized in the browser and captures targeted events only; no backend analytics pipeline exists.
- `/:hash` and `/:hash/cover` are public routes. `/edit` is development-only in the frontend router.
- Vite proxies `/api` to Express in development, which lets frontend code use relative API paths.
