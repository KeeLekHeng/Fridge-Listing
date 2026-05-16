# Proposal: Launch Fridge Marketplace MVP

## Change ID
launch-fridge-marketplace-mvp

## Status
proposed

## Summary

Build and ship the end-to-end MVP for a school fridge buying/renting marketplace. The product lets students anonymously browse 50L fridges, shortlist options, and send Telegram enquiries to the owner. The admin manages all listings, images, prices, and status through a web dashboard and a Telegram bot.

---

## Why

The business currently has no digital presence. Enquiries happen informally and there is no structured way for students to browse available fridges, understand pricing, or contact the owner. This MVP creates a lightweight but complete sales channel:

- Students can browse on their phones (Safari/Chrome mobile) without creating accounts.
- The owner receives structured Telegram enquiries instead of informal messages.
- The owner can manage stock, prices, and status from both a web dashboard and Telegram.

---

## What Changes

### New: Buyer-Facing Website
A public, anonymous website for students to browse available 50L fridges.

- Listing grid page (`/`) — image-first cards, filter by buy/rent and location, pagination.
- Listing detail page (`/listing/:id`) — images, price options, Telegram enquiry button, shortlist button, similar listings.
- Shortlist page (`/shortlist`) — max 5 listings, remove items, send all selected listings to Telegram.

### New: Admin Dashboard
A protected web dashboard for the business owner.

- Hidden login route (`/manage/login`) — username/password, JWT in HttpOnly Secure SameSite cookie.
- Dashboard table (`/manage`) — all listings including unavailable ones, search, filter, quick actions.
- Create/edit listing form — brand, location, condition, buy/rent prices, deposit, delivery, images.
- Status management — available, reserved, rented, sold, unavailable.
- Action history log — records every status change and price update with who performed it.

### New: Backend API
TypeScript Fastify API serving both buyer and admin frontends.

- Public endpoints: list listings, get listing detail, get recommendations.
- Admin endpoints: login, logout, me, CRUD listings, upload images, update status, view action history.
- Telegram webhook endpoint.

### New: Telegram Admin Bot
Admin-only bot for fast status and price updates from a mobile device.

- Whitelists a single `TELEGRAM_ADMIN_CHAT_ID`.
- Rejects all non-admin requests.
- Commands: `/status`, `/reserve`, `/available`, `/rented`, `/sold`, `/unavailable`, `/price`, `/note`.
- Writes action history for every successful command.

### New: Database Schema
Managed PostgreSQL with Prisma ORM.

- `User` — admin credentials only.
- `Listing` — all listing fields with sensible defaults.
- `ListingImage` — image URLs and storage keys; max 3 per listing.
- `ListingActionHistory` — append-only audit log.

### New: Object Storage Integration
Images stored in S3-compatible object storage. PostgreSQL stores only the URL, storage key, and sort order.

### New: Playwright E2E Tests
Automated tests covering the critical buyer and admin flows.

---

## Scope

### In Scope
- pnpm monorepo: `apps/web`, `apps/api`, `packages/shared`, `prisma/`, `tests/e2e/`
- Buyer browsing, shortlisting, and Telegram enquiry flow
- Admin login, listing management, image upload, status changes, action history
- Telegram admin bot with whitelisted chat ID
- JWT authentication with HttpOnly Secure SameSite cookie
- S3-compatible image upload
- Prisma schema and migrations
- Shared Zod schemas and DTOs in `packages/shared`
- Playwright E2E tests for buyer and admin flows

### Out of Scope (MVP)
- Payment or checkout
- Buyer accounts or login
- Redis or any caching layer
- Email notifications
- Google Sheets integration
- Google Maps or location services
- OpenAI or any AI automation
- Creating listings through Telegram with photos
- Multi-admin role management
- Complex inventory forecasting
- Delivery scheduling system

---

## Listing Status Model

| Status      | Visible to Buyers |
|-------------|------------------|
| available   | Yes              |
| reserved    | No               |
| rented      | No               |
| sold        | No               |
| unavailable | No               |

---

## Data Defaults

| Field              | Default   |
|--------------------|-----------|
| category           | fridge    |
| capacityLitres     | 50        |
| rentPrice          | 70        |
| depositPrice       | 40        |
| deliveryAvailable  | true      |
| deliveryPrice      | 15        |
| status             | available |

---

## Security Considerations

- Admin password hashed at rest (bcrypt).
- JWT expires after 1 day, stored in HttpOnly Secure SameSite=Strict cookie only.
- JWT never stored in localStorage or exposed to JavaScript.
- All admin API routes require valid JWT.
- Public buyer APIs must never expose `adminNote` or internal fields.
- Telegram bot rejects all requests not matching `TELEGRAM_ADMIN_CHAT_ID`.
- Image upload validates MIME type and file size server-side.
- Environment secrets never printed or logged.

---

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Object storage credentials misconfigured | Low | Validate on startup; fail fast |
| Telegram webhook receives forged requests | Medium | Validate `TELEGRAM_WEBHOOK_SECRET` header |
| Admin note leaks to public API | Medium | Strict field allowlist on public listing serializer |
| Image file type bypass | Low | Validate MIME type server-side, not just extension |
| JWT cookie misconfigured (not HttpOnly) | Low | Integration test asserts cookie flags |

---

## Non-Goals

This proposal does not cover:
- Any buyer authentication
- Any payment processing
- Any third-party integrations beyond Telegram and S3-compatible storage
- Any AI or automation features
- Any multi-tenancy or multi-admin features
- Desktop/laptop UI polish — the MVP targets mobile web browsers (Safari/Chrome on phones). A dedicated desktop layout pass is explicitly a post-MVP goal once the mobile web app is validated.
