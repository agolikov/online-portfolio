# Simple-Spec

A spec-first, AI-assisted development framework for software projects.

**The idea:** Before writing code, write a clear spec. Before implementing a feature, write a clear plan. The AI helps with both — but never skips ahead.

---

## How it works

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 1 — SPEC                                                     │
│                                                                     │
│  Empty folder?          Existing codebase?                          │
│  "init project"         "migrate project"                           │
│       │                       │                                     │
│       └───────────┬───────────┘                                     │
│                   ▼                                                 │
│           ┌───────────────┐                                         │
│           │  spec/ filled │  001-overview, 002-stack,               │
│           │  AI interviews│  003-features, 005-architecture…        │
│           │  you or reads │                                         │
│           │  the codebase │                                         │
│           └───────┬───────┘                                         │
│                   │                                                 │
├───────────────────┼─────────────────────────────────────────────────┤
│  PHASE 2 — BUILD  │  repeat for every feature                       │
│                   │                                                 │
│                   ▼                                                 │
│       ┌───────────────────────┐                                     │
│       │  Got an idea?         │                                     │
│       │                       │                                     │
│       │  Option A — quick     │  Drop a file in drafts/             │
│       │  "brainstorm drafts"  │  AI decodes intent → task           │
│       │                       │                                     │
│       │  Option B — direct    │  "implement [feature]"              │
│       │  "implement …"        │  AI interviews you → task           │
│       └───────────┬───────────┘                                     │
│                   ▼                                                 │
│           ┌───────────────┐                                         │
│           │  tasks/ file  │  status: refined                        │
│           └───────┬───────┘                                         │
│                   ▼                                                 │
│           "work queue"                                              │
│                   │                                                 │
│       ┌───────────▼───────────┐                                     │
│       │  Phase 1  Refine      │  AI critiques the task    → STOP    │
│       │  Phase 2  Plan        │  AI writes impl plan      → STOP    │
│       │  Phase 3  Implement   │  AI writes the code                 │
│       │  Phase 4  Spec sync   │  AI updates spec/                   │
│       │  Phase 5  Review      │  AI presents summary      → STOP    │
│       └───────────┬───────────┘                                     │
│                   │  you approve                                    │
│                   ▼                                                 │
│           git commit  ← you, never the AI          ┐               │
│                   │                                │               │
│                   └──── next feature ──────────────┘               │
│                                                                     │
│           while building, also run anytime:                         │
│           "find technical debt in [area]"  → queue fixes            │
│           "suggest UX / frontend / backend improvements"            │
│           "generate tests for [feature]"                            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  PHASE 3 — SHIP                                                     │
│                                                                     │
│  Product is deployed and working. No paying users yet.              │
│                                                                     │
│  "go to market"                                                     │
│       │                                                             │
│       ▼                                                             │
│  Product readiness audit → ICP definition → value proposition       │
│  → outreach playbook with draft messages → pricing check            │
│  → 30-day action plan to first paying clients         → STOP        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  PHASE 4 — GROW                                                     │
│                                                                     │
│  Early customers exist. Need repeatable growth.                     │
│                                                                     │
│  "marketing promotion"                                              │
│       │                                                             │
│       ▼                                                             │
│  Stage assessment (pre-revenue / early / scaling)                   │
│  → channel priority map → content & SEO plan                        │
│  → distribution checklists (Product Hunt, X, LinkedIn, email)       │
│  → retention & NPS loop → paid acquisition guardrails               │
│  → 90-day growth roadmap                             → STOP         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

  STOP = AI halts and waits for your explicit approval before continuing
```

---

## Setup

### 1. Place Simple-Spec at your project root

Simple-Spec lives in a `.simple-spec/` folder at the root of your project, alongside your source code.
`CLAUDE.starter.md` must be initialized to `CLAUDE.md` at the root so Claude Code auto-loads it (the `init project` command handles this).

```
your-project/              ← open this folder in Claude Code
│
├── CLAUDE.md              ← auto-loaded by Claude Code (generated from CLAUDE.starter.md on init)
│
├── .simple-spec/          ← all framework files live here
│   ├── SPEC.md
│   ├── spec/
│   ├── drafts/            ← drop raw ideas here as text files
│   ├── tasks/             ← structured task files live here
│   └── prompts/
│
└── src/                   ← your source code (could be src/, app/, or .)
```

Your source code folder name doesn't matter — it just needs to exist somewhere under the project root.

### 2. Tell the AI where your source code is

Open `spec/001-overview.md` and fill in the **Source path** field:

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

> On init, `CLAUDE.starter.md` is copied to `CLAUDE.md` at the project root and then removed. If a `CLAUDE.md` already exists, the workflow instructions are appended to it.

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
├── 001-overview.md      ← "TaskFlow — team task management SaaS"
├── 002-stack.md         ← Next.js 14, Postgres, Prisma, Clerk, Vercel
├── 003-features.md      ← Auth ✓, Projects ✓, Tasks ✓, Comments — planned
├── 004-pages-modules.md ← /dashboard, /projects/[id], /api/tasks, ...
├── 005-architecture.md  ← app/ layout, API routes, Prisma client singleton
├── 006-data-models.md   ← User, Project, Task schemas
├── 007-dependencies.md  ← next, prisma, @clerk/nextjs, tailwindcss, ...
├── 008-design-notes.md  ← "Optimistic updates on task status changes"
├── 009-debt.md          ← "No error boundaries on project pages — medium"
└── 010-changelog.md     ← "2026-05-04 — initial spec migration"
```

---

### Step 2 — Capture a raw idea

You have an idea but don't want to stop and structure it yet. Create a file anywhere in `.simple-spec/drafts/`:

```
.simple-spec/drafts/comments-idea.md
```

Write anything — stream of consciousness is fine:

```
users should be able to leave comments on tasks. maybe @mentions too?
need threading. or maybe just flat. idk - something slack-like but simpler
```

Then say:

```
brainstorm drafts
```

The AI reads the draft, decodes the real intent, challenges it, and produces a structured spec for your approval. On approval, it creates a task file in `tasks/` and deletes the draft.

---

### Step 3 — Execute the task

Now say:

```
work queue
```

**Phase 1 — Refine & Evaluate**

The AI picks the next task, confirms the plan, and evaluates it critically.

**→ STOP.** You approve to proceed.

**Phase 2 — Implementation Planning**

The AI reads `spec/005-architecture.md` and the existing codebase, then produces:

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
```

**→ STOP.** You review the plan and approve.

**Phase 3 — Implementation**

The AI writes the code exactly as planned. No surprises, no extra features.

**Phase 4 — Spec Sync**

The AI updates the relevant `spec/` files:

- `spec/003-features.md` — moves "Comments" from Planned → Implemented
- `spec/006-data-models.md` — adds the `Comment` model table
- `spec/007-dependencies.md` — no new deps needed
- `spec/010-changelog.md` — adds entry

**Phase 5 — Pause & Review**

**→ STOP.** The AI presents a full summary and waits. It does not commit.

You review the changes in your editor, request any adjustments, then commit manually. The AI never runs `git commit`.

---

## Other Commands

### Brainstorm from a draft

Drop a raw idea as a text file into `.simple-spec/drafts/` then say:

```
brainstorm drafts
```

The AI decodes intent, challenges the idea, writes a structured spec, and — on approval — creates a task file and removes the draft.

### Find technical debt

```
find technical debt in the API routes
```

The AI reads your target area and identifies decisions that **will break as the project scales** — not cosmetic issues. Each finding is rated by when it breaks (2x / 10x / 100x traffic) and paired with a specific modern replacement. You choose which ones to queue as tasks.

### Suggest improvements

```
suggest features          ← new user-facing features
suggest refactors         ← codebase improvements
suggest architecture improvements   ← structural changes
suggest UX improvements   ← user flows, empty states, accessibility
suggest frontend improvements  ← rendering patterns, state management, bundle size
suggest backend improvements   ← API design, queries, caching, jobs
```

The AI generates 3–5 specific, actionable ideas per category with named libraries and migration paths — not vague advice.

### Generate tests

```
generate tests for the comments feature
```

The AI maps coverage gaps, designs test suites (unit / integration / e2e), and queues each suite as a task.

### Go to market

When the product is shipped and working but has no paying customers yet:

```
go to market
```

The AI audits product readiness, defines your ICP, sharpens the value proposition, and produces a concrete 30-day action plan for getting first paying clients.

### Marketing and promotion

When you have early customers and need a repeatable growth engine:

```
marketing promotion
```

The AI assesses your current stage (pre-revenue / early revenue / scaling) and produces a prioritized roadmap covering content, distribution channels, retention, and paid acquisition — with specific tools and metrics.

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
| `init project` | Interview → build `spec/` from scratch → generate `CLAUDE.md` and `README.md` |
| `migrate project` | Gap-analyze existing codebase → clarify plan → queue migration tasks |
| `brainstorm drafts` | Convert raw draft from `drafts/` → structured task in `tasks/` |
| `implement [feature]` | Task Master refines idea → creates task file |
| `work queue` | Pick next task → full 5-phase execution cycle |
| `find technical debt in [area]` | Scalability-focused debt analysis → queue tasks |
| `suggest features` | Feature ideas → queue approved ones |
| `suggest UX improvements` | UX friction and accessibility gaps → queue tasks |
| `suggest frontend improvements` | Component patterns, state, bundle → queue tasks |
| `suggest backend improvements` | API, queries, caching, jobs → queue tasks |
| `suggest architecture improvements` | Structural analysis → queue tasks |
| `generate tests for [area]` | Test plan → queue suites |
| `go to market` | Product readiness audit → ICP → 30-day first-client action plan |
| `marketing promotion` | Stage-appropriate growth roadmap → channels, retention, metrics |
| `sync spec` | Audit codebase → update `spec/` files |

---

## How the files work together

```
CLAUDE.md                        Rules the AI follows (auto-loaded, stays at project root)
CLAUDE.starter.md                Template — copied to CLAUDE.md on init, then removed
README.starter.md                This file — replaced by a project-specific README on init
.simple-spec/SPEC.md             Index pointing to spec/ section files
.simple-spec/spec/               Living project documentation (one file per concern)
.simple-spec/drafts/             Raw idea files — consumed and deleted by brainstorm
.simple-spec/tasks/              Structured task files (one per task, status tracked inside)
.simple-spec/prompts/            Named workflows the AI executes on demand
```

Tasks in `tasks/` move through statuses: `draft → refined → approved → in-progress → done`.

The AI only writes code during Phase 3. All other phases are thinking, planning, or reviewing.

---

## What this is not

- Not a build tool or CLI
- Not an automated pipeline — every phase requires human approval
- Not a replacement for Git, CI, or code review

It's a conversation framework. You stay in control. The AI does the thinking work between your decisions.
