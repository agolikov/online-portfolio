# Changelog

| Date | Change |
|------|--------|
| 2026-05-07 | Added per-entry `enabled` visibility flags and collapsed-card visibility toggles for experience, projects, certificates, education, stories, and cover letters; the main portfolio now renders only enabled entries. |
| 2026-05-07 | Verified anonymous hash resume access remains public, added Cloudflare DDoS mitigation documentation, auto-opened the cover-letter popup when a loaded portfolio has a saved letter, and added manual cover-letter creation without AI generation. |
| 2026-05-06 | Updated cover-letter generation to produce shorter, more candid one-minute letters, include honest weak-fit points, and support an optional hiring manager or recruiter name in the greeting. |
| 2026-05-06 | Added default resume support for `/`, including `resumes.isDefault`, API endpoints to set/clear/default-load resumes, editor controls, and last-loaded resume memory in edit mode. |
| 2026-05-06 | Added chat clear-history UI/API, richer tool-intent confirmation cards with inferred parameters, editor cover-letter generation tab, public cover-letter popup, generated candidate summaries, and Docker support with external database configuration. |
| 2026-05-06 | Added AI tools for all portfolio sections: profile, skills, experience, projects, certificates, education, stories, and cover letters, plus matching chat confirmation detection for the new mutating sections. |
| 2026-05-06 | Added Vercel deployment support by splitting the Express app from the local listener, adding a Vercel `/api/*` function entrypoint, configuring `vercel.json` rewrites, and documenting the production deployment shape. |
| 2026-05-05 | Added portfolio workflow polish: PDF label, story public toggles, `.env.example`, chat history persistence, chat action confirmation cards, unified dev startup, cover-letter vacancy input, role-fit metrics, and portfolio-attached cover-letter metadata. |
| 2026-05-05 | Initialized Simple-Spec project specification from existing code, PRD draft, and PostHog setup report. |
