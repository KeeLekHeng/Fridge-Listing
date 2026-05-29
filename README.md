# Fridge Marketplace

Mobile-first web app for buying and renting fridges. Fastify API + React frontend + Prisma + Supabase (PostgreSQL + Storage).

---

## Stack

| Layer | Tech |
|-------|------|
| API | Fastify, Prisma, TypeScript |
| Web | React 18, Vite, Tailwind CSS |
| Database | PostgreSQL via Supabase |
| Storage | Supabase Storage (S3-compatible) |
| Bot | Telegram bot for admin status notifications |
| Tests | Playwright E2E (`tests/e2e/`) |

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 22+ |
| pnpm | 10+ |

---

## Local Development

### 1. Clone and install

```bash
git clone <repo-url>
cd fridge-marketplace
pnpm install
# postinstall runs prisma generate automatically
```

### 2. Environment variables

```bash
cp .env.example .env
# fill in all values — see Environment Variables below
```

### 3. Run migrations

```bash
pnpm prisma migrate dev
```

### 4. Start dev servers

```bash
# Terminal 1 — API (http://localhost:3001)
pnpm --filter @fridge/api dev

# Terminal 2 — Web (http://localhost:5173)
pnpm --filter @fridge/web dev
```

---

## Production Setup

### 1. Install Node.js and pnpm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22 && nvm use 22
npm install -g pnpm
```

### 2. Clone, configure, install

```bash
git clone <repo-url> && cd fridge-marketplace
cp .env.example .env && nano .env
pnpm install --frozen-lockfile
```

### 3. Migrate, build, start

```bash
pnpm prisma migrate deploy   # apply pending migrations (no interactive prompts)
pnpm build
pnpm --filter @fridge/api start
```

**Process manager (recommended):**

```bash
npm install -g pm2
pm2 start apps/api/dist/index.js --name fridge-api
pm2 save && pm2 startup
```

### 4. Nginx — serve frontend + proxy API

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/fridge-marketplace/apps/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase transaction pooler URL (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase direct URL (port 5432) — used by migrations only |
| `JWT_SECRET` | Random string ≥32 chars. Generate: `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Token lifetime e.g. `1d`, `7d` |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `FRONTEND_URL` | Public web URL e.g. `https://yourdomain.com` |
| `BACKEND_URL` | Public API URL e.g. `https://yourdomain.com` |
| `COOKIE_DOMAIN` | Cookie domain e.g. `yourdomain.com` |
| `TELEGRAM_BOT_TOKEN` | From @BotFather — bot sends status-change alerts to admin chat |
| `TELEGRAM_ADMIN_CHAT_ID` | Your Telegram user ID (get from @userinfobot) |
| `TELEGRAM_WEBHOOK_SECRET` | Random string to verify incoming webhook requests |
| `STORAGE_ENDPOINT` | Supabase Storage S3 endpoint |
| `STORAGE_REGION` | e.g. `ap-southeast-1` |
| `STORAGE_BUCKET` | Supabase Storage bucket name |
| `STORAGE_ACCESS_KEY_ID` | Supabase Storage access key |
| `STORAGE_SECRET_ACCESS_KEY` | Supabase Storage secret key |
| `STORAGE_PUBLIC_BASE_URL` | Public base URL for uploaded images |
| `DEFAULT_CAPACITY_LITRES` | Default fridge capacity |
| `DEFAULT_RENT_PRICE` | Default rent price ($) |
| `DEFAULT_DEPOSIT_PRICE` | Default deposit price ($) |
| `DEFAULT_DELIVERY_PRICE` | Default delivery price ($) |

**Getting Supabase connection strings:** Project → Settings → Database → Connection string
- Session pooler (port 5432) → `DIRECT_URL`
- Transaction pooler (port 6543) → `DATABASE_URL` (append `?pgbouncer=true`)

---

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

---

## Useful Commands

```bash
pnpm lint                        # ESLint across all packages
pnpm typecheck                   # TypeScript check across all packages
pnpm build                       # Build API + web for production
pnpm test:e2e                    # Run Playwright E2E tests (buyer + admin)
pnpm prisma migrate dev          # Create and apply a migration (dev only)
pnpm prisma migrate deploy       # Apply pending migrations (production)
pnpm prisma generate             # Regenerate Prisma client after schema changes
pnpm prisma studio               # Visual database browser
```
