# Task: Rename Interactive Resume to Online Resume

> Status: in-progress
> Priority: medium
> Created: 2026-05-22
> Updated: 2026-05-22

---

## Rough Idea

Rename the project from "Interactive Resume" / `interactive-resume` to "Online Resume" / `online-resume`.

---

## Refined Description

**What:** Update the project-facing name from Interactive Resume to Online Resume across package metadata, documentation, and internal service labels.

**Why:** Keeps the app identity consistent with the desired product/project name.

**Scope:** In scope: `package.json` package name, README title/body/setup snippets, spec overview name/description if needed, and internal labels such as MCP server names that still say `interactive-resume`. Out of scope unless explicitly requested: renaming the repository folder path, changing deployed domains, changing database names, or changing unrelated resume content.

---

## Evaluation

**Is it valuable?**
Yes. Name consistency matters for local commands, docs, MCP labels, and future packaging/deployment references.

**Can it be improved?**
The rename should use two forms consistently: human-readable "Online Resume" and machine/package-safe `online-resume`. I would avoid moving `/Users/al_gol/data/apps/interactive-resume/interactive-resume` during this code change because directory moves can disrupt the current workspace and unrelated tooling.

**Risks / concerns:**
- If external tools depend on the MCP server name `interactive-resume-data`, renaming it may require updating those clients.
- README setup commands that mention `cd interactive-resume` may need to become generic or `cd online-resume`.
- The lockfile may or may not need package-name metadata updated depending on how pnpm recorded the importer.

---

## Implementation Plan

Rename visible project identity and machine-safe identifiers from Interactive Resume / `interactive-resume` to Online Resume / `online-resume`.

### Affected Modules
- `package.json` - update the package name.
- `README.md` - update title, first description, setup directory, and MCP JSON example names.
- `server/mcp.ts` - update the MCP server name label.
- `.simple-spec/spec/001-overview.md` - record the project name and description.
- `.simple-spec/spec/003-features.md` / `.simple-spec/spec/005-architecture.md` if existing feature/architecture wording needs the new name.

### Steps
1. Replace human-readable references `Interactive Resume` with `Online Resume`.
2. Replace machine-safe references `interactive-resume` with `online-resume` where they are package/docs/service labels.
3. Search again for old references and leave only path/workspace references if unavoidable.
4. Run `pnpm test` and `pnpm build`.

### Trade-offs
- Renaming the filesystem directory is intentionally excluded to avoid disrupting the current workspace and running tool sessions.
- Renaming the MCP server label is cleaner, but any external client configured against the old label may need its config updated.

---

## Checklist

- [x] Phase 1 — Refined & approved
- [x] Phase 2 — Plan approved
- [x] Phase 3 — Implemented
- [x] Phase 4 — SPEC.md updated
- [ ] Phase 5 — User reviewed & approved
