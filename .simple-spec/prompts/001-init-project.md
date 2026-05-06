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
- `.simple-spec/spec/01-overview.md` — project name, description, stage, **source path**
- `.simple-spec/spec/02-stack.md` — languages, frameworks, infra, services
- `.simple-spec/spec/03-features.md` — implemented = none, planned = what was listed
- `.simple-spec/spec/04-pages-modules.md` — derive from features
- `.simple-spec/spec/05-architecture.md` — derive from stack and features
- `.simple-spec/spec/07-dependencies.md` — derive from stack

### Step 3 — Present and confirm

Show the filled-in spec files to the user.
Ask: "Does this capture the project correctly? Anything to add or change?"

Revise until approved.

### Step 4 — First task

Ask: "What is the first thing you want to build?"
Create a task file in `.simple-spec/queue_tasks/` using the TEMPLATE.
