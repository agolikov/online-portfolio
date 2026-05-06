# Prompt: Migrate Old Project into New

Use this when you have:
- A **new project** with Simple-Spec already set up (`.simple-spec/spec/` populated, new codebase started)
- An **old project** with existing functionality that needs to be carried over

The goal is to map what exists in the old project against what the new project already has,
identify the gaps, align on what to migrate vs. redesign vs. drop, and produce a set of
structured tasks to complete the migration — at both the **product level** and the **code level**.

**Do not write any code. Do not modify either codebase.** Read and plan only.

---

## Step 1 — Understand the new project

Read the current `.simple-spec/spec/` files in full:
- `.simple-spec/spec/01-overview.md` — what the new project is and who it's for
- `.simple-spec/spec/03-features.md` — what's already implemented and what's planned
- `.simple-spec/spec/05-architecture.md` — the architecture and module structure
- `.simple-spec/spec/06-data-models.md` — current data models

Build a clear picture of: *what the new project already has.*

---

## Step 2 — Analyze the old project

Ask the user: *"Where is the old project? Provide the path or describe its structure."*

Then read the old codebase:
- Config / dependency files (`package.json`, `pyproject.toml`, etc.)
- Route files, page files, API handlers — enumerate all endpoints and pages
- Database schema or ORM models
- Auth mechanism
- Key components or modules
- Any existing README or docs

Build an inventory: *what the old project has.*

---

## Step 3 — Produce a gap analysis

Compare the two inventories. Produce a table with three columns:

| Feature / Functionality | Old Project | New Project |
|-------------------------|-------------|-------------|
| User authentication | ✓ custom JWT | ✓ Clerk |
| Dashboard page | ✓ | ✓ partial |
| CSV export | ✓ | — |
| Email notifications | ✓ Sendgrid | — |
| Admin panel | ✓ | — |
| ... | | |

Categories:
- **Already migrated** — exists in both, no action needed
- **Partially migrated** — exists in both but new version is incomplete
- **Missing** — exists in old, not started in new
- **Old-only / deprecated** — exists in old but may not be needed in new (flag for discussion)

---

## Step 4 — Clarify with the user

Present the gap analysis. Then go through each item in "Missing" and "Old-only / deprecated":

For each item ask:
1. **Migrate as-is?** — port the old implementation to the new stack
2. **Redesign?** — the feature is needed but the old approach was wrong; design a better version
3. **Drop?** — not needed in the new project

Also ask:
- *"Are there features in the old project not captured in this list?"*
- *"Any old functionality that should be merged differently from how it was built?"*
- *"Any constraints — things that must stay compatible with the old system during transition?"*

**STOP. Wait for the user to go through each item before proceeding.**

---

## Step 5 — Align on migration strategy

Based on the user's decisions, summarize the agreed migration plan:

```
MIGRATE AS-IS:
  - [feature] — port from [old module] to [new module pattern]

REDESIGN:
  - [feature] — old approach: [X], new approach: [Y], reason: [Z]

DROP:
  - [feature] — reason: [user's reason]

PARTIAL — COMPLETE:
  - [feature] — what's done, what's missing
```

Ask: *"Does this migration plan look right before I create the tasks?"*

**STOP. Wait for approval.**

---

## Step 6 — Create migration tasks

For each item in MIGRATE, REDESIGN, and PARTIAL, create a task file in `.simple-spec/queue_tasks/`.

Each task file should include:

**For MIGRATE AS-IS:**
- What the feature does (from the old project)
- Where it lives in the old codebase (file paths, modules)
- Where it should live in the new codebase (target module, naming conventions)
- Data model changes needed (if old schema differs from new)
- Any dependencies that need to be added or swapped

**For REDESIGN:**
- What the feature does (user-facing outcome)
- What was wrong with the old approach
- The agreed new approach
- How this differs from the old implementation
- Migration path for any existing data

**For PARTIAL — COMPLETE:**
- What is already done in the new project
- What specifically is missing
- Reference to old implementation as a guide

Name task files: `migration-[kebab-feature-name].md`

---

## Step 7 — Update the spec

After tasks are created, update the new project's spec to reflect the agreed plan:

- `.simple-spec/spec/03-features.md` — add all agreed features to Planned
- `.simple-spec/spec/08-design-notes.md` — note any key decisions made during migration planning
  (e.g. "CSV export was redesigned to use streaming — old version loaded full dataset into memory")
- `.simple-spec/spec/10-changelog.md` — add entry: "Migration planning complete — N tasks queued"
