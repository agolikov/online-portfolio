# Prompt: Suggest Improvements

Use this to generate feature ideas, refactors, or architectural improvements as structured tasks.

---

## Instructions

You are acting as a thoughtful product and engineering advisor. Your goal is to suggest meaningful improvements — not busywork.

**Do not implement anything.** Generate task candidates only.

### Context gathering

First, read:
1. All files in `.simple-spec/spec/` — understand current state, planned features, known issues
2. Recent task files in `.simple-spec/tasks/` — understand what's already queued
3. The area of focus (if specified) — read relevant code

---

## Mode A: Feature Suggestions

Generate 3–5 feature ideas that would provide genuine user value.

For each:
- **What it does** (user-facing description)
- **Why it matters** (the problem it solves or opportunity it captures)
- **Rough complexity** (small / medium / large)
- **Dependencies** (what must exist first)

Present all suggestions. Let the user choose which to turn into tasks.

---

## Mode B: Refactor Suggestions

Identify 3–5 refactors that would meaningfully improve the codebase.

For each:
- **What changes** (specific code area)
- **Current problem** (why it's worth changing)
- **Proposed approach** (high-level strategy, not code)
- **Risk** (what could break)

Prioritize refactors with high payoff and low risk.

---

## Mode C: Architecture Improvements

Identify structural improvements to the system design.

For each:
- **Current state** (what the architecture looks like now)
- **Proposed change** (what it should look like)
- **Why** (the problem this solves at scale or over time)
- **Migration path** (rough steps to get there)
- **Cost** (complexity, time, risk)

Only suggest changes that are justified by real constraints — not theoretical future requirements.

---

## Mode D: UX Suggestions

Read user-facing pages and flows from the spec and codebase. Identify friction, confusion, and missing polish.

Focus areas:
- Confusing or multi-step flows that should be one step
- Missing empty states, loading states, or error states
- Accessibility gaps (no keyboard nav, poor contrast, missing ARIA labels)
- Cognitive overload (too many choices, unclear hierarchy, unclear CTAs)
- Missing feedback (no confirmation after actions, silent failures)
- Onboarding gaps (first-time user has no idea what to do)

For each issue:
| Problem | User Impact | Suggested Fix | Effort |
|---------|------------|---------------|--------|

Present 3–5 highest-impact UX issues. Skip cosmetic preferences.

---

## Mode E: Frontend Suggestions

Analyse component structure, state management, rendering patterns, and dependency choices.

Focus areas:
- Unnecessary re-renders (missing memoization, unstable references)
- Prop drilling through 3+ levels (should be context or a store)
- Missing code splitting / lazy loading on heavy routes
- Manual fetch + useEffect patterns (replace with React Query / SWR)
- Outdated state management (Redux boilerplate → Zustand / Jotai)
- Missing skeleton/loading states on async data
- CSS patterns that don't scale (deeply nested selectors, magic numbers, no design tokens)
- Bundle size issues (importing entire libraries for one utility)

For each issue, be explicit about the modern replacement:

| Current Pattern | Problem at Scale | Modern Alternative | Migration Effort |
|----------------|-----------------|-------------------|-----------------|

Name the specific library or API. Do not be vague.

---

## Mode F: Backend Suggestions

Analyse API design, database access, auth, background jobs, and caching.

Focus areas:
- N+1 queries (fetching in a loop instead of a join or batch)
- Missing database indexes on filtered/sorted columns
- Synchronous work that blocks a request and should be a background job
- No rate limiting on public or auth endpoints
- Over-fetching APIs (returning full objects when only 2 fields are needed)
- Poor error contracts (generic 500s, no error codes, no client-safe messages)
- Missing caching layer in front of expensive or repeated reads
- Auth tokens without expiry rotation or revocation
- Secrets in environment variables without a secrets manager

For each issue, be explicit about the fix:

| Current Pattern | Problem at Scale | Modern Alternative | Migration Effort |
|----------------|-----------------|-------------------|-----------------|

Name the specific library, service, or pattern. Do not be vague.

---

## Task creation

For each approved suggestion, ask: "Want me to create a task for this?"
Create approved items in `.simple-spec/tasks/[kebab-title].md` using the TEMPLATE.
