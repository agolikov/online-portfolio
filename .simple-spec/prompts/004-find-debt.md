# Prompt: Identify Technical Debt

Use this to find the architectural and design decisions that will hurt you as the project scales — not cosmetic issues, not easy wins, not naming preferences.

---

## Philosophy

This is not a style guide. This is a survivability audit.

Focus exclusively on decisions that **will break the system, the team, or the business** as load, users, or team size grows. If a problem only matters at current scale, skip it. If a problem would be embarrassing but not catastrophic, skip it. Report what matters.

Be direct. If something is a serious mistake, say so. Do not soften findings to protect feelings.

**Do not fix anything yet.** Read and report only.

**Target area:** <!-- specify: a module, a feature, a layer, or "full codebase" -->

---

## Step 1 — Read the target area

Read all relevant source files in the target area thoroughly.
Also read:
- `.simple-spec/spec/005-architecture.md` — intended architecture
- `.simple-spec/spec/009-debt.md` — known issues already tracked
- `package.json` / dependency manifests — library versions and choices

---

## Step 2 — Identify debt by category

Work through each category below. For each issue found, record it.

**Only include items that are genuinely dangerous at scale. Skip small stuff.**

### Categories

| Category | What to look for |
|----------|-----------------|
| **Scalability traps** | Monolithic synchronous request chains, missing job queues, in-process caching that won't survive horizontal scaling, polling instead of webhooks/events |
| **Security time-bombs** | JWTs without rotation or revocation, no rate limiting on public endpoints, broad DB permissions (no row-level security), secrets in code or unprotected env vars, no CSRF protection |
| **Observability blindness** | No structured logging (console.log is not logging), no distributed tracing, no metrics/alerting, no audit trail for critical actions |
| **Data model rigidity** | No soft deletes (hard deletes that break foreign keys or audit trails), no multi-tenancy hooks if SaaS, missing `created_at`/`updated_at`, no versioning for critical records |
| **Dependency risk** | Pinned to a major version with known security issues, a single library doing too much (one update breaks everything), circular dependencies, enormous bundle from a library used for one util |
| **Testing gaps that block refactoring** | Zero integration tests on critical paths, mocks that don't match real contracts, no tests at all on payment/auth/data flows |
| **Architecture violations** | Business logic in route handlers, DB queries in UI components, no clear separation of layers, circular module imports |

---

## Step 3 — Score each item

For each issue, assign:

- **Scale risk** — when does this break?
  - 🔴 **Breaks at 2x** — already a problem or will be very soon
  - 🟠 **Breaks at 10x** — growth-stage risk, plan to fix before scaling
  - 🟡 **Breaks at 100x** — enterprise scale, but worth knowing now
- **Effort to fix:** small (hours) | medium (days) | large (weeks)

---

## Step 4 — Present findings

Sort by scale risk: 🔴 first, then 🟠, then 🟡. Within each tier, sort by effort (small first — highest ROI).

Use this format for each item:

```
### [Short name for the problem]

Scale risk: 🔴 / 🟠 / 🟡
Category: [from the table above]

**What it is:** Describe the current code decision or pattern concretely. Name the file or module if possible.

**Why it breaks:** Describe the specific failure mode. What goes wrong, for whom, and at what point?

**Modern replacement:** Name the specific library, pattern, or architectural approach that solves this. Include a concrete example or reference — do not be vague. E.g.:
  - "Replace manual polling with webhooks + a job queue (BullMQ / Inngest)"
  - "Add Pino for structured logging; wire to Datadog or Axiom"
  - "Move to Prisma row-level security or Supabase RLS policies"

**Effort to fix:** small / medium / large
```

If there are no findings in a category, omit that category.

---

## Step 5 — Queue tasks

After presenting findings, ask: "Do you want to create a task for any of these?"

For each approved item, create `.simple-spec/tasks/debt-[kebab-description].md` with:
- The problem description (from the finding above)
- Why it matters — the concrete failure mode
- Rough fix approach with the specific modern replacement named
- Scale risk tier so it can be prioritized against other work
