# Tasks: launch-fridge-marketplace-mvp

All tasks are sequential. No task may begin until its dependency is complete.

## Orchestration loop (applies to every task)

```
1. Implementer executes the assigned task.
2. Validation gates run: pnpm lint && pnpm typecheck (+ test:e2e for TASK-17/18/19).
3. Reviewer agent (agent-orchestration/prompts/reviewer.md) evaluates the diff + gate results.
4. Outcome:
   - approve  → mark task done, proceed to next task
   - reject   → retry with reviewer's concrete findings (max 2 retries)
   - blocked  → escalate to human
5. Task is only marked done when ALL of: acceptance criteria pass, gates pass, reviewer approves.
```

Each task below includes a **Reviewer focus** section listing what the reviewer should pay closest attention to for that specific task.

---

## TASK-01: Monorepo scaffold

**Goal:** Set up the pnpm monorepo with all workspace packages, configs, and tooling. No feature code.

**Depends on:** none

**Spec:** `specs/monorepo/spec.md`

**Acceptance Criteria:**
- [x] `pnpm-workspace.yaml` defines `apps/web`, `apps/api`, `packages/shared`
- [x] Root `package.json` defines scripts: `lint`, `typecheck`, `build`, `test:e2e`
- [x] `apps/web` is scaffolded with Vite + React 18 + TypeScript + Tailwind CSS (blank page, no content)
- [x] `apps/api` is scaffolded with Fastify + TypeScript (health check endpoint `GET /health` returns `{ ok: true }`)
- [x] `packages/shared` is a TypeScript library package (empty, compilable)
- [x] Each package has its own `tsconfig.json` extending a root base config
- [x] ESLint is configured at root with TypeScript rules
- [x] `.env.example` lists all required variable names with placeholder values
- [x] `.gitignore` is correct
- [x] `pnpm install` succeeds from root
- [x] `pnpm lint` exits 0
- [x] `pnpm typecheck` exits 0
- [x] `pnpm build` builds `apps/web` and `apps/api` successfully

**Verification:**
```
pnpm install
pnpm lint
pnpm typecheck
pnpm build
curl http://localhost:3001/health
```

**Out of scope:** Any feature routes, components, or database code.

**Reviewer focus:**
- `tsconfig.json` paths are correct and all packages can import `packages/shared` without relative path hacks.
- `.env.example` contains every variable from requirements section 14 and has no real values.
- ESLint config enforces TypeScript strict rules.
- No secrets are committed.

**Risk:** low
**Parallel-safe:** false

---

## TASK-02: Prisma schema and migration

**Goal:** Define the database schema and run the initial migration.

**Depends on:** TASK-01

**Spec:** `specs/data-model/spec.md`

**Acceptance Criteria:**
- [x] `prisma/schema.prisma` defines `User`, `Listing`, `ListingImage`, `ListingActionHistory` models exactly as specified
- [x] All field types, defaults, relations, and cascade rules match the spec
- [x] Initial migration file is generated in `prisma/migrations/`
- [x] `pnpm prisma migrate dev` succeeds against a local PostgreSQL instance
- [x] `pnpm prisma generate` generates the Prisma client without errors
- [x] Prisma client is instantiated in `apps/api/src/lib/prisma.ts` as a singleton

**Verification:**
```
pnpm prisma migrate dev --name init
pnpm prisma generate
pnpm typecheck
```

**Out of scope:** Seeding data, any API routes.

**Reviewer focus:**
- All field types, defaults, nullable constraints, and cascade rules exactly match `specs/data-model/spec.md`.
- `ListingActionHistory` has no delete cascade that would allow history rows to be purged (only the Listing FK cascade is acceptable for MVP and should be noted as a known trade-off).
- Prisma client singleton is correctly initialized to avoid connection pool exhaustion.
- No raw SQL in application code.

**Risk:** low
**Parallel-safe:** false

---

## TASK-03: Shared package — Zod schemas, DTOs, and enums

**Goal:** Populate `packages/shared` with all Zod schemas, TypeScript types, enums, and serializer functions.

**Depends on:** TASK-02

**Spec:** `specs/listings-api/spec.md`, `specs/data-model/spec.md`

**Acceptance Criteria:**
- [x] `ListingStatus` enum exported: `available`, `reserved`, `rented`, `sold`, `unavailable`
- [x] `ActionType` enum exported: `status_change`, `price_update`, `note_update`, `image_upload`
- [x] `PerformedBy` enum exported: `admin_web`, `telegram_bot`
- [x] `CreateListingSchema` Zod schema exported with all required fields and defaults
- [x] `UpdateListingSchema` Zod schema exported (all fields optional/partial)
- [x] `PublicListingDTO` TypeScript type exported — excludes `adminNote`
- [x] `AdminListingDTO` TypeScript type exported — includes `adminNote`
- [x] `toPublicListing(listing)` serializer function strips `adminNote`
- [x] `toAdminListing(listing)` serializer function includes all fields
- [x] `packages/shared` compiles without errors
- [x] Both `apps/web` and `apps/api` can import from `packages/shared` without errors

**Verification:**
```
pnpm typecheck
pnpm lint
```

**Out of scope:** Any API or UI code.

**Reviewer focus:**
- `toPublicListing` serializer provably omits `adminNote` — check that the type system enforces this, not just a runtime `delete`.
- `PublicListingDTO` type does not include `adminNote` even optionally.
- Zod schemas match the Prisma model fields exactly — no silent mismatches.
- Enums are string unions or const objects, not numeric enums (avoids serialization bugs).

**Risk:** low
**Parallel-safe:** false

---

## TASK-04: API — Admin authentication endpoints

**Goal:** Implement login, logout, and me endpoints with JWT cookie auth.

**Depends on:** TASK-03

**Spec:** `specs/auth/spec.md`

**Acceptance Criteria:**
- [x] `POST /api/admin/login` validates username and bcrypt-hashed password
- [x] On success, sets `auth_token` cookie: HttpOnly, Secure, SameSite=Strict, 1-day expiry
- [x] JWT is not returned in the response body
- [x] On wrong credentials, returns HTTP 401
- [x] `POST /api/admin/logout` clears `auth_token` cookie, returns HTTP 200
- [x] `GET /api/admin/me` returns `{ id, username, role }` — no `passwordHash`
- [x] Fastify `authenticate` preHandler hook validates JWT from cookie
- [x] Hook returns HTTP 401 for missing or expired JWT
- [x] A seed/init script creates the admin user from `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars on first run
- [x] `pnpm lint` and `pnpm typecheck` pass

**Verification:**
```
pnpm lint
pnpm typecheck
# Manual:
curl -X POST http://localhost:3001/api/admin/login -d '{"username":"admin","password":"test"}' -H 'Content-Type: application/json' -v
curl http://localhost:3001/api/admin/me --cookie "auth_token=<token>"
curl -X POST http://localhost:3001/api/admin/logout --cookie "auth_token=<token>"
```

**Out of scope:** Any listing endpoints, Telegram, image upload.

**Reviewer focus:**
- Cookie flags are exactly: HttpOnly, Secure, SameSite=Strict — all three must be present.
- JWT payload contains only `userId` and `role` — no sensitive fields.
- `passwordHash` is never returned in any response including `GET /api/admin/me`.
- JWT is not present in any response body.
- Wrong-password error message is generic — no hint about which field was wrong.
- `authenticate` hook is applied to all `/api/admin/*` routes except `/api/admin/login`.
- bcrypt work factor is at least 10.

**Risk:** medium (security-critical)
**Parallel-safe:** false

---

## TASK-05: API — Public listing endpoints

**Goal:** Implement the public buyer-facing listing endpoints.

**Depends on:** TASK-04

**Spec:** `specs/listings-api/spec.md`

**Acceptance Criteria:**
- [x] `GET /api/listings` returns paginated available listings only (`status = "available"`)
- [x] Supports query params: `buyEnabled`, `rentEnabled`, `location`, `page` (default 1), `limit` (default 6)
- [x] Response includes pagination metadata: `total`, `page`, `limit`, `totalPages`
- [x] Response never includes `adminNote` (uses `toPublicListing` serializer)
- [x] `GET /api/listings/:id` returns single available listing by id; returns 404 if not found or not available
- [x] `GET /api/listings/:id/recommendations` returns up to 4 available listings, sorted same-location-first then price proximity, excluding the current listing
- [x] All responses validated by Zod schemas from `packages/shared`
- [x] `pnpm lint` and `pnpm typecheck` pass

**Verification:**
```
pnpm lint
pnpm typecheck
curl "http://localhost:3001/api/listings?page=1&limit=6"
curl "http://localhost:3001/api/listings/<id>"
curl "http://localhost:3001/api/listings/<id>/recommendations"
```

**Out of scope:** Admin endpoints, authentication.

**Reviewer focus:**
- `adminNote` is absent from every public response — check the serializer is applied, not that the field is merely undefined by coincidence.
- `GET /api/listings/:id` returns 404 for listings that exist but are not `available` (reserved, sold, etc.) — must not 200 or 403.
- Pagination metadata (`total`, `page`, `limit`, `totalPages`) is accurate even at page boundaries.
- Recommendations exclude the current listing and exclude non-available listings.

**Risk:** medium (adminNote must not leak)
**Parallel-safe:** false

---

## TASK-06: API — Admin listing CRUD endpoints

**Goal:** Implement admin-protected listing management endpoints.

**Depends on:** TASK-05

**Spec:** `specs/listings-api/spec.md`

**Acceptance Criteria:**
- [x] `GET /api/admin/listings` returns all listings (any status) with `adminNote`, requires JWT
- [x] Supports query params: `search`, `status`, `location`, `page`, `limit`
- [x] `POST /api/admin/listings` creates listing, auto-generates `listingCode`, returns created listing
- [x] `PATCH /api/admin/listings/:id` updates allowed fields, returns updated listing
- [x] All endpoints require valid JWT; return 401 without it
- [x] Request bodies validated by Zod schemas; invalid requests return 400
- [x] `pnpm lint` and `pnpm typecheck` pass

**Verification:**
```
pnpm lint
pnpm typecheck
# Manual with valid cookie
curl -X POST http://localhost:3001/api/admin/listings ...
curl http://localhost:3001/api/admin/listings
```

**Out of scope:** Image upload, status endpoint, action history endpoint.

**Reviewer focus:**
- All admin endpoints return 401 (not 403 or 404) for unauthenticated requests.
- `listingCode` auto-generation is deterministic and collision-safe under concurrent creates.
- `PATCH` endpoint does not allow overwriting `listingCode`, `id`, `createdAt`.
- Zod validation errors return structured 400 responses — no unhandled exceptions leaking stack traces.

**Risk:** low
**Parallel-safe:** false

---

## TASK-07: API — Image upload endpoint

**Goal:** Implement image upload and delete endpoints with S3-compatible storage.

**Depends on:** TASK-06

**Spec:** `specs/image-upload/spec.md`

**Acceptance Criteria:**
- [x] `POST /api/admin/listings/:id/images` accepts multipart form with up to 3 files
- [x] Validates MIME type: only `image/jpeg`, `image/png`, `image/webp` accepted; others return 400
- [x] Validates file size: max 2 MB per file; oversized files return 400
- [x] Rejects upload if listing already has 3 images; returns 400
- [x] Uploads accepted files to S3-compatible storage with key `listings/<listingId>/<uuid>.webp`
- [x] Writes `ListingImage` rows with `imageUrl`, `storageKey`, `sortOrder`
- [x] `DELETE /api/admin/listings/:id/images/:imageId` attempts storage deletion, logs failure, always deletes DB row; returns 204
- [x] Endpoint requires valid JWT; returns 401 without it
- [x] `pnpm lint` and `pnpm typecheck` pass

**Verification:**
```
pnpm lint
pnpm typecheck
# Manual upload test with valid cookie
```

**Out of scope:** Object storage file deletion on image row delete.

**Reviewer focus:**
- MIME type is validated from the file's actual content (magic bytes or parsed MIME), not just the file extension or the `Content-Type` header sent by the client.
- Raw file size check (2 MB limit) happens before `sharp` processing — not after.
- The 3-image limit check happens before any processing or upload — no partial uploads on rejection.
- `sharp` resize + WebP conversion runs on every accepted file — there is no code path that uploads the original file unprocessed.
- Storage key always ends in `.webp` regardless of input format.
- `imageUrl` is always built from `STORAGE_PUBLIC_BASE_URL` — no pre-signed URLs or internal endpoints exposed.
- DELETE endpoint attempts Supabase Storage deletion before DB row deletion; failure is logged but does not block the 204 response.
- No binary image data is written to PostgreSQL.

**Risk:** medium (file type validation must not be bypassable)
**Parallel-safe:** false

---

## TASK-08: API — Status update and action history endpoints

**Goal:** Implement listing status update endpoint and action history read endpoint.

**Depends on:** TASK-07

**Spec:** `specs/listings-api/spec.md`

**Acceptance Criteria:**
- [x] `PATCH /api/admin/listings/:id/status` updates listing status and writes `ListingActionHistory` record
- [x] History record includes `actionType = "status_change"`, `oldValue`, `newValue`, `performedBy = "admin_web"`
- [x] `GET /api/admin/action-history` returns paginated history records, optionally filtered by `listingId`
- [x] Both endpoints require valid JWT; return 401 without it
- [x] Status value is validated against `ListingStatus` enum; invalid values return 400
- [x] `pnpm lint` and `pnpm typecheck` pass

**Verification:**
```
pnpm lint
pnpm typecheck
# Manual: change status, then verify history record exists
```

**Out of scope:** Telegram bot, any frontend changes.

**Reviewer focus:**
- `ListingActionHistory` record is written atomically with the status update — if the DB write fails, no partial history is created.
- `oldValue` is captured from the pre-update state, not derived post-update.
- Invalid status values (not in `ListingStatus` enum) return 400, not a silent DB error.
- `performedBy` is hardcoded to `"admin_web"` for this endpoint — not taken from user input.

**Risk:** low
**Parallel-safe:** false

---

## TASK-09: API — Telegram webhook handler

**Goal:** Implement the Telegram bot webhook with all MVP commands.

**Depends on:** TASK-08

**Spec:** `specs/telegram-bot/spec.md`

**Acceptance Criteria:**
- [x] `POST /api/telegram/webhook` validates `X-Telegram-Bot-Api-Secret-Token` header; returns 403 if invalid
- [x] Always returns HTTP 200 to Telegram regardless of processing outcome
- [x] Checks `message.chat.id` against `TELEGRAM_ADMIN_CHAT_ID`; silently ignores non-admin messages
- [x] Implements all 8 commands: `/status`, `/reserve`, `/available`, `/rented`, `/sold`, `/unavailable`, `/price`, `/note`
- [x] Listing code matching is case-insensitive
- [x] Status-changing commands write `ListingActionHistory` with `performedBy = "telegram_bot"`
- [x] `/price` updates only provided price fields; omitted fields are unchanged
- [x] Bot replies with confirmation or error messages as specified
- [x] Uses shared listing service logic (no duplicated DB queries inline)
- [x] `pnpm lint` and `pnpm typecheck` pass

**Verification:**
```
pnpm lint
pnpm typecheck
# Manual: register webhook, send test commands from admin Telegram account
```

**Out of scope:** Listing creation via Telegram, photo uploads.

**Reviewer focus:**
- `chat.id` check uses integer comparison — not string comparison (Telegram sends it as a number).
- Non-admin messages produce no reply and no error log that could reveal the bot exists.
- `X-Telegram-Bot-Api-Secret-Token` validation runs before any message parsing — not after.
- Webhook always returns HTTP 200 to Telegram even when processing fails or the message is ignored.
- `/price` command only updates the fields explicitly provided; omitted fields are not zeroed out.
- All command handlers call the shared listing service — no duplicated Prisma queries inline.
- `performedBy` is hardcoded to `"telegram_bot"` — not taken from any Telegram message field.

**Risk:** medium (security — must reject non-admin chat IDs)
**Parallel-safe:** false

---

## TASK-10: Frontend — Buyer listing grid page

**Goal:** Build the public listing grid page (`/`).

**Depends on:** TASK-09

**Spec:** `specs/buyer-ui/spec.md`

**Acceptance Criteria:**
- [x] Route `/` renders a grid of available listing cards
- [x] Each card shows: main image, brand, 50L badge, buy price (if buyEnabled), rent + deposit (if rentEnabled), location, delivery badge
- [x] 6 listings per page with pagination controls
- [x] Filter bar with buy/rent toggle and location dropdown
- [x] Filters update URL query string
- [x] Only `status = "available"` listings are shown (enforced by API, verified in UI)
- [x] Layout is fully usable at 375px viewport width (mobile web browser — Safari/Chrome)
- [x] `pnpm lint` and `pnpm typecheck` pass
- [x] `pnpm build` succeeds

**Verification:**
```
pnpm lint
pnpm typecheck
pnpm build
# Manual: open in browser with DevTools set to 375px (iPhone SE) — this is the MVP target viewport
```

**Out of scope:** Detail page, shortlist, admin pages.

**Reviewer focus:**
- Grid only ever shows `status = "available"` listings — the filter is applied at the API level, not just the UI.
- Filter state is reflected in URL query string so the page is bookmarkable and shareable.
- Pagination is correct at boundaries (first page, last page, single page).
- Layout is fully usable at 375px width — this is a mobile web app (Safari/Chrome on phones), not a native app. Desktop layout is post-MVP.
- No `adminNote` or other admin-only fields present in the rendered HTML or JS bundle.

**Risk:** low
**Parallel-safe:** false

---

## TASK-11: Frontend — Buyer listing detail page

**Goal:** Build the listing detail page (`/listing/:id`).

**Depends on:** TASK-10

**Spec:** `specs/buyer-ui/spec.md`

**Acceptance Criteria:**
- [x] Route `/listing/:id` renders listing detail
- [x] Shows image gallery (up to 3), brand, location, condition, 50L label, buy/rent prices, deposit, delivery note
- [x] "Add to shortlist" button adds to localStorage; disabled if already in shortlist or shortlist is full (5)
- [x] Telegram enquiry button generates correct `t.me/Lucas_Keee` deep link with prefilled message
- [x] Similar listings section shows up to 4 listings (same location first, then price proximity)
- [x] Displays not-found message if listing does not exist or is not available
- [x] Fully usable at 375px viewport width (mobile web browser)
- [x] `pnpm lint` and `pnpm typecheck` pass
- [x] `pnpm build` succeeds

**Verification:**
```
pnpm lint
pnpm typecheck
pnpm build
# Manual: open detail page, verify Telegram link, add to shortlist
```

**Out of scope:** Shortlist page UI, admin pages.

**Reviewer focus:**
- Telegram deep link is correctly encoded — special characters in listing details (e.g. `&`, `=`, `#`) do not break the URL.
- Deep link target is `t.me/Lucas_Keee` — not a configurable value that could be changed by a buyer.
- Detail page shows 404/not-found for unavailable listings — it does not leak that the listing exists.
- "Add to shortlist" is disabled when the shortlist is already at 5 — not just hidden.

**Risk:** low
**Parallel-safe:** false

---

## TASK-12: Frontend — Buyer shortlist page

**Goal:** Build the shortlist page (`/shortlist`).

**Depends on:** TASK-11

**Spec:** `specs/buyer-ui/spec.md`

**Acceptance Criteria:**
- [x] Route `/shortlist` renders shortlisted listings from localStorage
- [x] Each item shows main image, listing code, brand, buy/rent price, and a remove button
- [x] Remove button removes the item from localStorage and updates the list
- [x] "Send all to Telegram" generates a single Telegram deep link with all shortlisted listings' details
- [x] Shortlist count visible in site navigation on all pages
- [x] "Add to shortlist" on detail page shows "Already in shortlist" if item is present
- [x] Maximum 5 items enforced; error shown on attempt to add 6th
- [x] Word "shortlist" used throughout; "cart" does not appear
- [x] Fully usable at 375px viewport width (mobile web browser)
- [x] `pnpm lint` and `pnpm typecheck` pass
- [x] `pnpm build` succeeds

**Verification:**
```
pnpm lint
pnpm typecheck
pnpm build
# Manual: add items, remove items, verify max 5, check Telegram link
```

**Reviewer focus:**
- localStorage key is consistent across all components that read/write the shortlist.
- Maximum of 5 is enforced in the write path, not just shown in the UI after the fact.
- "Send all to Telegram" deep link correctly encodes all listings' details without truncation.
- Word "cart" does not appear anywhere in source code, rendered HTML, or aria labels.
- Removing an item updates `localStorage` and re-renders without a page reload.

**Risk:** low
**Parallel-safe:** false

---

## TASK-13: Frontend — Admin login page

**Goal:** Build the admin login page (`/manage/login`) with JWT session handling.

**Depends on:** TASK-12

**Spec:** `specs/auth/spec.md`, `specs/admin-ui/spec.md`

**Acceptance Criteria:**
- [x] Route `/manage/login` renders username/password form
- [x] Form submits to `POST /api/admin/login`
- [x] On success, redirects to `/manage`
- [x] On failure, shows generic error ("Invalid credentials") — no username/password hint
- [x] All routes under `/manage/*` (except `/manage/login`) redirect unauthenticated users to `/manage/login`
- [x] Login page is not linked from any public buyer page
- [x] `pnpm lint` and `pnpm typecheck` pass
- [x] `pnpm build` succeeds

**Verification:**
```
pnpm lint
pnpm typecheck
pnpm build
# Manual: navigate to /manage without login, verify redirect; login with wrong creds; login with correct creds
```

**Reviewer focus:**
- Login error message is generic — confirms neither username nor password is wrong individually.
- All `/manage/*` routes (except `/manage/login`) redirect to `/manage/login` when no valid session cookie exists — not just `/manage`.
- No link to `/manage/login` appears on any buyer-facing page in the rendered HTML.
- Auth check happens before rendering any protected component — no flash of admin content.

**Risk:** medium (security UX)
**Parallel-safe:** false

---

## TASK-14: Frontend — Admin dashboard table

**Goal:** Build the admin dashboard listing table (`/manage`).

**Depends on:** TASK-13

**Spec:** `specs/admin-ui/spec.md`

**Acceptance Criteria:**
- [x] Route `/manage` renders a table of all listings (any status)
- [x] Columns: image thumbnail, listing code, brand, location, buy price, rent price, deposit, status badge, updated date, actions
- [x] Search input filters by listing code or brand
- [x] Filter controls for status and location
- [x] "Create listing" button navigates to `/manage/listings/new`
- [x] Actions column: Edit link, Change Status button, View History button
- [x] Logout button calls `POST /api/admin/logout` and redirects to `/manage/login`
- [x] Status change quick-action updates badge in table without full page reload
- [x] `pnpm lint` and `pnpm typecheck` pass
- [x] `pnpm build` succeeds

**Verification:**
```
pnpm lint
pnpm typecheck
pnpm build
# Manual: view table, search, filter, change status, logout
```

**Reviewer focus:**
- Table shows all listings regardless of status — not filtered like the buyer grid.
- Status badges visually distinguish all 5 statuses (`available`, `reserved`, `rented`, `sold`, `unavailable`).
- Logout calls `POST /api/admin/logout` before redirecting — does not just clear local state.
- Quick-action status change writes a `ListingActionHistory` record, confirmed via the history endpoint.

**Risk:** low
**Parallel-safe:** false

---

## TASK-15: Frontend — Admin create/edit listing form

**Goal:** Build the create and edit listing forms with image upload.

**Depends on:** TASK-14

**Spec:** `specs/admin-ui/spec.md`

**Acceptance Criteria:**
- [x] Routes `/manage/listings/new` and `/manage/listings/:id/edit` render the listing form
- [x] All required fields present with correct defaults
- [x] Inline validation errors per field using Zod schema
- [x] Image upload section shows existing images with delete buttons and allows uploading up to 3
- [x] On successful save, redirects to `/manage`
- [x] Edit form pre-fills with existing listing values
- [x] `pnpm lint` and `pnpm typecheck` pass
- [x] `pnpm build` succeeds

**Verification:**
```
pnpm lint
pnpm typecheck
pnpm build
# Manual: create listing, edit listing, upload image, verify redirect
```

**Reviewer focus:**
- Defaults are set by the form initializer — user sees correct values before first save.
- Zod validation errors appear inline per field, not as a single generic message.
- Image upload disables when at 3 images client-side; server enforces the limit independently.
- `listingCode` and `id` are read-only or absent from the form — cannot be overwritten via edit.
- Price fields are submitted as numbers — no silent NaN or string-coercion bugs.

**Risk:** low
**Parallel-safe:** false

---

## TASK-16: Frontend — Admin action history view

**Goal:** Add an action history view accessible from the dashboard and the edit page.

**Depends on:** TASK-15

**Spec:** `specs/admin-ui/spec.md`

**Acceptance Criteria:**
- [x] Action history is accessible from the dashboard and from the listing edit page
- [x] Displays paginated records with: listing code, action type (readable label), old value, new value, performed by, date/time
- [x] Works for actions performed by both admin web and Telegram bot
- [x] `pnpm lint` and `pnpm typecheck` pass
- [x] `pnpm build` succeeds

**Verification:**
```
pnpm lint
pnpm typecheck
pnpm build
# Manual: perform a status change, verify history record appears
```

**Reviewer focus:**
- `actionType` values are displayed as readable labels (e.g. "Status changed", "Price updated") — not raw enum strings.
- `performedBy` correctly distinguishes `admin_web` vs `telegram_bot` in the UI.
- Pagination works correctly — history records are not all loaded at once.
- Records are shown in reverse-chronological order (newest first).

**Risk:** low
**Parallel-safe:** false

---

## TASK-17: Playwright — Buyer E2E tests

**Goal:** Write and pass all required Playwright buyer flow tests.

**Depends on:** TASK-16

**Spec:** `specs/e2e-tests/spec.md`

**Acceptance Criteria:**
- [ ] Test seed creates: 2 available listings, 1 reserved listing, 1 unavailable listing
- [ ] REQ-E2E-005: Buyer views listing grid — passes
- [ ] REQ-E2E-006: Buyer filters by rent — passes
- [ ] REQ-E2E-007: Buyer opens listing detail — passes
- [ ] REQ-E2E-008: Buyer adds to shortlist — passes
- [ ] REQ-E2E-009: Buyer cannot add more than 5 — passes
- [ ] REQ-E2E-010: Buyer removes from shortlist — passes
- [ ] REQ-E2E-011: Telegram enquiry button href contains `t.me/Lucas_Keee` — passes
- [ ] REQ-E2E-012: Unavailable/reserved listings hidden from buyer grid — passes
- [ ] `pnpm test:e2e` exits 0

**Verification:**
```
pnpm test:e2e --project=buyer
```

**Reviewer focus:**
- Each test is independent — no test relies on state left by another (use `beforeEach` teardown or isolated seed).
- REQ-E2E-012 explicitly asserts that reserved and unavailable listing codes are absent from the DOM, not just that fewer cards appear.
- REQ-E2E-009 asserts the error message text — not just that the count stays at 5.
- Tests do not hardcode listing IDs or codes — they use seeded data references.

**Risk:** low
**Parallel-safe:** false

---

## TASK-18: Playwright — Admin E2E tests

**Goal:** Write and pass all required Playwright admin flow tests.

**Depends on:** TASK-17

**Spec:** `specs/e2e-tests/spec.md`

**Acceptance Criteria:**
- [ ] REQ-E2E-013: Admin login — passes
- [ ] REQ-E2E-014: Unauthenticated user redirected from `/manage` — passes
- [ ] REQ-E2E-015: Admin creates listing — passes
- [ ] REQ-E2E-016: Admin edits listing price — passes
- [ ] REQ-E2E-017: Admin uploads image — passes
- [ ] REQ-E2E-018: Admin changes status — passes
- [ ] REQ-E2E-019: Admin views action history — passes
- [ ] REQ-E2E-020: Admin logout — passes
- [ ] `pnpm test:e2e` exits 0

**Verification:**
```
pnpm test:e2e --project=admin
```

**Reviewer focus:**
- REQ-E2E-014 navigates directly to `/manage` without any prior login step — not just checking a logged-out state in the same session.
- REQ-E2E-020 asserts that `/manage` is no longer accessible after logout, not just that the redirect happened.
- Admin test session is isolated from buyer test session — no shared cookie state between projects.
- Image upload test uses a real file, not a mocked upload.

**Risk:** low
**Parallel-safe:** false

---

## TASK-19: Final verification — lint, typecheck, build, all tests

**Goal:** Run the complete quality gate across the entire monorepo to confirm the MVP is done.

**Depends on:** TASK-18

**Acceptance Criteria:**
- [ ] `pnpm lint` exits 0 across all packages
- [ ] `pnpm typecheck` exits 0 across all packages
- [ ] `pnpm build` succeeds for `apps/web` and `apps/api`
- [ ] `pnpm test:e2e` exits 0 — all buyer and admin Playwright tests pass
- [ ] No `adminNote` field appears in any public API response (manual spot check)
- [ ] JWT cookie has HttpOnly, Secure, SameSite=Strict flags (manual spot check with browser devtools)
- [ ] Telegram bot rejects a non-admin chat ID (manual test)
- [ ] All Definition of Done items from `requirements.md` section 17 are satisfied

**Verification:**
```
pnpm lint
pnpm typecheck
pnpm build
pnpm test:e2e
```

**Reviewer focus:**
- All 19 previous tasks have been marked `[x]` in this file.
- No `adminNote` is present in any `GET /api/listings` or `GET /api/listings/:id` response (verify with curl).
- JWT cookie has HttpOnly, Secure, SameSite=Strict flags confirmed in browser DevTools → Application → Cookies.
- Telegram bot does not reply to a test message sent from a non-admin chat ID.
- All Playwright tests pass in a clean environment (not just cached from a prior run).
- `pnpm build` output contains no TypeScript errors or warnings.

**Risk:** low
**Parallel-safe:** false
