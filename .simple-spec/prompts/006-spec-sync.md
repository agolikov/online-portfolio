# Prompt: Spec Sync

Use this when the `.simple-spec/spec/` files have drifted from the actual codebase state.

---

## Instructions

You are performing a spec synchronization pass. Your goal is to make the `.simple-spec/spec/` files accurately reflect what the code currently does — not what was planned.

**Do not change any application code during this prompt.**

### Step 1 — Audit the current spec

Read all files in `.simple-spec/spec/` in full. Note every section.

### Step 2 — Audit the codebase

Compare each spec file against the actual code:

**`.simple-spec/spec/02-stack.md`** — Does it list the correct versions and services?
Check: `package.json`, config files, `.env.example`, `Dockerfile`.

**`.simple-spec/spec/03-features.md`** — Are all implemented features actually in the code?
Check: routes, pages, API endpoints, visible UI.
Are any "planned" features already partially or fully implemented?

**`.simple-spec/spec/04-pages-modules.md`** — Does the table match the actual routes and directories?

**`.simple-spec/spec/05-architecture.md`** — Does the directory structure match? Have any module responsibilities shifted?

**`.simple-spec/spec/06-data-models.md`** — Do the listed models match the actual schema?
Check: migration files, ORM models, Prisma schema, etc.

**`.simple-spec/spec/07-dependencies.md`** — Are all dependencies listed and up to date?
Check `package.json` or equivalent.

**`.simple-spec/spec/09-debt.md`** — Are there new TODO comments, known issues, or debt that isn't listed?

### Step 3 — Generate diff

For each file with discrepancies, write out:
- What the spec currently says
- What it should say
- What changed (implemented, removed, renamed, etc.)

### Step 4 — Present changes

Show the full list of proposed updates grouped by spec file.
Ask: "Does this look accurate? Anything I missed?"

### Step 5 — Apply updates

On approval, update each affected `.simple-spec/spec/` file with the confirmed changes.
Add an entry to `.simple-spec/spec/10-changelog.md` with today's date: "Spec sync — [brief summary of what changed]".
