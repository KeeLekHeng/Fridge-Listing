# Chillix — Fridge Marketplace

Mobile-first web app for buying and renting fridges. Built for NTU campus.

## Features

**Buyer**
- Browse fridges with buy/rent toggle and multi-select location filter
- Shortlist up to 5 fridges (persisted in localStorage)
- Separate Buy / Rent Telegram enquiry buttons with pre-filled message templates
- Image gallery per listing

**Admin** (`/manage`)
- Create, edit, and manage listings with image upload (auto-converted to WebP)
- Status management (Available / Reserved / Rented / Sold / Unavailable)
- Per-listing and global action history timeline
- Telegram bot notifications on status changes

## Stack

| Layer | Tech |
|-------|------|
| API | Fastify, Prisma, TypeScript |
| Web | React 18, Vite, Tailwind CSS |
| Database | PostgreSQL via Supabase |
| Storage | Supabase Storage (images) |
| Bot | Telegram (admin notifications) |

---

## Local Development

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 22+ |
| pnpm | 10+ |

### Setup

```bash
git clone <repo-url>
cd fridge-marketplace
pnpm install

cp .env.example .env
# Fill in all values — see docs/deploy.md for variable reference

pnpm prisma migrate dev
```

### Start dev servers

```bash
# Terminal 1 — API (http://localhost:3001)
pnpm --filter @fridge/api dev

# Terminal 2 — Web (http://localhost:5173)
pnpm --filter @fridge/web dev
```

---

## Useful Commands

```bash
pnpm lint                        # ESLint across all packages
pnpm typecheck                   # TypeScript check across all packages
pnpm build                       # Build API + web for production
pnpm test:e2e                    # Run Playwright E2E tests
pnpm prisma migrate dev          # Create and apply a migration (dev only)
pnpm prisma migrate deploy       # Apply pending migrations (production)
pnpm prisma generate             # Regenerate Prisma client after schema changes
pnpm prisma studio               # Visual database browser
```

---

For production deployment, see [docs/deploy.md](docs/deploy.md).
