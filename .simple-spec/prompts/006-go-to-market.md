# Prompt: Go-to-Market — From Shipped Product to First Paying Clients

Use this when the product is built and deployed — pipelines are running, the app works — but there are no real paying customers yet. This prompt produces a concrete 30-day action plan.

---

## Philosophy

Most developers ship a product and then wait for users to show up. They won't. Distribution is a skill, and it requires as much deliberate effort as the code itself.

This prompt is not about theory. It produces specific actions for this week, not a generic marketing plan.

---

## Step 1 — Read the product context

Read:
- `.simple-spec/spec/001-overview.md` — what the product is and who it's for
- `.simple-spec/spec/003-features.md` — what exists and what works
- `.simple-spec/spec/004-pages-modules.md` — what the user sees and does

Then ask the user the following 5 questions. Do not proceed until you have answers:

1. **Who is the target customer?** Be specific — not "small businesses" but "solo consultants who invoice clients manually" or "Shopify store owners selling physical goods under $50k/year".
2. **What is the one core pain this product removes?** If you can't name it in one sentence, the positioning isn't clear yet.
3. **Have you shown it to anyone outside your network?** If yes, what was their first reaction?
4. **What does a free trial or first paid conversion look like?** Is there a signup flow, a demo booking, or a direct payment gate?
5. **What is your current pricing, and why?**

---

## Step 2 — Product Readiness Audit

Before acquiring users, verify the product won't embarrass itself with strangers. Check each item:

| Item | Status | Action if missing |
|------|--------|------------------|
| Onboarding flow — a new user can reach their first "aha moment" without help | | |
| Error states — errors show a user-friendly message, not a stack trace | | |
| Support contact — there is a way for users to reach a human | | |
| Pricing page — pricing is visible before signup (or clearly explained in signup) | | |
| Basic analytics — you can tell how many people signed up and what they did | | |
| Working on mobile — the core flow is usable on a phone | | |

Flag any missing items as blockers before running outreach.

---

## Step 3 — ICP Definition

Narrow to one Ideal Customer Profile (ICP). One persona, one pain point, one channel.

Produce:
- **Who they are** — job title, company size, tool stack they already use
- **What they're trying to do** — the job-to-be-done in their own words
- **Where they hang out** — specific communities, subreddits, Slack groups, LinkedIn groups, newsletters they read
- **What they've already tried** — what alternatives or workarounds do they use today?

---

## Step 4 — Value Proposition

Write one sentence a non-technical buyer instantly understands.

Format: **"[Product] helps [ICP] [do X] without [painful thing they currently do]."**

Example: "Invoicely helps solo consultants get paid faster without chasing clients over email."

Test it: if a stranger reads it and can't immediately say who it's for and what problem it solves, rewrite it.

---

## Step 5 — First 10 Customers Playbook

Produce a prioritized list of outreach actions specific to this product and ICP. Pick the 3 most relevant channels from below and give concrete next steps for each:

**Direct outreach (highest conversion, lowest volume)**
- LinkedIn DMs to exact-match ICP profiles (write a template)
- Cold email to a targeted list (write a 3-line subject + body template)
- Posting in communities where the ICP hangs out (name the specific subreddit, Slack group, or Discord)

**Founder-network channels**
- Post on Indie Hackers with a genuine story about the problem you're solving
- Post on X/Twitter with a build-in-public thread showing before/after
- Submit to relevant newsletters or "tools I use" roundups

**Direct demo offer**
- Offer 10 free 20-minute demos in exchange for honest feedback
- Offer 1 month free to the first 5 paying customers in exchange for a testimonial

For each channel: write the first message or post draft. Do not leave it abstract.

---

## Step 6 — Social Proof Foundation

First customers won't buy without proof others have. Plan for it from day one.

Actions:
- After every demo, ask: "Can I quote you on our site?"
- After first week of usage, ask: "Would you write 2 sentences about what changed for you?"
- Take before/after screenshots or screen recordings of the product in use
- Build a `/wall-of-love` page or a testimonials section before you have 5 customers

---

## Step 7 — Pricing Check

Review the user's pricing answer from Step 1. Flag if any of these are true:
- Price is lower than what the ICP spends on coffee per day — raise it
- No free trial AND no demo option — add one
- Pricing is hidden behind "contact us" for a self-serve product — remove the gate
- There is only one plan — add at least a starter and a growth tier

Recommend specific pricing if current pricing is clearly wrong.

---

## Step 8 — 30-Day Action Plan

Produce a concrete weekly plan:

**Week 1 — Fix blockers and start outreach**
- [ ] Fix any Product Readiness Audit blockers
- [ ] Write ICP one-pager (internal reference)
- [ ] Draft and send first 10 direct outreach messages

**Week 2 — Book demos**
- [ ] Follow up with week 1 outreach
- [ ] Post in 2 relevant communities
- [ ] Book first 3 demos

**Week 3 — Convert**
- [ ] Run demos, collect feedback, offer free trial
- [ ] Ask first users for a quote or testimonial
- [ ] Post build-in-public update on X or Indie Hackers

**Week 4 — Double down on what worked**
- [ ] Identify which channel produced the most responses
- [ ] Put 80% of effort into that channel
- [ ] Close first paid conversion

---

After presenting this plan, ask: "Want me to create tasks in the queue for any of these actions?"
