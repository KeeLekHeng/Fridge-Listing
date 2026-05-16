# Design: Launch Fridge Marketplace MVP

## Change ID
launch-fridge-marketplace-mvp

---

## 1. Repository Structure

```
fridge-marketplace/
├── apps/
│   ├── web/                  # React + Vite + TypeScript + Tailwind (buyer + admin UI)
│   └── api/                  # Fastify + TypeScript (REST API + Telegram webhook)
├── packages/
│   └── shared/               # Zod schemas, DTOs, enums (shared by web and api)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   └── e2e/                  # Playwright tests
├── .env.example
├── pnpm-workspace.yaml
└── package.json              # Root workspace config
```

---

## 2. Tech Stack

| Layer           | Technology                              |
|-----------------|-----------------------------------------|
| Frontend        | React 18, Vite, TypeScript, Tailwind CSS |
| Backend         | Fastify, TypeScript                     |
| ORM             | Prisma                                  |
| Validation      | Zod                                     |
| Database        | Managed PostgreSQL 15+                  |
| Image storage   | S3-compatible object storage            |
| Auth            | JWT, HttpOnly Secure SameSite cookie    |
| Telegram        | Telegram Bot API webhook                |
| Testing         | Playwright E2E                          |
| Package manager | pnpm monorepo                           |

---

## 3. Data Model

### 3.1 User
Stores admin credentials only. No buyer accounts.

```
User {
  id            String   @id @default(cuid())
  username      String   @unique
  passwordHash  String
  role          String   @default("admin")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 3.2 Listing
Abstract listing model. Currently only category=fridge but not tightly coupled to fridge concepts.

```
Listing {
  id                 String   @id @default(cuid())
  listingCode        String   @unique          // e.g. F-0012
  category           String   @default("fridge")
  brand              String
  condition          String
  location           String
  capacityLitres     Int      @default(50)
  buyEnabled         Boolean  @default(false)
  buyPrice           Decimal?
  rentEnabled        Boolean  @default(true)
  rentPrice          Decimal  @default(70)
  depositPrice       Decimal  @default(40)
  deliveryAvailable  Boolean  @default(true)
  deliveryPrice      Decimal  @default(15)
  status             String   @default("available")
  adminNote          String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  images             ListingImage[]
  actionHistory      ListingActionHistory[]
}
```

### 3.3 ListingImage
Max 3 images per listing. PostgreSQL stores URL and storage key only.

```
ListingImage {
  id          String   @id @default(cuid())
  listingId   String
  imageUrl    String
  storageKey  String
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())

  listing     Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
}
```

### 3.4 ListingActionHistory
Append-only audit log. Never deleted.

```
ListingActionHistory {
  id          String   @id @default(cuid())
  listingId   String
  actionType  String   // status_change, price_update, note_update, image_upload
  oldValue    String?
  newValue    String?
  note        String?
  performedBy String   // "admin_web" | "telegram_bot"
  createdAt   DateTime @default(now())

  listing     Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
}
```

### 3.5 Listing Code Generation
Auto-generated on creation: `F-` prefix + zero-padded 4-digit sequential number (e.g. `F-0001`). Generated server-side, not by Prisma.

---

## 4. API Design

### 4.1 Public Buyer Endpoints

```
GET  /api/listings
     Query: status, buyEnabled, rentEnabled, location, page, limit
     Response: paginated listing cards (no adminNote)

GET  /api/listings/:id
     Response: full listing detail (no adminNote)

GET  /api/listings/:id/recommendations
     Response: up to 4 similar listings by location then price (no adminNote)
```

### 4.2 Admin Endpoints (JWT required)

```
POST /api/admin/login
     Body: { username, password }
     Response: sets HttpOnly JWT cookie

POST /api/admin/logout
     Response: clears JWT cookie

GET  /api/admin/me
     Response: { id, username, role }

GET  /api/admin/listings
     Query: search, status, location, page, limit
     Response: all listings including unavailable (with adminNote)

POST /api/admin/listings
     Body: CreateListingDTO
     Response: created listing

PATCH /api/admin/listings/:id
     Body: UpdateListingDTO (partial)
     Response: updated listing

POST /api/admin/listings/:id/images
     Body: multipart/form-data (up to 3 files)
     Response: updated image list

DELETE /api/admin/listings/:id/images/:imageId
     Response: 204

PATCH /api/admin/listings/:id/status
     Body: { status }
     Response: updated listing

GET  /api/admin/action-history
     Query: listingId?, page, limit
     Response: paginated action history
```

### 4.3 Telegram Webhook

```
POST /api/telegram/webhook
     Header: X-Telegram-Bot-Api-Secret-Token: <TELEGRAM_WEBHOOK_SECRET>
     Body: Telegram Update object
     Response: 200 OK (always, to avoid Telegram retries)
```

### 4.4 Field Serialization Rule
Public endpoints MUST omit `adminNote` from all responses. Admin endpoints include all fields. This is enforced via separate public vs admin DTO serializers in `packages/shared`.

---

## 5. Authentication Design

- Admin logs in via `POST /api/admin/login` with username + password.
- Server verifies password against bcrypt hash.
- On success, server signs a JWT (1-day expiry) and sets it as an HttpOnly, Secure, SameSite=Strict cookie.
- All admin routes use a Fastify preHandler hook to verify the JWT from the cookie.
- On logout, the cookie is cleared.
- JWT is never exposed to JavaScript (no localStorage, no response body).
- The login route (`/manage/login`) is not linked from the public site — it must be typed directly.

---

## 6. Image Upload Design

### 6.1 Upload flow
- Admin uploads up to 3 images per listing via multipart form.
- Backend validates: MIME type (`image/jpeg`, `image/png`, `image/webp` only), raw file size (max 2 MB per file). Both checks happen before any processing.
- Backend processes each accepted file using the `sharp` library:
  - Resize to max 1200px on the longest dimension (aspect ratio preserved).
  - Convert to WebP format at quality 80.
- Processed WebP buffer is uploaded to Supabase Storage using `@aws-sdk/client-s3`.
- Storage key format: `listings/<listingId>/<uuid>.webp` (always `.webp`).
- After upload, backend writes a `ListingImage` row with `imageUrl`, `storageKey`, `sortOrder`.
- `imageUrl` is the public CDN URL from `STORAGE_PUBLIC_BASE_URL/<storageKey>`.
- PostgreSQL never stores raw image binary data.

### 6.2 Storage budget (Supabase free tier: 1 GB)
Processing input images to WebP before upload is mandatory — not optional — because Supabase Storage space is limited.

| Item | Value |
|---|---|
| Input size limit | 2 MB per file |
| Processing | Resize ≤ 1200px + WebP quality 80 |
| Target stored size | ~100–300 KB per image |
| Max per listing | ~900 KB (3 images) |
| Budget at 200 listings | ~180 MB |
| Supabase free tier | 1 GB |

### 6.3 Image deletion
When an admin deletes an image, the backend SHALL:
1. Look up the `ListingImage` row to get the `storageKey`.
2. Delete the object from Supabase Storage.
3. Delete the `ListingImage` row from PostgreSQL.

If the storage deletion fails, log the error and continue with the DB row deletion — orphaned objects should be caught and cleaned up manually but must not block the admin workflow.

### 6.4 PostgreSQL storage
PostgreSQL stores only URLs and metadata. Even at 1000 listings with full history, the database footprint will remain well under Supabase's 500 MB free database limit.

---

## 7. Telegram Bot Design

### 7.1 Security
- Webhook receives requests from Telegram servers only.
- `X-Telegram-Bot-Api-Secret-Token` header is validated against `TELEGRAM_WEBHOOK_SECRET`.
- Every command handler checks `message.chat.id === TELEGRAM_ADMIN_CHAT_ID` before processing.
- Non-admin messages receive a silent rejection (no response, to avoid enumeration).

### 7.2 Command Parsing
Commands are parsed from `message.text`. Format: `/command LISTING_CODE [args]`.

| Command      | Action                              | Action History |
|--------------|-------------------------------------|----------------|
| `/status`    | Returns listing info as text        | No             |
| `/reserve`   | Sets status = reserved              | Yes            |
| `/available` | Sets status = available             | Yes            |
| `/rented`    | Sets status = rented                | Yes            |
| `/sold`      | Sets status = sold                  | Yes            |
| `/unavailable` | Sets status = unavailable         | Yes            |
| `/price`     | Updates buy/rent/deposit prices     | Yes            |
| `/note`      | Updates adminNote                   | Yes            |

### 7.3 Response Format
Bot replies with a short confirmation message or error. Example:
- Success: `F-0012 marked as reserved.`
- Not found: `Listing F-0012 not found.`
- Invalid: `Usage: /price F-0012 buy=100 rent=70 deposit=40`

### 7.4 Listing Code Matching
Commands accept the listing code case-insensitively (e.g. `f-0012` matches `F-0012`).

---

## 8. Frontend Architecture

### 8.1 Buyer UI (`apps/web`)
- Built with React 18, Vite, TypeScript, Tailwind CSS.
- Routes managed by React Router v6.
- No global state library — shortlist stored in `localStorage` via a custom hook.
- All data fetched from the public API with `fetch` + React query patterns.
- **Platform target:** Mobile web browser (Safari on iOS, Chrome on Android). This is a web app, not a native app. The MVP primary viewport is 375px (iPhone SE baseline). Desktop/laptop layout optimisation is a post-MVP goal — the MVP must work on desktop but is not required to be pixel-perfect at large widths.

| Route           | Page                   |
|-----------------|------------------------|
| `/`             | Listing grid           |
| `/listing/:id`  | Listing detail         |
| `/shortlist`    | Shortlist              |
| `/manage/login` | Admin login            |
| `/manage`       | Admin dashboard        |
| `/manage/listings/new`    | Create listing |
| `/manage/listings/:id/edit` | Edit listing |

### 8.2 Listing Grid
- Shows only `status=available` listings.
- Cards display: main image, brand, 50L badge, buy price (if buyEnabled), rent price + deposit (if rentEnabled), location, delivery badge.
- Filter bar: buy/rent toggle, location dropdown.
- Pagination: 6 listings per page.

### 8.3 Listing Detail
- Image gallery (up to 3).
- Full price breakdown.
- "Add to shortlist" button (disabled at 5 items).
- Telegram enquiry button — generates `t.me/Lucas_Keee` deep link with prefilled message including listing code, brand, prices, and image URLs.
- Similar listings section (up to 4, same location first then price proximity).

### 8.4 Shortlist
- Max 5 listings stored in localStorage.
- Remove individual listings.
- "Send all to Telegram" — generates a single Telegram deep link with all shortlisted listings.

### 8.5 Admin UI
- Same `apps/web` app, protected routes under `/manage/*`.
- Table view of all listings with search, filter, pagination.
- Create/edit form with all listing fields and image upload.
- Status change via dropdown or quick-action button.
- Action history log table.

---

## 9. Shared Package (`packages/shared`)

Contains:
- Zod schemas for all DTOs (CreateListingSchema, UpdateListingSchema, etc.)
- TypeScript types inferred from Zod schemas
- Enums: `ListingStatus`, `ActionType`, `PerformedBy`, `Category`
- Public vs admin serializer functions (strips `adminNote` from public responses)

Used by both `apps/api` (validation) and `apps/web` (type safety).

---

## 10. Environment Variables

```
DATABASE_URL=

JWT_SECRET=
JWT_EXPIRES_IN=1d

ADMIN_USERNAME=
ADMIN_PASSWORD=

FRONTEND_URL=
BACKEND_URL=
COOKIE_DOMAIN=

TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
TELEGRAM_WEBHOOK_SECRET=

STORAGE_ENDPOINT=
STORAGE_REGION=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
STORAGE_PUBLIC_BASE_URL=

DEFAULT_CAPACITY_LITRES=50
DEFAULT_RENT_PRICE=70
DEFAULT_DEPOSIT_PRICE=40
DEFAULT_DELIVERY_PRICE=15
```

---

## 11. Test Strategy

### 11.1 Playwright E2E (required for Definition of Done)

**Buyer flows:**
- Buyer can view listing grid
- Buyer can filter by rent
- Buyer can open listing detail
- Buyer can add to shortlist
- Buyer cannot add more than 5
- Buyer can remove from shortlist
- Buyer can generate Telegram enquiry
- Unavailable listings are hidden from buyer

**Admin flows:**
- Admin can login
- Admin can create a listing
- Admin can edit listing price
- Admin can upload images
- Admin can change status
- Admin can view action history
- Admin can logout
- Unauthenticated user cannot access admin dashboard

### 11.2 Lint and Type Check
- `pnpm lint` passes across all packages
- `pnpm typecheck` passes across all packages
- `pnpm build` succeeds for both `apps/web` and `apps/api`

---

## 12. Delivery Order

Tasks are broken into sequential slices, each independently verifiable:

1. Monorepo scaffold (workspace, tsconfigs, lint, env example)
2. Prisma schema and migration
3. Shared package (Zod schemas, DTOs, enums)
4. API: auth endpoints (login, logout, me)
5. API: public listing endpoints
6. API: admin listing CRUD endpoints
7. API: image upload endpoint
8. API: status update endpoint
9. API: action history endpoint
10. API: Telegram webhook handler
11. Frontend: buyer listing grid page
12. Frontend: buyer listing detail page
13. Frontend: buyer shortlist page
14. Frontend: admin login page
15. Frontend: admin dashboard table
16. Frontend: admin create/edit listing form
17. Frontend: admin action history view
18. Playwright: buyer E2E tests
19. Playwright: admin E2E tests
20. Final lint, typecheck, build verification
