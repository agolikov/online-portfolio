# Known Issues / Technical Debt

- Backend mutation endpoints have no authentication or authorization — severity: high.
- Chat action confirmation is currently client-side intent detection; direct API calls can still invoke mutating assistant tools without an approval boundary — severity: high.
- Chat history is persisted but has no pagination, retention policy, pruning, or summarization; long-running resume threads can grow without bound — severity: medium.
- Chat history stores full user prompts and assistant responses, which may include sensitive vacancy or candidate data; retention and export/delete controls are not defined — severity: medium.
- Cover-letter vacancy file support reads text-like files only; PDF/DOCX job descriptions need richer parsing before file attachment feels complete — severity: medium.
- Cover-letter role-fit metrics are heuristic and keyword-based, not validated against structured vacancy requirements or model-reviewed scoring — severity: medium.
- Cover-letter content is mirrored between `resumes.coverLetter` and `resumeData.coverLetters.current.content`; drift is possible if future code updates only one location — severity: low.
- Cover-letter metadata supports only a single `current` letter; multiple target roles per resume still need versioning/history — severity: low.
- Per-story visibility defaults missing `public` to visible; older or imported JSON remains public unless explicitly toggled off — severity: low.
- New chat persistence, action confirmation, story visibility, and cover-letter metric flows have build coverage but no focused unit/integration tests — severity: medium.
- API contract is implicit in `server/app.ts` and `src/lib/resumesApi.ts`; there is no OpenAPI/schema validation boundary — severity: low.
- Vercel deployment config is present, but there is no automated preview-deployment smoke test for SPA fallback routes or `/api/*` rewrites — severity: medium.
- Deployment, production hosting, and secrets management are not documented — severity: medium.
