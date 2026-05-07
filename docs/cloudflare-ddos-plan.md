# Cloudflare DDoS Plan

## Current Anonymous Access

- `/:hash` is intentionally public.
- The frontend route loads `GET /api/resumes/:hash`.
- The API returns only enabled resumes and does not require authentication for that read path.

## Cloudflare Setup

1. Put the production domain behind Cloudflare DNS proxy mode.
2. Keep Vercel as the origin.
3. Set SSL/TLS mode to `Full (strict)`.
4. Enable HTTP/2, HTTP/3, Brotli, and Cloudflare CDN caching for static assets.

## WAF And Rate-Limit Rules

Create Cloudflare WAF custom rules:

- Challenge suspicious traffic to `/api/*`.
- Block obvious bad bots and known hostile ASNs if they appear in logs.
- Rate limit `POST /api/chat/*` and `POST /api/resumes/*/cover/generate` aggressively because they can trigger AI/provider cost.
- Rate limit mutating resume routes: `POST /api/resumes`, `PUT /api/resumes/*`, `PATCH /api/resumes/*`, and `DELETE /api/resumes/*`.
- Keep `GET /api/resumes/:hash` public, but rate limit high request volume per IP.

Suggested starting limits:

- Public resume reads: `120 requests / minute / IP`.
- AI chat and cover generation: `10 requests / minute / IP`.
- Mutating resume endpoints: `20 requests / minute / IP`.

## Cache Rules

- Cache static assets under `/assets/*` with a long TTL.
- Do not cache `/api/*`.
- Do not cache `/:hash/cover` if it may change frequently.

## Escalation Playbook

1. Turn on Cloudflare Under Attack Mode.
2. Tighten `/api/*` rate limits.
3. Temporarily block expensive AI endpoints if provider cost spikes.
4. Review Cloudflare Security Events for top IPs, ASNs, countries, and user agents.
5. Add temporary WAF blocks or managed challenges for abusive patterns.

## Server-Side Rate Limiting (implemented)

`express-rate-limit` is applied in `server/app.ts` as a defence-in-depth layer independent of Cloudflare:

| Scope | Limit |
|-------|-------|
| All `/api/*` routes | 120 req / min / IP |
| `POST /api/chat/:hash` | 10 req / min / IP |
| `POST /api/resumes/:hash/cover/generate` | 10 req / min / IP |

These match the Cloudflare starting limits so behaviour is consistent in local/dev environments too.

## Follow-Up Hardening

- Restrict mutation endpoints before public production use through the chosen deployment boundary.
- Consider Cloudflare Turnstile for expensive AI generation actions.
- Add authentication/authorisation on mutating endpoints (see `009-debt.md`).
