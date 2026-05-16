## ADDED Requirements

### Requirement: Buyer browsing is anonymous — no login required
The buyer UI SHALL be accessible to all users without any login, account creation, or authentication.

#### Scenario: Buyer accesses listing grid without logging in
- **WHEN** a buyer navigates to `/` in a browser without any session
- **THEN** the listing grid page loads and displays available listings

### Requirement: Buyer UI is a mobile-first web app targeting 375px viewport
The buyer UI is a mobile-first web app — it runs in a mobile browser (Safari on iOS, Chrome on Android), not as a native app. All pages SHALL be fully usable and visually correct at 375px viewport width (iPhone SE baseline). Desktop/laptop layout optimisation is a post-MVP goal.

#### Scenario: Listing grid is usable at 375px
- **WHEN** the listing grid page is viewed in a browser DevTools environment set to 375px width
- **THEN** all listing cards, filters, and pagination controls are visible and interactive without horizontal scrolling

### Requirement: Listing grid shows only available listings
The listing grid SHALL display only listings with `status = "available"`. Listings with any other status SHALL not appear.

#### Scenario: Reserved listing is hidden from the grid
- **WHEN** listings exist with statuses `available` and `reserved`
- **THEN** only the `available` listing card appears on the grid page

### Requirement: Listing card displays key information
Each listing card SHALL display: main image (first by `sortOrder`), brand, 50L capacity badge, buy price (if `buyEnabled`), rent price + deposit (if `rentEnabled`), location, and a delivery badge if `deliveryAvailable`.

#### Scenario: Card shows rent price when rentEnabled
- **WHEN** a listing has `rentEnabled = true` and `rentPrice = 70`, `depositPrice = 40`
- **THEN** the card shows the rent price and deposit amount

### Requirement: Grid supports buy/rent and location filters
The listing grid SHALL provide filter controls for buy/rent and location. Applying a filter SHALL update the URL query string and reload results without a full page refresh.

#### Scenario: Rent filter hides buy-only listings
- **WHEN** the buyer applies the Rent filter on the listing grid
- **THEN** listings with `rentEnabled = false` are removed from the results

#### Scenario: Filter state is reflected in URL
- **WHEN** the buyer selects a location filter
- **THEN** the URL query string updates to include the selected location parameter

### Requirement: Grid shows 6 listings per page with pagination
The listing grid SHALL show 6 cards per page with pagination controls.

#### Scenario: Page 2 shows the next set of listings
- **WHEN** 10 available listings exist and the buyer navigates to page 2
- **THEN** 4 listing cards are shown and pagination indicates page 2 of 2

### Requirement: Listing detail page shows full listing information
The listing detail page at `/listing/:id` SHALL display: image gallery (up to 3), brand, location, condition, 50L capacity label, buy price (if buyEnabled), rent price and deposit (if rentEnabled), delivery note if deliveryAvailable, add-to-shortlist button, Telegram enquiry button, and similar listings section.

#### Scenario: Detail page shows all price options
- **WHEN** a listing has both `buyEnabled` and `rentEnabled` and the buyer opens the detail page
- **THEN** both buy price and rent price with deposit are displayed

### Requirement: Detail page shows 404 for non-available listings
If a listing does not exist or its status is not `"available"`, the detail page SHALL display a not-found message rather than the listing details.

#### Scenario: Reserved listing shows not-found on detail page
- **WHEN** a buyer navigates to the detail page of a listing with `status = "reserved"`
- **THEN** a not-found message is shown and no listing details are revealed

### Requirement: Similar listings prioritise same location then price
The similar listings section on the detail page SHALL show up to 4 available listings that are not the current listing, sorted by same location first then closest price.

#### Scenario: Same-location listings appear before others in recommendations
- **WHEN** a listing in location A is open and listings exist in location A and location B
- **THEN** the location A listings appear first in the similar listings section

### Requirement: Telegram enquiry button generates a prefilled deep link
The Telegram enquiry button on the detail page SHALL generate a `https://t.me/Lucas_Keee` deep link with a prefilled message containing: listing code, brand, buy or rent option and price, deposit, location, delivery price, and the listing page URL (`${FRONTEND_URL}/listing/:id`).

#### Scenario: Telegram button href targets the correct account
- **WHEN** the buyer views the Telegram enquiry button on any listing detail page
- **THEN** the button href contains `t.me/Lucas_Keee`

#### Scenario: Prefilled message includes listing page URL
- **WHEN** the buyer clicks the Telegram enquiry button
- **THEN** the prefilled message includes the full listing page URL so the admin can tap directly to the gallery

### Requirement: Similar listings section excludes the current listing
The similar listings section SHALL never include the listing currently being viewed.

#### Scenario: Current listing is absent from similar listings
- **WHEN** the buyer views the detail page for F-0001
- **THEN** F-0001 does not appear in the similar listings section

### Requirement: Shortlist is stored in localStorage with a maximum of 5 items
The shortlist SHALL be stored in `localStorage`. It SHALL accept a maximum of 5 listings. Attempting to add a 6th SHALL show an error message without adding the item.

#### Scenario: Sixth item is rejected with an error message
- **WHEN** the buyer already has 5 listings in the shortlist and clicks Add to shortlist on a 6th listing
- **THEN** an error message is shown and the shortlist count remains at 5

### Requirement: Shortlist page displays shortlisted listings with remove option
The shortlist page at `/shortlist` SHALL display each shortlisted listing with its main image, listing code, brand, buy/rent price, and a remove button.

#### Scenario: Remove button removes listing from shortlist
- **WHEN** the buyer clicks Remove on a shortlisted listing
- **THEN** the listing is removed from the shortlist page and the shortlist count decrements

### Requirement: Send all to Telegram generates a single compiled deep link
The "Send all to Telegram" button on the shortlist page SHALL generate a single Telegram deep link containing a prefilled message with all shortlisted listings' details. Each listing entry SHALL include its listing page URL (`${FRONTEND_URL}/listing/:id`).

#### Scenario: Send all includes all shortlisted listings
- **WHEN** the buyer has 3 listings in the shortlist and clicks Send all to Telegram
- **THEN** the generated Telegram deep link prefills a message containing details for all 3 listings

### Requirement: The word shortlist is used throughout — not cart
The buyer UI SHALL use the word "shortlist" throughout. The word "cart" SHALL NOT appear in any UI text, aria labels, or source code.

#### Scenario: No cart terminology appears in the UI
- **WHEN** all buyer-facing pages are inspected
- **THEN** no instance of the word "cart" appears in any visible text or aria label

### Requirement: Add to shortlist button reflects current shortlist state
The "Add to shortlist" button on the detail page SHALL show "Already in shortlist" and be disabled if the listing is already in the shortlist. It SHALL be disabled if the shortlist is at 5 items.

#### Scenario: Button is disabled for already-shortlisted listing
- **WHEN** a listing is already in the shortlist and the buyer opens its detail page
- **THEN** the Add to shortlist button is disabled or shows "Already in shortlist"

### Requirement: Shortlist count is visible in navigation on all pages
The number of items currently in the shortlist SHALL be visible in the site navigation on all buyer-facing pages.

#### Scenario: Shortlist count updates when item is added
- **WHEN** the buyer adds a listing to the shortlist
- **THEN** the shortlist count in the navigation bar increments immediately

### Requirement: Buyer UI is built with React Vite TypeScript and Tailwind
The buyer UI SHALL be built with React 18, Vite, TypeScript, and Tailwind CSS. Routes SHALL be managed by React Router v6.

#### Scenario: Web app builds without errors
- **WHEN** `pnpm build` is run in `apps/web`
- **THEN** Vite produces a `dist/` directory without TypeScript or Tailwind errors

### Requirement: Shortlist persists across page navigation
Shortlist data stored in `localStorage` SHALL persist when the buyer navigates between pages or refreshes the browser.

#### Scenario: Shortlist survives page refresh
- **WHEN** the buyer adds a listing to the shortlist and then refreshes the page
- **THEN** the shortlist still contains the added listing and the count is correct
