## ADDED Requirements

### Requirement: Database is managed PostgreSQL via Prisma
The system SHALL use a managed PostgreSQL 15+ database accessed exclusively through the Prisma ORM client. Raw SQL queries SHALL NOT be used in application code.

#### Scenario: Prisma client connects to the database
- **WHEN** `apps/api` starts with a valid `DATABASE_URL`
- **THEN** the Prisma client connects successfully and the API serves requests without database errors

### Requirement: User model for admin credentials
The database SHALL contain a `User` model with fields: `id` (CUID PK), `username` (unique string), `passwordHash` (string), `role` (string, default `"admin"`), `createdAt`, `updatedAt`.

#### Scenario: Admin user can be seeded
- **WHEN** the admin seed script runs with `ADMIN_USERNAME` and `ADMIN_PASSWORD` env vars set
- **THEN** a `User` row exists in the database with the correct username and a bcrypt-hashed password

### Requirement: Listing model with all required fields and defaults
The database SHALL contain a `Listing` model with fields: `id`, `listingCode` (unique), `category` (default `"fridge"`), `brand`, `condition`, `location`, `capacityLitres` (default `50`), `buyEnabled` (default `false`), `buyPrice` (nullable Decimal), `rentEnabled` (default `true`), `rentPrice` (default `70`), `depositPrice` (default `40`), `deliveryAvailable` (default `true`), `deliveryPrice` (default `15`), `status` (default `"available"`), `adminNote` (nullable), `createdAt`, `updatedAt`.

#### Scenario: Listing created with only required fields applies defaults
- **WHEN** a listing is created with only `brand`, `location`, and `condition` provided
- **THEN** the saved record has `category = "fridge"`, `capacityLitres = 50`, `rentPrice = 70`, `depositPrice = 40`, `deliveryAvailable = true`, `deliveryPrice = 15`, `status = "available"`

### Requirement: ListingImage model stores URL and storage key only
The database SHALL contain a `ListingImage` model with fields: `id`, `listingId` (FK to Listing, cascade delete), `imageUrl` (string), `storageKey` (string), `sortOrder` (int, default `0`), `createdAt`. PostgreSQL SHALL NOT store image binary data.

#### Scenario: Image row contains URL and storage key not binary data
- **WHEN** an image is uploaded and the `ListingImage` row is inspected
- **THEN** the row contains `imageUrl` and `storageKey` fields and no binary image data column exists in the schema

### Requirement: ListingActionHistory is an append-only audit log
The database SHALL contain a `ListingActionHistory` model with fields: `id`, `listingId` (FK to Listing, cascade delete), `actionType` (string), `oldValue` (nullable), `newValue` (nullable), `note` (nullable), `performedBy` (string), `createdAt`. History rows SHALL never be updated or deleted by application code.

#### Scenario: Multiple status changes each produce a separate history record
- **WHEN** a listing status is changed from `available` to `reserved`, then to `sold`
- **THEN** two `ListingActionHistory` rows exist for that listing and neither is modified or deleted

### Requirement: Listing code is auto-generated in F-XXXX format
Listing codes SHALL be generated server-side using the format `F-` + zero-padded 4-digit sequential number (e.g. `F-0001`). They SHALL be unique across all listings.

#### Scenario: Listing codes increment sequentially
- **WHEN** 10 listings already exist and a new listing is created
- **THEN** the new listing receives the code `F-0011`

### Requirement: Prisma schema is at repository root
The `prisma/` directory and `schema.prisma` SHALL be located at the repository root and shared by `apps/api`.

#### Scenario: Prisma generate succeeds from root
- **WHEN** `pnpm prisma generate` is run at the repository root
- **THEN** the Prisma client is generated without errors

### Requirement: Initial migration is generated and applies cleanly
An initial migration file SHALL be created in `prisma/migrations/` and SHALL apply to a fresh PostgreSQL database without errors.

#### Scenario: Migration applies to a fresh database
- **WHEN** `pnpm prisma migrate deploy` is run against a new empty PostgreSQL database
- **THEN** all tables are created and the command exits with code 0

### Requirement: Prisma client is a singleton in apps/api
The Prisma client SHALL be instantiated once as a singleton in `apps/api/src/lib/prisma.ts` and reused across all route handlers to avoid connection pool exhaustion.

#### Scenario: API handles concurrent requests without connection errors
- **WHEN** multiple concurrent requests are made to the API
- **THEN** no "too many connections" or Prisma client instantiation errors occur
