## ADDED Requirements

### Requirement: Admin login page is at /manage/login and is not publicly linked
The admin login page SHALL be at route `/manage/login`. It SHALL NOT be linked or referenced from any public buyer-facing page.

#### Scenario: Login page is accessible by direct URL
- **WHEN** the admin types `/manage/login` directly into the browser address bar
- **THEN** the login form is displayed

#### Scenario: Login route is not linked from public pages
- **WHEN** any buyer-facing page HTML is inspected
- **THEN** no anchor tag references `/manage` or `/manage/login`

### Requirement: Login form submits to the admin login API
The login form SHALL collect `username` and `password` and submit to `POST /api/admin/login`.

#### Scenario: Valid credentials redirect to dashboard
- **WHEN** the admin submits valid username and password on `/manage/login`
- **THEN** the browser redirects to `/manage` and the admin dashboard is visible

### Requirement: Login failure shows a generic error message
On failed login, the form SHALL display a generic error message that does not reveal whether the username or password was incorrect.

#### Scenario: Wrong password shows generic error
- **WHEN** the admin submits a correct username but wrong password
- **THEN** a generic error message is shown and the error text does not mention "password" or "username" specifically

### Requirement: All /manage routes redirect unauthenticated users to login
All routes under `/manage/*` except `/manage/login` SHALL redirect unauthenticated users to `/manage/login` before rendering any protected content.

#### Scenario: Unauthenticated access to dashboard redirects to login
- **WHEN** a user without a valid session navigates directly to `/manage`
- **THEN** they are redirected to `/manage/login` before any dashboard content is rendered

### Requirement: Admin dashboard displays all listings regardless of status
The dashboard at `/manage` SHALL display all listings in a table, including unavailable, reserved, sold, and rented listings.

#### Scenario: Dashboard shows all status types
- **WHEN** listings exist with all 5 statuses and the admin views the dashboard
- **THEN** all 5 listings appear in the table

### Requirement: Dashboard table shows required columns
The table SHALL display the following columns: image thumbnail, listing code, brand, location, buy price, rent price, deposit, status (as a colored badge), updated date, and actions.

#### Scenario: Status column uses colored badges
- **WHEN** the admin views the dashboard table
- **THEN** each listing's status is displayed as a distinctly colored badge for all 5 status values

### Requirement: Dashboard supports search by listing code or brand
The dashboard SHALL provide a search input that filters listings by listing code or brand.

#### Scenario: Search by listing code narrows results
- **WHEN** the admin types `F-0005` in the search input
- **THEN** only the listing with code F-0005 appears in the table

### Requirement: Dashboard supports filter by status and location
The dashboard SHALL provide filter controls for status and location.

#### Scenario: Status filter shows only selected status
- **WHEN** the admin selects the `reserved` status filter
- **THEN** only reserved listings are shown in the table

### Requirement: Dashboard includes a Create listing button
The dashboard SHALL include a "Create listing" button that navigates to `/manage/listings/new`.

#### Scenario: Create listing button navigates to the form
- **WHEN** the admin clicks the Create listing button
- **THEN** the browser navigates to `/manage/listings/new` and the create form is displayed

### Requirement: Actions column provides edit, status change, and history access
The actions column in the dashboard table SHALL include at minimum: an Edit link, a Change Status action, and a View History action for each listing.

#### Scenario: Edit link navigates to the edit form
- **WHEN** the admin clicks the Edit action for a listing
- **THEN** the browser navigates to `/manage/listings/:id/edit` with the listing's current values pre-filled

### Requirement: Status change quick-action updates the badge without full page reload
The admin SHALL be able to change a listing's status from the dashboard via a quick-action that updates the status badge in the table without navigating away.

#### Scenario: Quick status change updates badge in place
- **WHEN** the admin changes a listing's status to `reserved` via the quick-action
- **THEN** the status badge in the table updates to `reserved` without a full page reload

### Requirement: Logout calls the logout endpoint and redirects to login
The dashboard SHALL include a logout button. Clicking it SHALL call `POST /api/admin/logout`, clear the session, and redirect to `/manage/login`.

#### Scenario: Logout ends the session
- **WHEN** the admin clicks logout
- **THEN** `POST /api/admin/logout` is called, the admin is redirected to `/manage/login`, and subsequent requests to `/manage` redirect back to the login page

### Requirement: Create and edit listing form includes all required fields with defaults
The create/edit form at `/manage/listings/new` and `/manage/listings/:id/edit` SHALL include fields for: brand, location, condition, buy enabled toggle, buy price, rent enabled toggle, rent price (default 70), deposit price (default 40), delivery available toggle (default true), delivery price (default 15), status (select), and admin note.

#### Scenario: Create form shows correct default values
- **WHEN** the admin opens the create listing form
- **THEN** rent price is pre-filled as 70, deposit as 40, delivery available is checked, and delivery price is 15

### Requirement: Form displays inline validation errors per field
The form SHALL display validation errors inline for each field using Zod schema errors. A single generic error message is not acceptable.

#### Scenario: Missing required field shows field-level error
- **WHEN** the admin submits the form without filling in the brand field
- **THEN** an error message appears directly below the brand field

### Requirement: Edit form pre-fills with existing listing values
The edit form SHALL load the existing listing data and pre-fill all fields with current values.

#### Scenario: Edit form shows current listing values
- **WHEN** the admin opens the edit form for listing F-0004 with rentPrice = 80
- **THEN** the rent price field is pre-filled with 80

### Requirement: Image upload section shows existing images and allows deletion
The image upload section in the create/edit form SHALL display existing images with a delete button for each, and SHALL allow uploading up to 3 total images.

#### Scenario: Delete button removes an existing image
- **WHEN** the admin clicks Delete on an existing image in the form
- **THEN** the image is removed and no longer displayed in the form

#### Scenario: Upload is disabled when 3 images exist
- **WHEN** a listing already has 3 images in the edit form
- **THEN** the upload control is disabled or hidden

### Requirement: Successful create or edit redirects to dashboard
After a successful create or edit form submission, the admin SHALL be redirected to the dashboard at `/manage`.

#### Scenario: Successful edit redirects to dashboard
- **WHEN** the admin submits a valid edit form
- **THEN** the browser redirects to `/manage` and the updated listing appears in the table

### Requirement: Status values are available reserved rented sold unavailable
The status field in the form and quick-action controls SHALL support exactly the following values: `available`, `reserved`, `rented`, `sold`, `unavailable`.

#### Scenario: All 5 status values are selectable
- **WHEN** the admin opens the status dropdown on the create/edit form
- **THEN** all 5 status options are present

### Requirement: Action history is viewable from dashboard and edit page
The admin SHALL be able to view paginated action history records from both the dashboard and the listing edit page.

#### Scenario: Action history shows after a status change
- **WHEN** the admin changes a listing status and then opens the action history for that listing
- **THEN** a record appears showing the old status, new status, performed by, and timestamp

### Requirement: Action history shows records from both admin web and Telegram bot
The action history view SHALL correctly display records with `performedBy` of both `admin_web` and `telegram_bot`, shown with readable labels.

#### Scenario: Telegram bot action appears in admin history view
- **WHEN** a status is changed via the Telegram bot and the admin views the action history
- **THEN** the record is visible with a label indicating it was performed by the Telegram bot

### Requirement: Action history displays actionType as a readable label
The `actionType` values SHALL be displayed as human-readable labels (e.g. "Status changed", "Price updated", "Note updated") rather than raw enum strings.

#### Scenario: actionType is shown as readable text
- **WHEN** the admin views a history record with `actionType = "status_change"`
- **THEN** the UI displays "Status changed" or equivalent — not the raw string "status_change"

### Requirement: Action history is paginated
The action history view SHALL support pagination and SHALL NOT load all records at once.

#### Scenario: History pagination loads additional records
- **WHEN** more history records exist than the page size
- **THEN** pagination controls allow the admin to navigate to additional records

### Requirement: listingCode and id are read-only in the edit form
The edit form SHALL NOT allow the admin to modify `listingCode` or `id`. These fields SHALL be read-only or absent from the form.

#### Scenario: listingCode field is not editable
- **WHEN** the admin opens the edit form for any listing
- **THEN** the listing code is displayed as read-only text and cannot be changed via the form
