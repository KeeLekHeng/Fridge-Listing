## ADDED Requirements

### Requirement: E2E tests use Playwright from the tests/e2e directory
All E2E tests SHALL be written using Playwright and located in `tests/e2e/`. The `pnpm test:e2e` command SHALL run all tests and exit with code 0 on success.

#### Scenario: All tests pass in a clean run
- **WHEN** `pnpm test:e2e` is run against a seeded local environment
- **THEN** the command exits with code 0 and all test cases report passed

### Requirement: Tests run against a seeded local environment
Tests SHALL run against locally running instances of `apps/api` and `apps/web`. The seed SHALL create at minimum: 2 available listings (one buy+rent, one rent only), 1 reserved listing, and 1 unavailable listing.

#### Scenario: Seeded data is present at test start
- **WHEN** the test suite starts and queries the API for listings
- **THEN** at least 2 available listings, 1 reserved listing, and 1 unavailable listing exist

### Requirement: Each test is independent with no shared state
Tests SHALL be independent. No test SHALL rely on state created by another test. Each test SHALL set up its own preconditions or use the shared seed.

#### Scenario: Tests pass in any order
- **WHEN** the test suite is run with randomised order
- **THEN** all tests still pass

### Requirement: Buyer can view the listing grid
The E2E suite SHALL verify that the listing grid page loads and displays at least one listing card.

#### Scenario: Listing grid shows available listing cards
- **WHEN** the buyer navigates to `/`
- **THEN** at least one listing card is visible on the page

### Requirement: Buyer can filter by rent
The E2E suite SHALL verify that applying the Rent filter removes buy-only listings from the grid.

#### Scenario: Rent filter hides buy-only listings
- **WHEN** the buyer applies the Rent filter
- **THEN** listings with `rentEnabled = false` are no longer visible in the grid

### Requirement: Buyer can open a listing detail page
The E2E suite SHALL verify that clicking a listing card navigates to the detail page and shows listing code, brand, and price.

#### Scenario: Clicking a card opens the detail page
- **WHEN** the buyer clicks a listing card on the grid
- **THEN** the browser navigates to `/listing/:id` and the listing code and brand are visible

### Requirement: Buyer can add a listing to the shortlist
The E2E suite SHALL verify that clicking Add to shortlist adds the listing and increments the navigation count.

#### Scenario: Shortlist count increments after adding
- **WHEN** the buyer clicks Add to shortlist on a listing detail page
- **THEN** the shortlist count in the navigation increments by 1

### Requirement: Buyer cannot add more than 5 listings to the shortlist
The E2E suite SHALL verify that adding a 6th listing shows an error and the count stays at 5.

#### Scenario: Error is shown when adding sixth listing
- **WHEN** 5 listings are already in the shortlist and the buyer tries to add a 6th
- **THEN** an error message is visible and the shortlist count remains at 5

### Requirement: Buyer can remove a listing from the shortlist
The E2E suite SHALL verify that clicking Remove on a shortlist item removes it and decrements the count.

#### Scenario: Remove button decrements shortlist count
- **WHEN** the buyer clicks Remove on an item in the shortlist
- **THEN** the item is gone from the shortlist page and the count decrements

### Requirement: Telegram enquiry button links to the correct account
The E2E suite SHALL verify that the Telegram enquiry button on the detail page has an href containing `t.me/Lucas_Keee`.

#### Scenario: Enquiry button href targets Lucas_Keee
- **WHEN** the buyer views a listing detail page
- **THEN** the Telegram enquiry button's href contains `t.me/Lucas_Keee`

### Requirement: Unavailable and reserved listings are hidden from the buyer grid
The E2E suite SHALL verify that listings with `status = "reserved"` and `status = "unavailable"` do not appear on the grid page, confirmed by asserting their listing codes are absent from the DOM.

#### Scenario: Reserved listing code is absent from grid DOM
- **WHEN** the buyer views the listing grid
- **THEN** the listing code of the reserved seeded listing is not present anywhere in the page DOM

### Requirement: Admin can log in
The E2E suite SHALL verify that submitting valid credentials on `/manage/login` redirects to `/manage` and shows the dashboard table.

#### Scenario: Admin login shows dashboard
- **WHEN** the admin submits valid credentials on `/manage/login`
- **THEN** the browser is at `/manage` and the listings table is visible

### Requirement: Unauthenticated user cannot access the admin dashboard
The E2E suite SHALL verify that navigating directly to `/manage` without a session redirects to `/manage/login`.

#### Scenario: Direct navigation to dashboard without session redirects
- **WHEN** a new browser context with no cookies navigates directly to `/manage`
- **THEN** the browser is redirected to `/manage/login`

### Requirement: Admin can create a listing
The E2E suite SHALL verify that filling in the create listing form and submitting creates a new listing visible in the dashboard table.

#### Scenario: Created listing appears in the dashboard table
- **WHEN** the admin fills in the create listing form with valid data and submits
- **THEN** the new listing is visible in the dashboard table with the correct listing code

### Requirement: Admin can edit a listing price
The E2E suite SHALL verify that editing a listing's rent price and saving updates the displayed price in the dashboard.

#### Scenario: Updated price appears in dashboard table
- **WHEN** the admin edits a listing's rent price to 90 and saves
- **THEN** the dashboard table shows 90 as the rent price for that listing

### Requirement: Admin can upload an image to a listing
The E2E suite SHALL verify that uploading an image file on the edit listing page adds an image thumbnail to the listing. The test SHALL use a real file — not a mock upload.

#### Scenario: Image thumbnail appears after upload
- **WHEN** the admin uploads a real image file on the edit listing page
- **THEN** an image thumbnail is visible in the image section of the form

### Requirement: Admin can change listing status
The E2E suite SHALL verify that using the quick-action to change a listing's status updates the status badge in the table.

#### Scenario: Status badge updates after quick-action
- **WHEN** the admin changes a listing's status to `reserved` via the quick-action
- **THEN** the status badge in the table row updates to show `reserved`

### Requirement: Admin can view action history
The E2E suite SHALL verify that after a status change, the action history view shows a record with the correct action type, old value, and new value.

#### Scenario: Status change appears in action history
- **WHEN** the admin changes a listing's status and opens the action history
- **THEN** a record is visible showing the old status, new status, and timestamp

### Requirement: Admin can log out
The E2E suite SHALL verify that clicking logout clears the session and that the admin dashboard is no longer accessible.

#### Scenario: Dashboard is inaccessible after logout
- **WHEN** the admin clicks logout and then navigates to `/manage`
- **THEN** the browser redirects to `/manage/login` and the dashboard content is not rendered
