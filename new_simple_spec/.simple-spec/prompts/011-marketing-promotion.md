# Prompt: Marketing & Promotion — Building a Growth Engine

Use this when the product has early customers and you need to build a repeatable, scalable way to grow. This is the step after `go-to-market.md`.

---

## Philosophy

Early traction from direct outreach doesn't scale. At some point you need channels that work while you sleep. This prompt helps you build those channels — methodically, based on your current stage, not based on what worked for someone else's product.

**Do not do everything at once.** Pick one channel, own it, then expand.

---

## Step 1 — Read the product context

Read:
- `.simple-spec/spec/001-overview.md` — product and audience
- `.simple-spec/spec/003-features.md` — what exists

Then ask the user:

1. **What is your current growth stage?**
   - A) Pre-revenue — still getting first users
   - B) Early revenue — 1–20 paying customers, mostly from direct outreach
   - C) Scaling — 20+ customers, looking for repeatable growth
2. **What channels have you already tried?** What worked, what didn't?
3. **How much time per week can you spend on marketing?** (be honest — 1 hour vs 5 hours vs 20 hours changes everything)
4. **Do you have a content writing habit?** (blog posts, Twitter, LinkedIn — can you commit to publishing weekly?)
5. **What is your current MRR and target MRR in 6 months?**

Tailor all recommendations to the answers above. Do not recommend paid ads to a pre-revenue product.

---

## Step 2 — Channel Map by Stage

Based on the growth stage, present the recommended channel priority:

### Stage A — Pre-revenue
1. Direct outreach (LinkedIn DMs, cold email) — highest conversion
2. Community posting (Reddit, Indie Hackers, Slack groups) — free distribution
3. Build-in-public on X/Twitter — builds credibility over time
4. Product Hunt launch — one-time spike, good for early social proof

### Stage B — Early revenue (1–20 customers)
1. Build-in-public content + case studies from existing customers
2. SEO foundation — start now, it takes 6–12 months to compound
3. Partner integrations — piggyback on tools the ICP already uses
4. Referral program — existing customers are your best salespeople
5. Newsletter or email list — own the audience, don't rent it

### Stage C — Scaling (20+ customers)
1. Content marketing at scale — programmatic SEO, comparison pages, use-case landing pages
2. Paid acquisition — Google Search (intent-based), Reddit ads (community targeting)
3. Affiliate / partner program
4. Community building — owned Discord, Slack, or forum
5. Analyst relations and directory listings (G2, Capterra, Product Hunt collections)

---

## Step 3 — Content Marketing

If the user can commit to writing, this is the highest-leverage long-term channel.

Produce:
- **5 core SEO keywords** the ICP searches for (problem-aware, not product-aware)
  - Format: "[problem] tool", "[alternative to X]", "how to [do X without Y]"
- **3 blog post titles** the ICP would actually click
- **Programmatic page ideas** — e.g. "[Product] vs [Competitor]", "Best tools for [ICP job]", "[Use case] for [industry]"
- **A 4-week publishing cadence** — one post per week, specific titles

---

## Step 4 — Distribution Channels

For each channel the user selects, produce a concrete setup checklist:

**Product Hunt**
- [ ] Set launch date (Tuesday–Thursday, 12:01am PST)
- [ ] Prepare: tagline (60 chars), description (260 chars), gallery (5 screenshots), demo video (60s)
- [ ] Line up 20+ supporters before launch day
- [ ] Post in IH, X, and email list the morning of launch
- [ ] Respond to every comment within 2 hours on launch day

**Twitter / X (build-in-public)**
- Post format that works: problem → solution → result, with screenshots
- Cadence: 3x per week minimum
- Engage with replies within 1 hour of posting
- Use relevant hashtags: #buildinpublic, #indiehackers, #saas + niche tags

**LinkedIn**
- Works better for B2B products
- Post case studies and before/after results (not feature announcements)
- Cadence: 2x per week
- Connect with exact-match ICP profiles and engage their content first

**Newsletter / Email list**
- Start collecting emails on day one — add a "stay in the loop" input to the homepage
- Send one email per week: a tip, a case study, or a product update
- Use Resend, ConvertKit, or Loops (for product-integrated sends)

---

## Step 5 — Retention & Expansion

Acquiring users is expensive. Keeping them is cheap. Every churned customer is a failed marketing investment.

Produce a retention checklist:

**Activation (getting users to their first value)**
- [ ] Define the "aha moment" — the one action that predicts long-term retention
- [ ] Instrument it — can you measure how many users reach it?
- [ ] Add in-app prompts that guide new users toward it within first session

**Engagement (keeping users active)**
- [ ] Weekly product email (digest, tip, or new feature)
- [ ] In-app tooltips for underused features
- [ ] Usage milestone emails ("You've done X — here's what to try next")

**Expansion (turning single users into teams or higher plans)**
- [ ] Add a visible upgrade path inside the app (not just on the pricing page)
- [ ] Trigger upgrade prompts at usage limits, not before
- [ ] Offer annual billing at a discount to reduce churn surface

**NPS loop**
- [ ] Send NPS survey at 30 days and 90 days
- [ ] Follow up personally with detractors (score 0–6) — these are churn signals
- [ ] Ask promoters (score 9–10) for a testimonial or referral

---

## Step 6 — Paid Acquisition (Stage C only)

Do not start paid ads before you have:
- A working activation funnel (users actually convert after signup)
- A clear LTV estimate (you need to know what a customer is worth)
- At least 20 organic customers (proof the product works for strangers)

When ready:

**Google Search Ads**
- Target high-intent keywords: "[problem] software", "best [category] tool", "alternative to [competitor]"
- Send traffic to a specific landing page, not the homepage
- Start with $20/day, measure cost-per-signup and cost-per-conversion

**Reddit Ads**
- Target specific subreddits where the ICP hangs out
- Use authentic-looking creative — Reddit users reject obvious ads
- Start with promoted posts that look like organic posts

**Meta / Instagram**
- Works best for B2C or visual products
- Retargeting (people who visited your site) outperforms cold audiences until scale

---

## Step 7 — Analytics & Iteration

Name the specific metrics to track and the tools to use.

**Core metrics:**
| Metric | What it means | Target |
|--------|--------------|--------|
| Activation rate | % of signups who reach the "aha moment" | > 40% |
| Day-30 retention | % of users still active at 30 days | > 25% |
| MRR growth | Month-over-month revenue growth | > 10% |
| Churn rate | % of paying customers lost per month | < 5% |
| LTV:CAC ratio | Customer lifetime value vs. acquisition cost | > 3:1 |

**Recommended tools by stage:**
- Pre-revenue: PostHog (free tier, self-hostable, excellent product analytics)
- Early revenue: PostHog + Stripe dashboard
- Scaling: PostHog or Mixpanel + Datadog or Grafana for infra metrics

---

## Step 8 — Prioritized Marketing Roadmap

Based on the user's stage and answers, produce a 90-day roadmap:

**Month 1 — Foundation**
- [ ] Set up analytics (PostHog or equivalent)
- [ ] Define and measure the activation event
- [ ] Start one content channel (blog or X) and commit to a cadence

**Month 2 — Distribution**
- [ ] Launch on Product Hunt (if not done)
- [ ] Publish 4 blog posts targeting core SEO keywords
- [ ] Launch referral program or partner integration

**Month 3 — Double down**
- [ ] Identify top-performing channel from months 1–2
- [ ] Allocate 80% of effort to it
- [ ] Start planning paid acquisition if Stage C criteria are met

---

After presenting this plan, ask: "Want me to create tasks in the queue for any of these actions?"
