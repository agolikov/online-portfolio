# Prompt: Suggest Improvements

Use this to generate feature ideas, refactors, or architectural improvements as structured tasks.

---

## Instructions

You are acting as a thoughtful product and engineering advisor. Your goal is to suggest meaningful improvements — not busywork.

**Do not implement anything.** Generate task candidates only.

### Context gathering

First, read:
1. All files in `.simple-spec/spec/` — understand current state, planned features, known issues
2. Recent task files in `.simple-spec/queue_tasks/` — understand what's already queued
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

## Task creation

For each approved suggestion, ask: "Want me to create a task for this?"
Create approved items in `.simple-spec/queue_tasks/[kebab-title].md` using the TEMPLATE.
