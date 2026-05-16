## ADDED Requirements

### Requirement: Only admin login is supported — no public signup
The system SHALL support exactly one admin user. No public registration or signup endpoint SHALL exist.

#### Scenario: Signup endpoint does not exist
- **WHEN** a POST request is made to any `/api/auth/signup` or `/api/register` path
- **THEN** the server returns HTTP 404

### Requirement: Admin login endpoint accepts username and password
The admin login endpoint SHALL be `POST /api/admin/login` accepting `{ username, password }` in the request body.

#### Scenario: Valid credentials return 200
- **WHEN** `POST /api/admin/login` is called with the correct username and password
- **THEN** HTTP 200 is returned

### Requirement: Admin password is stored as a bcrypt hash
The admin password SHALL be stored as a bcrypt hash. Plaintext passwords SHALL NOT be stored or logged anywhere in the system.

#### Scenario: Password is hashed in the database
- **WHEN** the `User` row for the admin is queried directly from the database
- **THEN** the `passwordHash` field starts with `$2b$` and does not equal the plaintext password

### Requirement: Successful login sets an HttpOnly Secure SameSite cookie
On successful login, the server SHALL sign a JWT and set it as a cookie named `auth_token` with the flags: HttpOnly, Secure, SameSite=Strict.

#### Scenario: Login response sets cookie with correct flags
- **WHEN** `POST /api/admin/login` is called with valid credentials
- **THEN** the response `Set-Cookie` header contains `auth_token` with `HttpOnly`, `Secure`, and `SameSite=Strict` flags

### Requirement: JWT expires after one day
The JWT SHALL be signed with an expiry of 1 day (`JWT_EXPIRES_IN=1d`).

#### Scenario: Expired JWT is rejected
- **WHEN** a request is made with an `auth_token` cookie whose JWT has expired
- **THEN** the server returns HTTP 401

### Requirement: JWT is never returned in the response body
The JWT SHALL NOT appear in any response body or be stored in localStorage or any JavaScript-accessible storage.

#### Scenario: Login response body does not contain the token
- **WHEN** `POST /api/admin/login` is called with valid credentials
- **THEN** the response JSON body does not contain any field named `token`, `jwt`, or `accessToken`

### Requirement: All admin routes require a valid JWT cookie
All routes under `/api/admin/*` except `/api/admin/login` SHALL require a valid `auth_token` cookie. Requests without a valid cookie SHALL receive HTTP 401.

#### Scenario: Admin route without cookie returns 401
- **WHEN** `GET /api/admin/listings` is called without an `auth_token` cookie
- **THEN** HTTP 401 is returned

#### Scenario: Admin route with valid cookie succeeds
- **WHEN** `GET /api/admin/listings` is called with a valid `auth_token` cookie
- **THEN** HTTP 200 is returned with the listings data

### Requirement: Logout clears the auth cookie
The admin logout endpoint SHALL be `POST /api/admin/logout`. It SHALL clear the `auth_token` cookie and return HTTP 200.

#### Scenario: Logout clears cookie and blocks further admin access
- **WHEN** `POST /api/admin/logout` is called with a valid session, then `GET /api/admin/listings` is called
- **THEN** the logout returns HTTP 200, and the subsequent admin request returns HTTP 401

### Requirement: Me endpoint returns admin identity without password hash
`GET /api/admin/me` SHALL return `{ id, username, role }` for the authenticated admin. The `passwordHash` field SHALL NOT appear in the response.

#### Scenario: Me endpoint omits passwordHash
- **WHEN** `GET /api/admin/me` is called with a valid `auth_token` cookie
- **THEN** the response contains `id`, `username`, and `role` but does not contain `passwordHash`

### Requirement: Admin login route is not linked from public pages
The admin login route (`/manage/login`) SHALL NOT be linked or referenced in any public buyer-facing page markup or navigation.

#### Scenario: Public page HTML contains no admin link
- **WHEN** the buyer listing grid page HTML is inspected
- **THEN** no anchor tag, href, or text references `/manage` or `/manage/login`

### Requirement: Successful login redirects to admin dashboard
After a successful login form submission, the admin SHALL be redirected to `/manage`.

#### Scenario: Login redirects to dashboard
- **WHEN** the admin submits valid credentials on `/manage/login`
- **THEN** the browser navigates to `/manage` and the dashboard table is visible

### Requirement: JWT is verified via a Fastify preHandler hook
A Fastify `authenticate` preHandler hook SHALL verify the JWT from the `auth_token` cookie before any protected route handler executes.

#### Scenario: Hook blocks request before route handler runs
- **WHEN** a request with no cookie reaches a protected route
- **THEN** the route handler function is never called and HTTP 401 is returned immediately
