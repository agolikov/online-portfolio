# Prompt: Initialize Project

Use this when starting a brand-new project with no existing codebase.

---

## Instructions

You are initializing a new software project using the Simple-Spec framework.

**Do not write any code yet.** Your only goal is to populate the files in `.simple-spec/spec/`.

### Step 1 — Interview the user

Ask the following questions one section at a time. Wait for answers before proceeding.

1. **What does this project do?** (one paragraph, who uses it, what problem it solves)
2. **Where is (or will be) the source code?** (path relative to project root, e.g. `src/`, `app/`, `.`)
3. **What is the tech stack?** (languages, frameworks, database, hosting)
4. **What are the first 3–5 features you need?** (list them, rough is fine)
5. **Are there any third-party services or integrations?** (auth, payments, email, etc.)
6. **Any non-obvious constraints or decisions already made?** (performance, compliance, team conventions)

### Step 2 — Fill in spec files

Using the answers, write each file in `.simple-spec/spec/`:
- `.simple-spec/spec/001-overview.md` — project name, description, stage, **source path**
- `.simple-spec/spec/002-stack.md` — languages, frameworks, infra, services
- `.simple-spec/spec/003-features.md` — implemented = none, planned = what was listed
- `.simple-spec/spec/004-pages-modules.md` — derive from features
- `.simple-spec/spec/005-architecture.md` — derive from stack and features
- `.simple-spec/spec/007-dependencies.md` — derive from stack

### Step 3 — Present and confirm

Show the filled-in spec files to the user.
Ask: "Does this capture the project correctly? Anything to add or change?"

Revise until approved.

### Step 4 — Replace starter files

The simple-spec folder ships with `CLAUDE.starter.md` and `README.starter.md` as safe placeholders that won't collide with existing project files. After a successful init, replace them with real project-specific files.

**CLAUDE.md**
- Check if `CLAUDE.md` already exists at the project root.
- If it does **not** exist: copy `CLAUDE.starter.md` to `CLAUDE.md` (no changes needed — the starter is already correct workflow instructions for Claude).
- If it **does** exist: append the contents of `CLAUDE.starter.md` to the bottom of the existing `CLAUDE.md`, under a `## Simple-Spec Workflow` heading, avoiding any duplication.
- Delete `CLAUDE.starter.md` after.

**README.md**
- Check if `README.md` already exists at the project root.
- If it does **not** exist: generate a new `README.md` from the spec answers. Include: project name, one-paragraph description, tech stack, and a "Getting started" section. Use a clean, minimal format.
- If it **does** exist: read it, then ask the user: "A README.md already exists. Do you want me to update it with the project description from the spec, or leave it as-is?"
  - If update: prepend or replace only the top description block; preserve everything else.
  - If leave: skip.
- Delete `README.starter.md` after (regardless of whether README.md was updated).

### Step 5 — First task

Ask: "What is the first thing you want to build?"
Create a task file in `.simple-spec/tasks/` using the TEMPLATE.
