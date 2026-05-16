## ADDED Requirements

### Requirement: Public listing grid returns only available listings
`GET /api/listings` SHALL return a paginated list of listings where `status = "available"` only. Listings with any other status SHALL be excluded.

#### Scenario: Non-available listings are excluded from public grid
- **WHEN** listings exist with statuses `available`, `reserved`, `rented`, `sold`, and `unavailable`, and `GET /api/listings` is called
- **THEN** only the `available` listing is returned

### Requirement: Public listing grid supports filters and pagination
`GET /api/listings` SHALL support query parameters: `buyEnabled` (boolean), `rentEnabled` (boolean), `location` (string exact match), `page` (integer, default 1), `limit` (integer, default 6, max 50).

#### Scenario: Rent filter returns only rent-enabled listings
- **WHEN** `GET /api/listings?rentEnabled=true` is called
- **THEN** only listings with `rentEnabled = true` are returned

#### Scenario: Pagination returns correct page
- **WHEN** 10 available listings exist and `GET /api/listings?page=2&limit=6` is called
- **THEN** the response contains 4 listings and pagination metadata shows `page = 2`, `totalPages = 2`

### Requirement: Public listing grid response includes required fields and pagination metadata
`GET /api/listings` response SHALL include for each listing: `id`, `listingCode`, `category`, `brand`, `condition`, `location`, `capacityLitres`, `buyEnabled`, `buyPrice`, `rentEnabled`, `rentPrice`, `depositPrice`, `deliveryAvailable`, `deliveryPrice`, `status`, `createdAt`, `updatedAt`, `images`. The response SHALL include pagination metadata: `total`, `page`, `limit`, `totalPages`.

#### Scenario: Response includes images and pagination metadata
- **WHEN** `GET /api/listings` is called with available listings that have images
- **THEN** each listing item contains an `images` array and the response root contains `total`, `page`, `limit`, `totalPages`

### Requirement: adminNote is never exposed in public endpoints
`GET /api/listings` and `GET /api/listings/:id` responses SHALL NOT include `adminNote` under any circumstances. This is enforced by the `toPublicListing` serializer from `packages/shared`.

#### Scenario: adminNote is absent from public listing grid response
- **WHEN** a listing has `adminNote = "buyer offered discount"` and `GET /api/listings` is called
- **THEN** the response JSON does not contain any field named `adminNote`

#### Scenario: adminNote is absent from public listing detail response
- **WHEN** a listing has `adminNote` set and `GET /api/listings/:id` is called
- **THEN** the response JSON does not contain `adminNote`

### Requirement: Public listing detail returns 404 for non-available listings
`GET /api/listings/:id` SHALL return HTTP 404 if the listing does not exist or its status is not `"available"`. It SHALL NOT return 200 or reveal that the listing exists.

#### Scenario: Reserved listing returns 404 on public detail
- **WHEN** a listing with `status = "reserved"` exists and `GET /api/listings/:id` is called with its id
- **THEN** HTTP 404 is returned

### Requirement: Recommendations exclude the current listing and non-available listings
`GET /api/listings/:id/recommendations` SHALL return up to 4 available listings that are not the requested listing itself, sorted by same location first then price proximity.

#### Scenario: Current listing is excluded from recommendations
- **WHEN** `GET /api/listings/F-0001/recommendations` is called
- **THEN** F-0001 is not present in the response

#### Scenario: Recommendations prioritise same location
- **WHEN** available listings exist in location A (2 listings) and location B (3 listings), and the requested listing is in location A
- **THEN** the location A listings appear first in the recommendations response

### Requirement: Admin listing grid returns all listings including non-available
`GET /api/admin/listings` SHALL return all listings regardless of status and SHALL include `adminNote`. It requires a valid JWT cookie.

#### Scenario: Admin sees all statuses
- **WHEN** listings with all 5 statuses exist and `GET /api/admin/listings` is called with a valid JWT cookie
- **THEN** all 5 listings are returned including reserved, sold, and unavailable

### Requirement: Admin listing grid supports search and filters
`GET /api/admin/listings` SHALL support query parameters: `search` (matches `listingCode` or `brand`), `status`, `location`, `page`, `limit`.

#### Scenario: Search filters by listing code
- **WHEN** `GET /api/admin/listings?search=F-0005` is called
- **THEN** only the listing with code F-0005 is returned

### Requirement: Create listing auto-generates listing code
`POST /api/admin/listings` SHALL create a new listing and auto-generate its `listingCode` server-side. The request body SHALL be validated against `CreateListingSchema`.

#### Scenario: New listing receives auto-generated code
- **WHEN** `POST /api/admin/listings` is called with valid body and no `listingCode` field
- **THEN** the created listing has a `listingCode` matching the format `F-XXXX`

### Requirement: Update listing validates request body
`PATCH /api/admin/listings/:id` SHALL update allowed listing fields. The request body SHALL be validated against `UpdateListingSchema`. Invalid requests SHALL return HTTP 400.

#### Scenario: Invalid field type returns 400
- **WHEN** `PATCH /api/admin/listings/:id` is called with `rentPrice: "not-a-number"`
- **THEN** HTTP 400 is returned with a structured Zod validation error

### Requirement: Status update writes action history
`PATCH /api/admin/listings/:id/status` SHALL update the listing status and write a `ListingActionHistory` record with `actionType = "status_change"`, `oldValue`, `newValue`, and `performedBy = "admin_web"`.

#### Scenario: Status change produces a history record
- **WHEN** `PATCH /api/admin/listings/F-0005/status` is called with `{ status: "reserved" }` and the listing was previously `available`
- **THEN** the listing status is updated and a history record exists with `oldValue = "available"`, `newValue = "reserved"`, `performedBy = "admin_web"`

### Requirement: Invalid status value is rejected
`PATCH /api/admin/listings/:id/status` SHALL reject status values not in the `ListingStatus` enum. Invalid values SHALL return HTTP 400.

#### Scenario: Unknown status value returns 400
- **WHEN** `PATCH /api/admin/listings/:id/status` is called with `{ status: "deleted" }`
- **THEN** HTTP 400 is returned

### Requirement: Action history endpoint returns paginated records
`GET /api/admin/action-history` SHALL return paginated `ListingActionHistory` records, optionally filtered by `listingId`.

#### Scenario: Action history filtered by listing
- **WHEN** `GET /api/admin/action-history?listingId=<id>` is called
- **THEN** only history records for that listing are returned

### Requirement: All admin endpoints require authentication
All admin listing endpoints SHALL require a valid JWT cookie. Requests without a valid cookie SHALL return HTTP 401.

#### Scenario: Unauthenticated request to admin endpoint returns 401
- **WHEN** `POST /api/admin/listings` is called without an `auth_token` cookie
- **THEN** HTTP 401 is returned

### Requirement: Request bodies are validated with Zod schemas from packages/shared
All request bodies for listing endpoints SHALL be validated using Zod schemas exported from `packages/shared`. Invalid requests SHALL return HTTP 400 with a structured error — not an unhandled exception.

#### Scenario: Missing required field returns structured 400
- **WHEN** `POST /api/admin/listings` is called with `brand` missing from the body
- **THEN** HTTP 400 is returned with a JSON error body identifying the missing field

### Requirement: Public and admin serializers enforce field separation
`packages/shared` SHALL export `toPublicListing` and `toAdminListing` serializer functions. `toPublicListing` SHALL produce a type that does not include `adminNote`, enforced at the TypeScript level not just at runtime.

#### Scenario: TypeScript rejects accessing adminNote on a public listing type
- **WHEN** code attempts to access `.adminNote` on a value typed as `PublicListingDTO`
- **THEN** the TypeScript compiler reports a type error
