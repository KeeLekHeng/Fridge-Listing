## ADDED Requirements

### Requirement: Bot uses a webhook endpoint
The Telegram bot SHALL use a webhook registered at `POST /api/telegram/webhook`.

#### Scenario: Webhook endpoint accepts POST requests
- **WHEN** Telegram sends a POST request to `/api/telegram/webhook` with a valid secret header
- **THEN** the server processes the update and returns HTTP 200

### Requirement: Webhook validates the secret token header
The webhook endpoint SHALL validate the `X-Telegram-Bot-Api-Secret-Token` header against `TELEGRAM_WEBHOOK_SECRET`. Requests with an invalid or missing header SHALL return HTTP 403.

#### Scenario: Invalid secret header is rejected
- **WHEN** a POST request is made to `/api/telegram/webhook` with a wrong `X-Telegram-Bot-Api-Secret-Token` value
- **THEN** HTTP 403 is returned and no message is processed

### Requirement: Webhook always returns HTTP 200 to Telegram
The webhook endpoint SHALL always return HTTP 200 to Telegram regardless of processing outcome, to prevent Telegram from retrying deliveries.

#### Scenario: Processing error still returns 200
- **WHEN** a valid Telegram update is received but the listing code in the command does not exist
- **THEN** HTTP 200 is returned to Telegram (the error is communicated back as a bot reply, not as a non-200 HTTP response)

### Requirement: Non-admin messages are silently ignored
Every command handler SHALL check that `message.chat.id` (as an integer) matches `TELEGRAM_ADMIN_CHAT_ID`. Messages from non-admin chat IDs SHALL be silently ignored — no reply is sent.

#### Scenario: Non-admin message produces no reply and returns 200
- **WHEN** a Telegram message arrives from a chat ID that is not `TELEGRAM_ADMIN_CHAT_ID`
- **THEN** HTTP 200 is returned to Telegram and no reply message is sent

### Requirement: /status command replies with listing info
The `/status <listingCode>` command SHALL reply with a formatted message containing: listing code, brand, location, condition, status, buy price (if buyEnabled), rent price + deposit (if rentEnabled), delivery price (if deliveryAvailable), and admin note (if set).

#### Scenario: /status returns listing details
- **WHEN** the admin sends `/status F-0005` and the listing exists
- **THEN** the bot replies with a message containing the listing's brand, status, and prices

### Requirement: Status-changing commands update status and write history
The commands `/reserve`, `/available`, `/rented`, `/sold`, and `/unavailable` SHALL each: look up the listing by code, update the status, write a `ListingActionHistory` record with `performedBy = "telegram_bot"`, and reply with a confirmation message.

#### Scenario: /reserve marks listing reserved and writes history
- **WHEN** the admin sends `/reserve F-0010` and the listing has `status = "available"`
- **THEN** the listing status is updated to `reserved`, a history record with `performedBy = "telegram_bot"` is written, and the bot replies with `F-0010 marked as reserved.`

### Requirement: /price command updates only the provided price fields
The `/price <listingCode> buy=X rent=Y deposit=Z` command SHALL update only the price fields that are explicitly provided. Omitted fields SHALL remain unchanged. A `price_update` history record SHALL be written.

#### Scenario: /price with only rent updates rent only
- **WHEN** the admin sends `/price F-0003 rent=80` and the listing has `rentPrice = 70`, `depositPrice = 40`
- **THEN** `rentPrice` is updated to `80`, `depositPrice` remains `40`, and a `price_update` history record is written

### Requirement: /note command updates adminNote
The `/note <listingCode> <free text>` command SHALL update the listing's `adminNote` with all text after the listing code, write a `note_update` history record, and reply with confirmation.

#### Scenario: /note updates admin note
- **WHEN** the admin sends `/note F-0007 buyer=@example interested in renting`
- **THEN** `adminNote` is set to `buyer=@example interested in renting` and a `note_update` history record is written

### Requirement: Listing code matching is case-insensitive
All command handlers SHALL match listing codes case-insensitively.

#### Scenario: Lowercase listing code is matched
- **WHEN** the admin sends `/status f-0007`
- **THEN** the bot finds and returns details for listing `F-0007`

### Requirement: Unknown listing code replies with not-found message
If a listing code is not found, the bot SHALL reply with: `Listing <CODE> not found.`

#### Scenario: Unknown listing code returns not-found reply
- **WHEN** the admin sends `/reserve F-9999` and no listing with that code exists
- **THEN** the bot replies with `Listing F-9999 not found.`

### Requirement: Malformed command replies with usage message
If a command is malformed (e.g. missing listing code or invalid price format), the bot SHALL reply with the correct usage format for that command.

#### Scenario: Missing listing code returns usage message
- **WHEN** the admin sends `/price` with no arguments
- **THEN** the bot replies with the usage format for `/price`

### Requirement: Bot uses shared listing service logic
All command handlers SHALL call the shared listing service in `apps/api` for database operations. Telegram command handlers SHALL NOT contain duplicated Prisma queries inline.

#### Scenario: Status update through Telegram uses the same service as admin web
- **WHEN** `/reserve F-0005` is processed by the bot
- **THEN** the same listing service function used by `PATCH /api/admin/listings/:id/status` performs the database update

### Requirement: performedBy is hardcoded to telegram_bot for all bot commands
All `ListingActionHistory` records written by the Telegram bot SHALL have `performedBy = "telegram_bot"`. This value SHALL NOT be taken from any Telegram message field.

#### Scenario: History record has correct performedBy
- **WHEN** a status is changed via a Telegram bot command
- **THEN** the resulting history record has `performedBy = "telegram_bot"`

### Requirement: Listing creation via Telegram is not supported in MVP
The bot SHALL NOT support creating new listings with images through Telegram commands. Any attempt to do so SHALL receive a reply indicating this is not supported.

#### Scenario: Create command is not available
- **WHEN** the admin sends any form of `/create` or listing creation command
- **THEN** the bot replies that the command is not supported or is not recognised
