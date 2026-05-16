Making a website to show my fridges that are for sale/rent.

So I'm selling fridges at a range of prices from 60-120, and renting fridges at a range of prices and collect deposit (e.g rent 70, deposit 40)

Tech stack:
Typescript Backend, and typescript react frontend, 

Database:
Database: Managed PostgreSQL (PostgreSQL 15 or newer).
Reason: Supports relational data (users, listings, images), role-based access, and future growth beyond MVP.
Operational requirement: No self-hosted DB; provider-managed backups, patching, and monitoring.
Image handling: Images must be stored in object storage; PostgreSQL stores image metadata/URLs only.

Playwright to test website automation flow

We should use DTOs to communicate between frontend and backend
And listed items should be abstract in a way, currently we are selling/renting fridges only but in the future we may extend other products. DO NOT Tightly couple fridge with the posting/listing aspects

Features:

Two roles (admin, buyer)

Generally
1. Listings

Main general page (All fridge page)
Show up to 6 fridges in a page, with pagination 
- show image, show sale / rent price, show link that can be copied so someone can click the link and redirected to our website and listing


Specific fridge listing page (Fridge details)
- Show price and procurement options (rent/buy) with the price
- Have a button to buy/rent which is actually a telegram redirect link with the listing details and images to @Lucas_Keee in telegram with details of buy and sell. (There may be a chance for them to negotiate but this makes it easier for them to send listing to my account to discuss and reserve)
- Show recommended fridges similar to the current one in terms of price or brand prioritize brand first, then price do a quick filter 


Admin:
1. Able to navigate to login page through a path that needs to be explicity typed in or curled at to login/ make requests. Need to authenticate with username and password and encrypt, and use JWT session cookies, whatever is advised for safe logging in and not getting hacked (focus on this point as I want to learn from this as well)

2. Actions:
a. upload listings (one or more) supports bulk uploads
fridge (3 pictures, brand, auto generated id to identify fridge, when it was uploaded, condition, listing sale price and rent price, deposit price) rent price has default of 70 and deposit 40 
Optional sell and rent (some may be one only or some may be both)

b. mark listing as reserved/unavailable, so that users wont inqurie about fridges that have been sold
- Might be unavailable due to personal reasons or sold/rented to customer already
- Might be reserved by a buyer who is interested to buy or rent the fridge already

c. mark listing as available again (when renter/buyer returns it)
-allow us to update sale/rent information again through a dialog if we want to update or use back same info



Buyer:


Users:
1. Enter 








4. Telegram integration with a bot so that I can talk to bot to authenticate (whitelist only me) and perform the actions above

Agent orchestration:
- Reusable orchestration kit is located at `agent-orchestration/` and can be copied to future projects.
- OpenSpec artifacts are the source of truth for planning and implementation order.
- Orchestrator loop: pick one OpenSpec task -> implementer -> lint/tests -> reviewer -> mark done or retry.
- Definition of done for each task requires passing lint, tests, and reviewer approval.
- Recommended framework for reusable orchestration: LangGraph (stateful flow), with role prompts from this repo.
- Retry policy: maximum 2 retries per task, then human escalation.
- Review policy: any high-severity finding blocks completion until fixed.


Ideas for the future or even near future if implementable:

- Agent such that I can just forward messages to bot (1-4) messages in one go, with the listing details and the sale/rent information and ask agent to go update state OR listing details with reserve information and ask agent to update state. 
Forwarded message includes the persons telegram @ and can be used to fill info

- Help to fill up a spreadsheet so i can monitor with google sheet or spreadsheet MCP. 
Need some pre configured skills (reserve listing, free up listing, sale/rent listing, returned listing)


