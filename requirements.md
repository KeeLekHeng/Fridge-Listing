# Fridge Marketplace MVP Requirements

## 1. Product Overview

This project is a small school fridge buying/renting marketplace.

The website allows students to browse available 50L fridges, view listing details, shortlist options, and send enquiries through Telegram. The admin can manage listings, prices, images, and availability through a web dashboard and a Telegram bot.

The MVP should stay simple and practical. It is not a full ecommerce checkout platform.

---

## 2. Product Direction

### Buyer Side

The buyer-facing website should follow an Airbnb-style browsing experience:

- Image-first listing cards
- Clean filters
- Simple listing detail page
- Mobile-first responsive design
- Clear price and availability information
- Telegram enquiry flow instead of checkout

### Admin Side

The admin-facing dashboard should follow a simplified Shopify inventory style:

- Table-based listing management
- Status badges
- Quick actions
- Create/edit listing forms
- Action history

---

## 3. MVP Goals

The MVP should allow:

1. Buyers to browse available 50L fridge listings.
2. Buyers to filter listings by buy/rent and location.
3. Buyers to shortlist up to 5 fridges.
4. Buyers to send selected fridge details through Telegram.
5. Admin to create, edit, and manage listings.
6. Admin to upload up to 3 images per listing.
7. Admin to update listing status and prices.
8. Admin to update listing status and prices from Telegram.
9. Admin to view action history.
10. Core buyer and admin flows to be tested using Playwright.

---

## 4. Out of Scope for MVP

Do not implement these in MVP:

- Payment or checkout
- Buyer accounts
- Redis caching
- Google Maps
- Google Sheets integration
- Email notifications
- OpenAI/OpenClaw automation
- Full listing creation through Telegram with photos
- Complex inventory forecasting
- Multi-admin role management
- Delivery scheduling system

---

## 5. User Roles

## Buyer

Buyers are anonymous users.

Buyers can:

- Browse available listings
- Filter listings
- View listing details
- Add listings to shortlist
- Send Telegram enquiry

Buyers do not need login.

## Admin

Admin is the business owner.

Admin can:

- Login through hidden admin route
- Manage listings
- Upload images
- Update prices
- Change listing status
- View action history
- Use Telegram bot commands to update listing status and price

---

## 6. Buyer Requirements

## Listing Grid Page

Route:

```txt
/

The listing page must show available fridge listings.

Each listing card should display:

Main image
Brand
50L badge
Buy price, if buy is enabled
Rent price, if rent is enabled
Deposit price
Location
Delivery +$15 badge, if delivery is available
Availability status

Buyer can filter by:

Buy
Rent
Location

Only listings with status = available should be shown to buyers.

Listing Detail Page

Route:

/listing/:id

The detail page should show:

Up to 3 images
Brand
Location
Condition
50L capacity
Buy price
Rent price
Deposit price
Delivery price
Add to shortlist button
Telegram enquiry button
Similar listings section

Similar listings should prioritize:

Same location
Similar price
Shortlist Page

Route:

/shortlist

Shortlist behavior:

Stored locally in browser
Maximum 5 listings
Buyer can remove listings
Buyer can send all shortlisted listings to Telegram
Use the word shortlist, not cart
Telegram Buyer Enquiry

The buyer enquiry flow should generate a Telegram message containing:

Listing code
Brand
Buy/rent option
Price
Deposit
Location
Delivery price
Listing URL
Image URLs, if possible

The website should redirect the buyer to Telegram with a prefilled message.

7. Admin Requirements
Admin Login

Route:

/manage/login

Requirements:

Username/password login
No public signup
JWT authentication
JWT expires in 1 day
JWT stored in HttpOnly Secure SameSite cookie
Do not store JWT in localStorage
Admin Dashboard

Route:

/manage

The dashboard should show a table of all listings, including unavailable listings.

Columns:

Image thumbnail
Listing code
Brand
Location
Buy price
Rent price
Deposit
Status
Updated date
Actions

Admin should be able to:

Search by listing code or brand
Filter by status
Filter by location
Create listing
Edit listing
Change status
View action history
Logout
Create/Edit Listing

Fields:

Brand
Location
Condition
Buy enabled
Buy price
Rent enabled
Rent price
Deposit price
Delivery available
Delivery price
Status
Admin note
Up to 3 images

Defaults:

category = fridge
capacityLitres = 50
rentPrice = 70
depositPrice = 40
deliveryAvailable = true
deliveryPrice = 15
status = available
8. Listing Status

Supported statuses:

available
reserved
rented
sold
unavailable

Buyer visibility:

Status	Visible to Buyer
available	Yes
reserved	No
rented	No
sold	No
unavailable	No

Admin can see all statuses.

9. Telegram Admin Bot Requirements

The Telegram bot is included in MVP, but only for admin updates.

The bot must:

Whitelist admin Telegram chat ID
Reject non-admin users
Use backend listing service logic
Write action history for successful updates

Supported commands:

/status FRG-0012
/reserve FRG-0012
/available FRG-0012
/rented FRG-0012
/sold FRG-0012
/unavailable FRG-0012
/price FRG-0012 buy=100 rent=70 deposit=40
/note FRG-0012 buyer=@example interested in renting

Do not implement full listing creation from Telegram in MVP.

10. Technical Stack
Frontend
React
Vite
TypeScript
Tailwind CSS
Backend
TypeScript
Fastify
Prisma
Zod
Database
Managed PostgreSQL 15+
Images

Images must be stored in object storage.

PostgreSQL should store only:

Image URL
Storage key
Sort order
Metadata
Testing
Playwright
Package Structure

Use pnpm monorepo:

apps/
  web/
  api/

packages/
  shared/

prisma/

tests/
  e2e/
11. Data Model Summary
User

Used for admin login.

Fields:

id
username
passwordHash
role
createdAt
updatedAt
Listing

Fields:

id
listingCode
category
brand
condition
location
capacityLitres
buyEnabled
buyPrice
rentEnabled
rentPrice
depositPrice
deliveryAvailable
deliveryPrice
status
adminNote
createdAt
updatedAt
ListingImage

Fields:

id
listingId
imageUrl
storageKey
sortOrder
createdAt
ListingActionHistory

Fields:

id
listingId
actionType
oldValue
newValue
note
performedBy
createdAt
12. API Summary
Public APIs
GET /api/listings
GET /api/listings/:id
GET /api/listings/:id/recommendations
Admin APIs
POST /api/admin/login
POST /api/admin/logout
GET /api/admin/me
GET /api/admin/listings
POST /api/admin/listings
PATCH /api/admin/listings/:id
POST /api/admin/listings/:id/images
PATCH /api/admin/listings/:id/status
GET /api/admin/action-history
Telegram API
POST /api/telegram/webhook
13. Security Requirements
Admin password must be hashed.
JWT must expire after 1 day.
JWT must be stored in HttpOnly Secure SameSite cookie.
Do not store JWT in localStorage.
Admin APIs must require authentication.
Buyer APIs must not expose admin notes.
Telegram bot must verify admin chat ID.
Image upload must validate file type and size.
Do not print or expose environment secrets.
.env.example should contain variable names only.
14. Environment Variables

Required:

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
15. OpenSpec Workflow

OpenSpec is the source of truth.

The implementation flow should be:

1. Propose OpenSpec change
2. Validate proposal
3. Human review
4. Apply one task
5. Run lint/typecheck/build/tests
6. Reviewer approves or rejects
7. Fix if needed
8. Mark task done
9. Repeat
10. Run Playwright tests
11. Final senior review
12. Archive OpenSpec change

Do not implement features before they are defined in OpenSpec.

16. Playwright Acceptance Tests
Buyer Tests

Required E2E flows:

Buyer can view listing grid
Buyer can filter by rent
Buyer can open listing detail page
Buyer can add listing to shortlist
Buyer cannot add more than 5 listings
Buyer can remove listing from shortlist
Buyer can generate Telegram enquiry
Unavailable listings are hidden from buyer
Admin Tests

Required E2E flows:

Admin can login
Admin can create listing
Admin can edit listing price
Admin can upload images
Admin can change status
Admin can view action history
Admin can logout
Unauthenticated user cannot access admin dashboard
17. Definition of Done

The MVP is done when:

Buyer website works on mobile and desktop
Admin dashboard works
JWT login works
Listings can be created and edited
Images can be uploaded
Status changes work
Telegram enquiry links work
Telegram admin bot works
Action history is recorded
Public buyer pages hide unavailable listings
No admin notes leak to public APIs
Playwright tests pass
Lint, typecheck, and build pass
OpenSpec change is validated and archived