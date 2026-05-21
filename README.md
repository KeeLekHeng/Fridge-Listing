# Fridge Marketplace

A mobile-first web app for buying and renting fridges. Built with Fastify, React, Prisma, and Supabase.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 22+ |
| pnpm | 10+ |
| PostgreSQL | via Supabase (managed) |

---

## Local Development Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd fridge-marketplace
pnpm install
# pnpm install automatically runs `prisma generate` via postinstall
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in all values (see [Environment Variables](#environment-variables) below).

### 3. Run database migrations

```bash
pnpm prisma migrate dev
```

### 4. Start the development servers

In two separate terminals:

```bash
# Terminal 1 — API (http://localhost:3001)
pnpm --filter @fridge/api dev

# Terminal 2 — Web (http://localhost:5173)
pnpm --filter @fridge/web dev
```

### 5. Verify

```bash
curl http://localhost:3001/health
# → {"ok":true}
```

---

## VPS / Production Setup

### 1. Install Node.js and pnpm

```bash
# Install Node.js 22 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# Install pnpm
npm install -g pnpm
```

### 2. Clone the repo

```bash
git clone <repo-url>
cd fridge-marketplace
```

### 3. Set up environment variables

```bash
cp .env.example .env
nano .env   # fill in all production values
```

### 4. Install dependencies and generate client

```bash
pnpm install --frozen-lockfile
# postinstall runs prisma generate automatically
```

### 5. Run database migrations

```bash
pnpm prisma migrate deploy
```

> Use `migrate deploy` (not `migrate dev`) in production — it applies pending migrations without interactive prompts.

### 6. Build

```bash
pnpm build
```

### 7. Start the API

```bash
pnpm --filter @fridge/api start
```

For a process manager (recommended):

```bash
npm install -g pm2
pm2 start apps/api/dist/index.js --name fridge-api
pm2 save
pm2 startup   # follow the printed command to auto-start on reboot
```

### 8. Serve the web frontend

The web build outputs to `apps/web/dist/`. Serve it with nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/fridge-marketplace/apps/web/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
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

Copy `.env.example` to `.env` and fill in every value.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooler URL (port 6543, `?pgbouncer=true`) — used by the app at runtime |
| `DIRECT_URL` | Supabase direct URL (port 5432) — used by Prisma migrations only |
| `JWT_SECRET` | Long random string (min 32 chars). Generate: `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `1d`, `7d`) |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password (stored as bcrypt hash after seed) |
| `FRONTEND_URL` | Public URL of the web app (e.g. `https://yourdomain.com`) |
| `BACKEND_URL` | Public URL of the API (e.g. `https://yourdomain.com`) |
| `COOKIE_DOMAIN` | Cookie domain (e.g. `yourdomain.com`) |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | Your Telegram user ID (get from @userinfobot) |
| `TELEGRAM_WEBHOOK_SECRET` | Random string to verify webhook requests |
| `STORAGE_ENDPOINT` | Supabase Storage S3 endpoint |
| `STORAGE_REGION` | e.g. `ap-northeast-2` |
| `STORAGE_BUCKET` | Supabase Storage bucket name |
| `STORAGE_ACCESS_KEY_ID` | Supabase Storage access key |
| `STORAGE_SECRET_ACCESS_KEY` | Supabase Storage secret key |
| `STORAGE_PUBLIC_BASE_URL` | Public base URL for uploaded images |
| `DEFAULT_CAPACITY_LITRES` | Default fridge capacity shown in listings |
| `DEFAULT_RENT_PRICE` | Default rent price ($) |
| `DEFAULT_DEPOSIT_PRICE` | Default deposit price ($) |
| `DEFAULT_DELIVERY_PRICE` | Default delivery price ($) |

### Getting Supabase connection strings

1. Go to your Supabase project → **Settings → Database**
2. Under **Connection string**, copy:
   - **Session pooler** (port 5432) → `DIRECT_URL`
   - **Transaction pooler** (port 6543) → `DATABASE_URL` (add `?pgbouncer=true`)

---

## Useful Commands

```bash
pnpm lint                        # ESLint across all packages
pnpm typecheck                   # TypeScript check across all packages
pnpm build                       # Build API + web for production
pnpm prisma migrate dev          # Create and apply a new migration (dev only)
pnpm prisma migrate deploy       # Apply pending migrations (production)
pnpm prisma generate             # Regenerate Prisma client after schema changes
pnpm prisma studio               # Open Prisma Studio (visual DB browser)
```
