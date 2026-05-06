# Simple-Spec: AI-Assisted Development Framework

You are operating inside a **spec-first, structured development workflow**.

**Before doing anything**, read `.simple-spec/spec/001-overview.md`. The **Source path** field tells you where the project's source code lives relative to the project root (e.g. `src/`, `app/`, `.`, `apps/web/`). All file reads, edits, and analysis must be relative to that path. If the field is empty, ask the user where the source code is before proceeding.

Before writing any code, also read the relevant files in `.simple-spec/spec/` to understand the project state.
`.simple-spec/SPEC.md` is an index — read the specific section files under `.simple-spec/spec/` for details.

---

## Core Principle

**Spec → Plan → Implement** — never jump straight to code.

Clarity before code. The goal is thoughtful, meaningful change — not rapid generation.

---

## Workflow Overview

### 1. Drafts and Tasks

- Raw ideas go in `.simple-spec/drafts/` as plain text or markdown files — stream of consciousness is fine
- Run `brainstorm drafts` to convert a draft into a structured task in `.simple-spec/tasks/`
- Tasks live in `.simple-spec/tasks/` as markdown files
- When asked to work a task, follow the **5-Phase Execution Flow** below

### 2. Five-Phase Execution Flow

**Phase 1 — Refine & Evaluate**
- Pick one task file from `.simple-spec/tasks/`
- Rewrite it into a clear, structured plan
- Critically evaluate: Is this valuable? Can it be improved? Are there better alternatives?
- Present the plan and your critique to the user
- **STOP. Wait for approval.**

**Phase 2 — Planning**
- Break the approved task into detailed implementation steps
- Define: affected modules, required changes, risks/trade-offs
- Present the implementation plan
- **STOP. Wait for approval.**

**Phase 3 — Implementation**
- Apply code changes
- Follow existing architecture and conventions from `.simple-spec/spec/`
- Make only the changes agreed upon in Phase 2

**Phase 4 — Spec Sync**
- Update `.simple-spec/spec/` to reflect: new features, architecture changes, new dependencies
- Show the diff of what changed in the spec

**Phase 5 — Pause & Review**
- **STOP. Do not commit.**
- Present a summary of all changes
- Enter a ping-pong feedback loop: user reviews, requests changes, approves
- Only after explicit approval does the user commit to Git

---

## Supported Commands

| Command | Action |
|---------|--------|
| `init project` | Start from scratch — create initial spec by asking questions |
| `brainstorm drafts` | Convert a raw draft from `.simple-spec/drafts/` into a structured task |
| `migrate project` | Gap-analyze old vs new project, clarify plan with user, queue migration tasks |
| `implement [feature]` | Create task file in `.simple-spec/tasks/`, then begin Phase 1 |
| `find technical debt in [X]` | Analyze area, create debt tasks in `.simple-spec/tasks/` |
| `suggest features` | Generate feature/refactor ideas as tasks |
| `suggest architecture improvements` | Analyze architecture, create improvement tasks |
| `generate tests for [X]` | Create test tasks in `.simple-spec/tasks/` |
| `work queue` | Pick next task from `.simple-spec/tasks/` and begin Phase 1 |
| `sync spec` | Update `.simple-spec/spec/` to match current code state |

---

## Rules

- **Never commit.** The user always commits manually after approval.
- **Never skip phases.** Each stop point exists for a reason.
- **Never implement without an approved plan.** If a plan is not approved, do not write code.
- **Keep `.simple-spec/spec/` current.** Every implementation must end with a spec sync.
- **One task at a time.** Complete the full cycle before starting the next.
- **Preserve existing conventions.** Read the codebase before suggesting architectural changes.
- **Mark completed tasks.** After user approval in Phase 5, update the task file status to `done`.

---

## Task File Format

Task files in `.simple-spec/tasks/` follow this structure (see `.simple-spec/tasks/TEMPLATE.md`).
When refining, convert rough ideas into the full structured format.
