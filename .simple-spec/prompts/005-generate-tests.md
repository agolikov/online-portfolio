# Prompt: Generate Tests

Use this to plan and queue test coverage for a specific module, feature, or area.

---

## Instructions

You are performing a test coverage analysis and planning pass.
Your goal is to identify what should be tested, design the test cases, and queue the implementation.

**Do not write test code yet** — create task files so each test suite goes through the normal approval cycle.

### Step 1 — Read the target

Read all code in the target area:
- The module / feature under test
- Existing test files (if any) — understand current coverage and patterns
- `.simple-spec/spec/003-features.md` and `.simple-spec/spec/005-architecture.md` — understand intended behavior

### Step 2 — Categorize test needs

**Unit tests:** Pure functions, utilities, transformations. No side effects.
**Integration tests:** Multiple modules working together, DB interactions, service calls.
**End-to-end tests:** User flows, full request/response cycles.
**Edge case tests:** Invalid input, error states, boundary conditions, concurrency.

### Step 3 — Map coverage gaps

For each gap:
- What behavior is untested?
- What is the risk of it breaking undetected?
- What type of test is appropriate?

### Step 4 — Design test cases

For each test suite:
```
Suite: [name]
Type: unit | integration | e2e
What it tests: [behavior description]
Test cases:
  - [scenario]: [expected outcome]
  - [scenario]: [expected outcome]
Setup required: [fixtures, mocks, seeds]
```

### Step 5 — Present and queue

Show the full test plan to the user.
For each approved suite, create `.simple-spec/tasks/tests-[kebab-description].md`.

Each test task should include:
- The test suite design from Step 4
- File path for the test file
- Any fixtures or setup needed
