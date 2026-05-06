# Prompt: Find Technical Debt

Use this to systematically identify technical debt in a specific area and queue it for resolution.

---

## Instructions

You are performing a technical debt analysis. Your goal is to find real, actionable problems — not cosmetic preferences.

**Target area:** <!-- specify: a module, a feature, a layer (e.g. "the auth module", "all API routes", "the database layer") -->

**Do not fix anything yet.** Read and report only.

### Step 1 — Read the target area

Read all relevant files in the target area thoroughly.
Also read `.simple-spec/spec/05-architecture.md` to understand intended architecture.

### Step 2 — Identify debt by category

For each issue found, classify it:

| Category | Examples |
|----------|---------|
| **Duplication** | Copy-pasted logic, repeated patterns that should be shared |
| **Fragility** | No error handling, missing edge cases, silent failures |
| **Clarity** | Confusing names, unclear responsibilities, misleading comments |
| **Performance** | N+1 queries, unbounded loops, missing indexes |
| **Security** | Unvalidated input, exposed secrets, insecure defaults |
| **Testability** | Untested critical paths, hard-to-test code, no tests at all |
| **Outdated** | Deprecated APIs, old patterns, packages with known issues |
| **Architecture** | Wrong layer ownership, circular dependencies, leaking abstractions |

### Step 3 — Score each item

For each issue:
- **Severity:** low | medium | high | critical
- **Effort to fix:** small (< 1 hour) | medium (1 day) | large (> 1 day)
- **Risk of leaving it:** low | medium | high

### Step 4 — Present findings

Group by severity. Show highest severity first.
Be specific: file names, line numbers, exact problem.

### Step 5 — Queue tasks

For each finding, ask: "Do you want to create a task for this?"
For approved items, create task files in `.simple-spec/queue_tasks/debt-[kebab-description].md`.

Each debt task file should include:
- The problem description
- Why it matters (risk of leaving it)
- Rough approach to fix it
