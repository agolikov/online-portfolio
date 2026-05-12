# Stack

## Architecture Style

<!-- Choose one and delete the other -->

**Unified (full-stack)** — frontend and backend live in one codebase and are deployed together.
> e.g. Next.js with API routes, Nuxt, SvelteKit, Rails, Laravel

**Separated** — frontend and backend are independent codebases/deployments communicating over an API.
> e.g. React (Vercel) + FastAPI (Railway), Vue + Django REST, React Native + Express

---

<!-- If Unified, fill in the single section below.
     If Separated, fill in Frontend and Backend sections separately. -->

## Unified Stack

### Language
- <!-- e.g. TypeScript -->

### Framework & Runtime
- <!-- e.g. Next.js 14, Node 20 -->

### Rendering Strategy
- <!-- e.g. App Router with RSC, SSR, static generation, hybrid -->

### Database & ORM
- <!-- e.g. Postgres (Neon), Prisma -->

### Infrastructure & Hosting
- <!-- e.g. Vercel (app + edge functions), S3 (assets) -->

### Key Services / Integrations
- <!-- e.g. Stripe, Clerk, Resend -->

---

## Separated Stack

### Frontend

| Property | Value |
|----------|-------|
| Language | <!-- e.g. TypeScript --> |
| Framework | <!-- e.g. React 18, Vite --> |
| Styling | <!-- e.g. Tailwind CSS --> |
| State management | <!-- e.g. Zustand, React Query --> |
| Hosting | <!-- e.g. Vercel, Netlify, S3 + CloudFront --> |
| Communicates with backend via | <!-- e.g. REST, GraphQL, tRPC --> |

### Backend

| Property | Value |
|----------|-------|
| Language | <!-- e.g. Python, Go, Node --> |
| Framework | <!-- e.g. FastAPI, Express, Echo --> |
| Runtime / version | <!-- e.g. Python 3.12, Node 20 --> |
| Database | <!-- e.g. Postgres on RDS --> |
| ORM / query layer | <!-- e.g. SQLAlchemy, Prisma, raw SQL --> |
| Hosting | <!-- e.g. Railway, Fly.io, AWS Lambda --> |
| Auth | <!-- e.g. JWT issued by backend, Clerk, Auth0 --> |

### Shared

- **API contract:** <!-- e.g. OpenAPI spec at /docs, tRPC router, GraphQL schema -->
- **Environment separation:** <!-- e.g. frontend env var `NEXT_PUBLIC_API_URL` points to backend -->

---

## Infrastructure

- <!-- e.g. CI/CD: GitHub Actions → Vercel preview deploys -->
- <!-- e.g. Secrets: Doppler / .env.local -->
- <!-- e.g. Monitoring: Sentry, Datadog -->

## Key Services / Integrations

- <!-- e.g. Stripe, Resend, S3, OpenAI -->
