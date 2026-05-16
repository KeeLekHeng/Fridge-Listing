## ADDED Requirements

### Requirement: Repository uses pnpm workspaces
The repository SHALL use pnpm workspaces as the package manager and monorepo tool.

#### Scenario: pnpm install succeeds from root
- **WHEN** a developer runs `pnpm install` at the repository root on a fresh clone
- **THEN** all workspace packages resolve and install without errors

### Requirement: Workspace packages are defined
The workspace SHALL define exactly three packages: `apps/web`, `apps/api`, and `packages/shared`.

#### Scenario: Workspace packages are recognised
- **WHEN** `pnpm list -r` is run at the root
- **THEN** `apps/web`, `apps/api`, and `packages/shared` are listed as workspace packages

### Requirement: Root scripts are defined
The root `package.json` SHALL define the following scripts: `lint`, `typecheck`, `build`, and `test:e2e`.

#### Scenario: Lint script runs across all packages
- **WHEN** `pnpm lint` is run at the root
- **THEN** ESLint runs across all packages and exits with code 0 on clean code

#### Scenario: Typecheck script runs across all packages
- **WHEN** `pnpm typecheck` is run at the root
- **THEN** `tsc --noEmit` runs across all packages and exits with code 0

#### Scenario: Build script builds web and api
- **WHEN** `pnpm build` is run at the root
- **THEN** both `apps/web` and `apps/api` produce build output without errors

### Requirement: Per-package TypeScript configuration
Each package SHALL have its own `tsconfig.json` that extends a shared base configuration at the repository root.

#### Scenario: TypeScript resolves shared package imports
- **WHEN** `apps/api` imports a type from `packages/shared`
- **THEN** `tsc --noEmit` resolves the import without path errors

### Requirement: Environment variable example file
The repository SHALL include a `.env.example` file at the root listing every required environment variable name with placeholder values. No real secret values SHALL appear in this file.

#### Scenario: .env.example contains all required variables
- **WHEN** `.env.example` is read
- **THEN** it contains all variables listed in the requirements: DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, ADMIN_USERNAME, ADMIN_PASSWORD, FRONTEND_URL, BACKEND_URL, COOKIE_DOMAIN, TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID, TELEGRAM_WEBHOOK_SECRET, STORAGE_ENDPOINT, STORAGE_REGION, STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY, STORAGE_PUBLIC_BASE_URL, DEFAULT_CAPACITY_LITRES, DEFAULT_RENT_PRICE, DEFAULT_DEPOSIT_PRICE, DEFAULT_DELIVERY_PRICE

#### Scenario: .env.example contains no real secrets
- **WHEN** `.env.example` is inspected
- **THEN** all values are placeholders (e.g. empty strings or descriptive tokens) and no real credentials appear

### Requirement: Gitignore excludes secrets and build artifacts
The `.gitignore` SHALL exclude `.env`, `.env.*` (except `.env.example`), `node_modules/`, `dist/`, and `build/`.

#### Scenario: .env is not tracked by git
- **WHEN** `.env` exists at the root and `git status` is run
- **THEN** `.env` does not appear in staged or untracked files

### Requirement: ESLint configured with TypeScript rules
ESLint SHALL be configured at the root with TypeScript-aware rules enabled across all packages.

#### Scenario: ESLint catches a TypeScript type error
- **WHEN** a file contains an implicit `any` type and `pnpm lint` is run
- **THEN** ESLint reports an error and exits with a non-zero code

### Requirement: apps/web scaffolded with Vite and Tailwind
`apps/web` SHALL be scaffolded with Vite, React 18, TypeScript, and Tailwind CSS. It SHALL render a blank page without errors.

#### Scenario: Web app builds without errors
- **WHEN** `pnpm build` is run inside `apps/web`
- **THEN** Vite produces a `dist/` directory without TypeScript or Tailwind errors

### Requirement: apps/api scaffolded with Fastify
`apps/api` SHALL be scaffolded with Fastify and TypeScript. It SHALL expose a health check endpoint `GET /health` that returns `{ ok: true }`.

#### Scenario: Health check endpoint responds
- **WHEN** `apps/api` is running and `GET /health` is called
- **THEN** the response is HTTP 200 with body `{ "ok": true }`

### Requirement: packages/shared is a compilable TypeScript library
`packages/shared` SHALL be a TypeScript library package with no runtime framework dependency. It SHALL compile without errors even when empty.

#### Scenario: Shared package compiles
- **WHEN** `pnpm typecheck` is run inside `packages/shared`
- **THEN** `tsc --noEmit` exits with code 0
