# Production Deployment Guide

## Architecture

```
https://chillix.yourdomain.com
        │
        ▼
   Caddy (VPS — Singapore)
   ├── Static files  →  apps/web/dist/
   └── /api/*        →  Fastify on 127.0.0.1:3001 (systemd)
        │                              │
        ▼                              ▼
  Supabase PostgreSQL          Supabase Storage
  (Singapore region)           (fridge images)
```

## Recommended providers

| Service | Pick | Cost |
|---------|------|------|
| VPS | DigitalOcean or Vultr — Singapore region | ~$6/mo |
| Database | Supabase — Southeast Asia (Singapore) region | Free tier |
| Storage | Supabase Storage (same project) | Free tier |
| Domain | Namecheap / Cloudflare Registrar | ~$12/yr |
| DNS | Cloudflare (free) | $0 |

**Total: ~$7–8/mo**

---

## Phase 0 — Before touching the server

1. Create a **Supabase project** — select region **Southeast Asia (Singapore)**
2. From Supabase → Settings → Database → Connection string, copy:
   - Session pooler (port 5432) → `DIRECT_URL`
   - Transaction pooler (port 6543) → `DATABASE_URL` (append `?pgbouncer=true`)
3. From Supabase → Storage, create a bucket and copy the storage keys
4. Register a domain and point an **A record** at your VPS IP (do this early — DNS propagation takes a few minutes)

---

## Phase 1 — Server setup

Create an **Ubuntu 24.04** VPS (minimum 1 GB RAM; 2 GB recommended for builds).

SSH in as root, then:

```bash
# Create a non-root user
adduser deploy
usermod -aG sudo deploy

# Firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable

# Switch to deploy user for the rest
su - deploy
```

### Install Node.js 22

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22 && nvm use 22 && nvm alias default 22
```

### Install pnpm

```bash
npm install -g pnpm
```

### Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

---

## Phase 2 — Deploy the app

```bash
# Clone the repo
git clone <repo-url> /opt/chillix
cd /opt/chillix

# Install dependencies (generates Prisma client via postinstall)
pnpm install --frozen-lockfile

# Set up environment
cp .env.example .env
nano .env   # fill in all production values — see Environment Variables below

# Run migrations and build
pnpm prisma migrate deploy
pnpm build

# Copy frontend build to web root
sudo mkdir -p /var/www/chillix
sudo rsync -a apps/web/dist/ /var/www/chillix/dist/
sudo chown -R deploy:deploy /var/www/chillix
```

---

## Phase 3 — Run the API with systemd

Create `/etc/systemd/system/chillix-api.service`:

```ini
[Unit]
Description=Chillix API
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/chillix
EnvironmentFile=/opt/chillix/.env
ExecStart=/home/deploy/.nvm/versions/node/v22.0.0/bin/node apps/api/dist/index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

> Adjust the `ExecStart` path to match your node version: `node --version` to confirm, then `which node` to get the path.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now chillix-api

# Verify
curl http://127.0.0.1:3001/health
# → {"ok":true}
```

---

## Phase 4 — Caddy (HTTPS + reverse proxy)

Edit `/etc/caddy/Caddyfile`:

```
chillix.yourdomain.com {
    encode gzip

    handle /api/* {
        reverse_proxy 127.0.0.1:3001
    }

    handle {
        root * /var/www/chillix/dist
        file_server
        try_files {path} /index.html
    }
}
```

```bash
sudo systemctl reload caddy
```

Caddy automatically obtains and renews a Let's Encrypt TLS certificate. No certbot needed.

---

## Phase 5 — Telegram webhook

Once the domain is live and HTTPS is working:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://chillix.yourdomain.com/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

---

## Phase 6 — Redeploy script

Save as `/opt/chillix/deploy.sh`:

```bash
#!/bin/bash
set -e
cd /opt/chillix

git pull
pnpm install --frozen-lockfile
pnpm prisma migrate deploy
pnpm build
rsync -a apps/web/dist/ /var/www/chillix/dist/
sudo systemctl restart chillix-api

echo "Deployed $(git rev-parse --short HEAD)"
```

```bash
chmod +x deploy.sh
```

For every future release: `./deploy.sh`

---

## Environment Variables

Fill these into `/opt/chillix/.env` on the server. Never commit this file.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase transaction pooler (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase direct connection (port 5432) — migrations only |
| `JWT_SECRET` | Random string ≥32 chars: `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Token lifetime e.g. `7d` |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `FRONTEND_URL` | `https://chillix.yourdomain.com` |
| `BACKEND_URL` | `https://chillix.yourdomain.com` |
| `COOKIE_DOMAIN` | `chillix.yourdomain.com` |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | Your Telegram user ID (get from @userinfobot) |
| `TELEGRAM_WEBHOOK_SECRET` | Random string to verify webhook requests |
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
