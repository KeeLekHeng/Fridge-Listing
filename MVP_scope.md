Final MVP Product Scope
Buyer Side

Pages:

Homepage / Listings page
Airbnb-style card grid
Show fridge image
Buy price
Rent price + deposit
Location
Availability
Filter by:
Buy
Rent
Location
Pagination or “load more”
Hide unavailable/sold/rented listings
Listing detail page
Image gallery, max 3 photos
Price options:
Buy
Rent
Location
50L capacity label
Delivery note: Delivery available: +$15
Telegram enquiry button
Add to shortlist button
Similar fridges section
Shortlist page
Max 5 listings
Remove item
Send all selected listings to Telegram

Use shortlist, not cart.

Admin Side

Admin is website-based, Shopify-inspired but simple.

Pages:

Hidden admin login path
Example: /manage/login
Username + password
JWT auth
1-day expiry
Admin dashboard
Table view
Columns:
Image
Listing ID
Brand
Location
Buy price
Rent price
Deposit
Status
Updated date
Actions
Create/edit listing
Upload up to 3 images
Brand
Location
Condition
Buy enabled
Buy price
Rent enabled
Rent price
Deposit
Delivery available, default yes, +$15
Status
Action history
Show latest status changes
Example:
FRG-0012 marked reserved
FRG-0008 price changed
FRG-0010 marked available


Telegram Bot in MVP

Yes, include it. But keep it controlled.

The bot should be for you only, not buyers.

Telegram’s Bot API is HTTP-based, so your backend can receive bot messages through a webhook and update your database from Telegram commands.

MVP Bot Commands

Start with these:

/status FRG-0012

Shows listing info.

/reserve FRG-0012

Marks listing as reserved.

/available FRG-0012

Marks listing as available again.

/rented FRG-0012

Marks listing as rented.

/sold FRG-0012

Marks listing as sold.

/unavailable FRG-0012

Hides listing from buyers.

/price FRG-0012 buy=100 rent=70 deposit=40

Updates price.

/note FRG-0012 buyer=@example interested in renting

Adds admin note.

Do not build this yet for MVP

Avoid Telegram listing creation with photos for the first version. It is possible later, but it adds complexity. For MVP, create listings from the admin website, then use Telegram to quickly update status and prices.

Telegram Bot Security

Use:

Allowed Telegram Chat ID only

Not just Telegram username.

Usernames can change, but chat ID is more reliable. The bot should reject every command unless it comes from your allowed Telegram user/chat ID.