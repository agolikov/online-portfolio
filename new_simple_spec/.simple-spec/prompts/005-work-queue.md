# Prompt: Work Queue (Full 5-Phase Execution)

Use this to pick a task from `.simple-spec/tasks/` and execute it end-to-end.

---

## Instructions

You are executing the full Simple-Spec task cycle. Follow all five phases in order.
**Never skip a phase. Never proceed past a STOP without explicit user approval.**

---

### Phase 1 — Refine & Evaluate

1. List all task files in `.simple-spec/tasks/` that have status `draft` or `refined`.
2. If there are multiple, ask the user which to work on (or suggest the highest-priority one).
3. Read the selected task file.
4. Rewrite the task into a clear, structured plan using the TEMPLATE format.
5. Critically evaluate:
   - Is this valuable? (yes/no + reason)
   - Can it be improved? (suggest improvements)
   - Better alternatives? (propose if any)
   - Risks or concerns?
6. Update the task file with status `refined` and your evaluation.
7. Present the refined task and evaluation to the user.

**STOP. Ask: "Does this plan look right? Any changes before I proceed to implementation planning?"**
Wait for explicit approval ("yes", "approved", "looks good", "proceed") before Phase 2.

---

### Phase 2 — Implementation Planning

1. Read `.simple-spec/spec/005-architecture.md` and `.simple-spec/spec/002-stack.md` to understand current architecture and conventions.
2. Break the task into concrete implementation steps:
   - List every file that will be created, modified, or deleted
   - For each change: what specifically changes and why
   - Sequence the steps in dependency order
3. Identify:
   - **Risks:** what could break, what to test carefully
   - **Trade-offs:** what you chose and what you ruled out
   - **Out of scope:** things you will explicitly not change
4. Update the task file with status `approved` and the implementation plan.
5. Present the full plan.

**STOP. Ask: "Does this implementation plan look right? Approve to begin coding."**
Wait for explicit approval before Phase 3.

---

### Phase 3 — Implementation

1. Execute the plan from Phase 2 exactly as approved.
2. Follow conventions observed in `.simple-spec/spec/` and the existing codebase.
3. Do not add unrequested features, refactors, or abstractions.
4. After all changes: run any relevant lint/type-check/test commands to catch issues.
5. Update the task file status to `in-progress`, then `done` when complete.

---

### Phase 4 — Spec Sync

1. Update every `.simple-spec/spec/` file affected by the implementation:
   - `.simple-spec/spec/003-features.md` — move features Planned → Implemented, or add new ones
   - `.simple-spec/spec/005-architecture.md` — update if module responsibilities changed
   - `.simple-spec/spec/007-dependencies.md` — add new packages
   - `.simple-spec/spec/006-data-models.md` — update if schema changed
   - `.simple-spec/spec/010-changelog.md` — add entry with today's date
2. Show the user a summary of what changed across the spec files.

---

### Phase 5 — Pause & Review

1. Present a complete summary:
   - What was built
   - Files changed (list)
   - What changed in `.simple-spec/spec/`
   - Anything to watch out for (edge cases, follow-up work)
2. **Do not commit. Do not move to the next task.**
3. Enter feedback loop:
   - User reviews the changes
   - Address any requested fixes (re-run phases as needed)
   - Ask: "Anything else to adjust, or are you ready to commit?"
4. When the user says they're ready to commit, provide the suggested commit message.
5. Move the task file from `.simple-spec/tasks/` to `.simple-spec/tasks/` (keep the filename, update status to `done`).

**The user commits manually. You do not run `git commit`.**
