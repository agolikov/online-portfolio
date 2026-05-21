# Task: Fix PDF Summary Letter Alignment

> Status: in-progress
> Priority: high
> Created: 2026-05-22
> Updated: 2026-05-22

---

## Rough Idea

When exporting the resume/portfolio to PDF, letters in the profile summary section can appear misaligned. The on-page summary appears normal, but the generated PDF output looks wrong in that section. Screenshot evidence shows selected wrapped lines rendered with excessive per-character spacing, while other lines render normally.

---

## Refined Description

**What:** Simplify the PDF export text rendering path so the profile summary is printed as plain max-width text, and fix editor Back navigation from custom resume routes.

**Why:** The summary is one of the first things a recruiter sees in the exported resume, and misaligned text makes the PDF look broken or unprofessional.

**Scope:** In scope: PDF export text normalization/layout for the profile summary, any shared helper used by other PDF body text if the same bug can affect it, and route-aware editor Back navigation. Out of scope: redesigning the PDF, changing the on-page portfolio layout, changing resume data, replacing Helvetica, or replacing the whole export feature.

---

## Evaluation

**Is it valuable?**
Yes. PDF export is an implemented core feature, and summary text quality directly affects the exported resume's credibility.

**Can it be improved?**
The narrow fix should focus on simplifying the jsPDF text pipeline before considering a full export rewrite. The current exporter uses built-in Helvetica and manual line splitting; the screenshot points to a wrapping/layout issue that can cause individual lines to be rendered with excessive character spacing. A practical improvement is to centralize plain max-width text drawing so body text is printed as ordinary wrapped text blocks.

**Risks / concerns:**
- Over-normalizing text could remove meaningful characters from names, technologies, or locations.
- Fixing only the summary may leave the same rendering problem in experience bullets or project descriptions.
- A font-level fix could increase bundle size if custom fonts are embedded.
- Visual verification is needed because unit tests alone will not prove PDF glyph alignment.

---

## Implementation Plan

Fix the PDF summary text rendering by replacing the current summary/body line-by-line drawing path with a plain max-width text block renderer.

### Affected Modules
- `src/lib/exportPdf.ts` - update the shared PDF text helper used by the profile summary and other body copy.
- `src/components/portfolio/ControlBar.tsx` - pass the current public route into the editor link.
- `src/pages/EditPage.tsx` - use the preserved public route for the Back button, falling back to `/`.
- `src/test/exportPdf.test.ts` - add focused tests for PDF text normalization/wrapping helpers if helpers can be exported without changing runtime behavior.
- `.simple-spec/spec/003-features.md` and/or `.simple-spec/spec/008-design-notes.md` - document the PDF text-rendering constraint after implementation.

### Steps
1. Rework the PDF text helper so it normalizes once, asks jsPDF to render text within a fixed `maxWidth`, and advances by the wrapped line count.
2. Use the same simple helper for summary, project descriptions, bullets, tech lines, and education prose.
3. Guard against inherited jsPDF character spacing by resetting character spacing before body text drawing if the current jsPDF version exposes that setter.
4. Escape the profile summary before PDF rendering by stripping control/bidi/invisible/unsupported Unicode characters.
5. Keep the previous Helvetica font family.
6. Preserve the current public route when entering `/edit`, then use it for the editor Back button.
7. Add a focused regression test for PDF text normalization and summary escaping.
8. Build and, if practical, generate/open a sample PDF for visual verification.

### Trade-offs
- Keeping jsPDF avoids a larger rewrite and keeps the fix small, but visual verification is still required because PDF rendering bugs are hard to fully prove with unit tests.
- Reusing the safer helper beyond the summary slightly broadens the code change, but it reduces the risk of the same defect appearing in experience or project text.

---

## Checklist

- [x] Phase 1 — Refined & approved
- [x] Phase 2 — Plan approved
- [x] Phase 3 — Implemented
- [x] Phase 4 — SPEC.md updated
- [ ] Phase 5 — User reviewed & approved
