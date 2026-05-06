# Simple-Spec

A spec-first, AI-assisted development framework for software projects.

**The idea:** Before writing code, write a clear spec. Before implementing a feature, write a clear plan. The AI helps with both — but never skips ahead.

```
Spec → Plan → Implement → Review → Commit
```

---

## Setup

### 1. Place Simple-Spec at your project root

Simple-Spec lives in a `.simple-spec/` folder at the root of your project, alongside your source code.
The only exception is `CLAUDE.md` — it must stay at the root so Claude Code auto-loads it.

```
your-project/              ← open this folder in Claude Code
│
├── CLAUDE.md              ← auto-loaded by Claude Code (must stay at root)
│
├── .simple-spec/          ← all framework files live here
│   ├── SPEC.md
│   ├── spec/
│   ├── queue_tasks/
│   ├── completed_tasks/
│   └── prompts/
│
└── src/                   ← your source code (could be src/, app/, or .)
    ├── ...
    └── ...
```

Your source code folder name doesn't matter — it just needs to exist somewhere under the project root.

### 2. Tell the AI where your source code is

Open `spec/01-overview.md` and fill in the **Source path** field:

```md
**Source path:** src/
```

Use the path relative to the project root. Common values:

| Layout | Source path |
|--------|-------------|
| Source in `src/` | `src/` |
| Next.js / Nuxt app folder | `app/` |
| Source at project root | `.` |
| Monorepo | `apps/web/ apps/api/` |

The AI reads this field first in every session and uses it to locate your code.
If it's missing, the AI will ask before doing anything.

### 3. Initialize the spec

Open Claude Code and run one of:

```
init project       ← brand new project, no code yet
migrate project    ← existing codebase you're bringing in
```

No install, no dependencies. It's a folder of markdown files.

> `CLAUDE.md` is loaded automatically by Claude Code at session start.

---

## Full Walkthrough

Say you have an existing SaaS project — a task management app called **TaskFlow**. It has a Next.js frontend, a Postgres database, and some existing features but no documentation.

### Step 1 — Migrate an existing project

Open Claude Code in your project and say:

```
migrate project
```

The AI will:
1. Read your `package.json`, config files, routes, and schema
2. Map out your stack, features, pages, and architecture
3. Fill in all the files under `spec/`
4. Ask you to confirm: *"Does this capture the project accurately? What did I miss?"*

You review, correct anything wrong, and approve. Now `spec/` is your living project spec.

**Result:** Your `spec/` folder is populated with the current state of the project.

```
spec/
├── 01-overview.md      ← "TaskFlow — team task management SaaS"
├── 02-stack.md         ← Next.js 14, Postgres, Prisma, Clerk, Vercel
├── 03-features.md      ← Auth ✓, Projects ✓, Tasks ✓, Comments — planned
├── 04-pages-modules.md ← /dashboard, /projects/[id], /api/tasks, ...
├── 05-architecture.md  ← app/ layout, API routes, Prisma client singleton
├── 06-data-models.md   ← User, Project, Task schemas
├── 07-dependencies.md  ← next, prisma, @clerk/nextjs, tailwindcss, ...
├── 08-design-notes.md  ← "Optimistic updates on task status changes"
├── 09-debt.md          ← "No error boundaries on project pages — medium"
└── 10-changelog.md     ← "2026-05-04 — initial spec migration"
```

---

### Step 2 — Add a new feature

You have an idea: *"I want users to be able to leave comments on tasks."*

Say to Claude:

```
implement task comments
```

The AI acts as **Task Master** — it doesn't write code yet. Instead it:

1. Asks clarifying questions:
   - *"Should comments support markdown formatting?"*
   - *"Do you need edit/delete, or just post?"*
   - *"Should there be notifications when someone is mentioned?"*

2. Evaluates the idea critically:
   - *"This is genuinely valuable — asynchronous discussion is the most-requested feature in similar tools."*
   - *"Suggest keeping scope tight: text-only comments + delete-own-comment. Markdown and mentions can be follow-up tasks."*

3. Writes a structured task spec and shows it to you:

   ```
   Title: Task Comments — MVP
   What: Users can post and delete text comments on tasks
   Why: Enables async discussion without leaving the app
   Scope:
     IN  — post comment, delete own comment, show comment count on task card
     OUT — markdown, @mentions, notifications, reactions
   Affected modules: TaskDetail page, /api/comments, Prisma schema
   Approach:
     - Add Comment model (id, taskId, authorId, body, createdAt)
     - POST /api/comments, DELETE /api/comments/[id]
     - CommentThread component below task description
   Risks: comment count query adds a join — watch for N+1 on task lists
   ```

4. Asks: *"Does this capture what you want? Approve to create the task file."*

You say **approved**. The AI creates:

```
queue_tasks/task-comments-mvp.md
```

---

### Step 3 — Execute the task

Now say:

```
work queue
```

**Phase 1 — Refine & Evaluate** (already done above since you just created it, but the AI will confirm it's the next task and show the plan)

**→ STOP.** You approve to proceed.

**Phase 2 — Implementation Planning**

The AI reads `spec/05-architecture.md` and the existing codebase, then produces:

```
Files to create:
  app/api/comments/route.ts          — POST handler
  app/api/comments/[id]/route.ts     — DELETE handler
  components/CommentThread.tsx       — thread UI
  components/CommentInput.tsx        — input form

Files to modify:
  prisma/schema.prisma               — add Comment model
  app/projects/[id]/tasks/[id]/page.tsx — add <CommentThread />

Steps:
  1. Add Comment model to Prisma schema
  2. Run prisma migrate dev --name add-comments
  3. Implement POST /api/comments with auth check
  4. Implement DELETE /api/comments/[id] — only author can delete
  5. Build CommentThread component (read-only list)
  6. Build CommentInput component (form + optimistic update)
  7. Wire into TaskDetail page

Trade-offs:
  - Polling vs websockets: using polling (5s interval) — simpler, good enough for MVP
  - Not paginating comments — task comments rarely exceed 50, revisit if needed

Out of scope: markdown rendering, @mentions, notifications
```

**→ STOP.** You review the plan and approve.

**Phase 3 — Implementation**

The AI writes the code exactly as planned. No surprises, no extra features.

**Phase 4 — Spec Sync**

The AI updates the relevant `spec/` files:

- `spec/03-features.md` — moves "Comments" from Planned → Implemented
- `spec/06-data-models.md` — adds the `Comment` model table
- `spec/07-dependencies.md` — no new deps needed
- `spec/10-changelog.md` — adds `2026-05-04 — added task comments MVP`

**Phase 5 — Pause & Review**

**→ STOP.** The AI presents a full summary and waits. It does not commit.

```
## Changes Summary

Implemented:
  ✓ Comment model (Prisma migration: 20260504_add_comments)
  ✓ POST /api/comments — creates comment, returns 201
  ✓ DELETE /api/comments/[id] — author-only, returns 204
  ✓ <CommentThread /> — renders comments with author + timestamp
  ✓ <CommentInput /> — optimistic submit, error rollback
  ✓ Wired into TaskDetail page

Spec updated:
  ✓ spec/03-features.md — Comments moved to Implemented
  ✓ spec/06-data-models.md — Comment model added
  ✓ spec/10-changelog.md — entry added

Watch out for:
  - The comment count join on task list queries — run EXPLAIN ANALYZE
    if you notice slowness on large projects

Anything to adjust, or ready to commit?
```

You review the changes in your editor. Everything looks good.

---

### Step 4 — Git commit

You commit manually. The AI never runs `git commit`.

The AI suggests a commit message:

```
feat: add task comments MVP

- Comment model + migration
- POST /api/comments, DELETE /api/comments/[id]
- CommentThread + CommentInput components
- Wired into TaskDetail page
```

You run:

```bash
git add .
git commit -m "feat: add task comments MVP

- Comment model + migration
- POST /api/comments, DELETE /api/comments/[id]
- CommentThread + CommentInput components
- Wired into TaskDetail page"
```

Done. One complete cycle.

---

## Other Features

### Find technical debt

```
find technical debt in the API routes
```

The AI reads your API layer, categorizes issues by severity (duplication, fragility, security, etc.), and asks which ones you want queued as tasks.

### Suggest improvements

```
suggest features
suggest architecture improvements
suggest refactors
```

The AI generates 3–5 ideas per category, evaluates their value and risk, and queues the ones you approve.

### Generate tests

```
generate tests for the comments feature
```

The AI maps coverage gaps, designs test suites (unit / integration / e2e), and queues each suite as a task so test implementation goes through the normal approval cycle.

### Sync spec after manual changes

If you made changes outside the workflow (hotfix, manual refactor), the spec may drift. Run:

```
sync spec
```

The AI audits the codebase against `spec/`, shows you every discrepancy, and updates the files after approval.

---

## Command Reference

| What you say | What happens |
|---|---|
| `init project` | Interview → build `spec/` from scratch |
| `migrate project` | Gap-analyze old vs new project → clarify plan → queue migration tasks |
| `implement [feature]` | Task Master refines idea → creates task file |
| `work queue` | Pick next task → full 5-phase execution cycle |
| `find technical debt in [area]` | Debt analysis → queue tasks |
| `suggest features` | Feature ideas → queue approved ones |
| `suggest architecture improvements` | Arch analysis → queue tasks |
| `generate tests for [area]` | Test plan → queue suites |
| `sync spec` | Audit codebase → update `spec/` files |

---

## How the files work together

```
CLAUDE.md                        Rules the AI follows (auto-loaded, stays at project root)
.simple-spec/SPEC.md             Index pointing to spec/ files
.simple-spec/spec/               Living project documentation (one file per concern)
.simple-spec/queue_tasks/        Pending work items (one file per task)
.simple-spec/completed_tasks/    Finished tasks, moved here after user approval
.simple-spec/prompts/            Named workflows the AI can execute on demand
```

Tasks in `queue_tasks/` move through statuses: `draft → refined → approved → in-progress → done`
On completion, the file is moved to `completed_tasks/` — the queue stays clean, history is preserved.

The AI only writes code during Phase 3. All other phases are thinking, planning, or reviewing.

---

## What this is not

- Not a build tool or CLI
- Not an automated pipeline — every phase requires human approval
- Not a replacement for Git, CI, or code review

It's a conversation framework. You stay in control. The AI does the thinking work between your decisions.
