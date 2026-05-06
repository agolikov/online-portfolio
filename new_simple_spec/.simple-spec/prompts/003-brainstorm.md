# Prompt: Brainstorm — Draft to Task

Use this to convert a raw draft file from `.simple-spec/drafts/` into a structured task in `.simple-spec/tasks/`.

Drafts are unfiltered — stream of consciousness, voice notes, half-formed ideas. Your job is to extract the real intent, give it structure, and challenge it critically before it enters the task queue.

---

## Step 1 — Select a draft

List all files in `.simple-spec/drafts/` (ignore `.gitkeep`).

- If there is only one file: use it, tell the user which one you're processing.
- If there are multiple files: show the list and ask which one to process.
- If the folder is empty: stop and tell the user to drop a draft file into `.simple-spec/drafts/`.

Read the selected draft file in full.

---

## Step 2 — Decode the intent

Do not ask clarifying questions yet. First, do the work of interpretation yourself.

Read the draft carefully and extract:

1. **Core intent** — what the user actually wants, stripped of noise. Write it in one sentence.
2. **The problem being solved** — why does this matter? Who benefits?
3. **What "done" looks like** — what is visibly or measurably different when this is complete?
4. **Scope signal** — is this a small improvement, a new feature, or a larger architectural change?
5. **Ambiguities** — list anything genuinely unclear that you cannot resolve from context.

Present this interpretation to the user:

> "Here's what I think you're asking for: [core intent]. Is this right, or did I miss something?"

If there are ambiguities: ask about them now, max 2 questions. Wait for answers before proceeding.

---

## Step 3 — Evaluate critically

Before writing the task spec, challenge the idea:

**Value check:**
- Is this genuinely valuable, or is it gold-plating / scope creep?
- What happens if this is not built?

**Design check:**
- Is this the right solution, or is there a simpler or better approach?
- Does it introduce complexity that isn't justified by the value?
- Does it conflict with anything in `.simple-spec/spec/005-architecture.md`? (Read it if relevant.)

**Risk check:**
- What can go wrong?
- What other parts of the system does this touch?
- Are there performance, security, or scalability concerns?

State your evaluation plainly. If the idea has a serious flaw, say so directly. The user can override you — but they should hear the concern first.

---

## Step 4 — Write the task spec

Write the full spec using this format:

```
Title: [clear, action-oriented title — verb + noun]
What: [one sentence — what the system does after this change]
Why: [the user/business value this delivers]
Scope:
  In: [what is included]
  Out: [what is explicitly excluded]
Affected modules: [list of files, modules, or layers likely touched]
High-level approach:
  - [step or strategy — not code, just direction]
  - [...]
Risks: [list]
Open questions: [anything still unresolved after the clarification step]
```

Present the spec to the user. Ask: "Does this capture what you want? Say yes to create the task, or tell me what to adjust."

Revise until approved.

---

## Step 5 — Create task and clean up

On approval:

1. Derive a kebab-case filename from the title (e.g. `add-export-to-csv.md`).
2. Create `.simple-spec/tasks/[kebab-title].md` using the TEMPLATE. Fill in:
   - The title
   - Status: `refined`
   - The **Refined Description** section from the spec above
   - The **Evaluation** section from Step 3
   - Leave Implementation Plan blank (that happens in Phase 2 of work-queue)
3. Delete the processed draft file from `.simple-spec/drafts/`.
4. Confirm: "Task created: `.simple-spec/tasks/[filename]`. Draft removed."
