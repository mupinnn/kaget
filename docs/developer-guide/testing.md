# API Testing Conventions

Testing best practices and setup for the KaGet API (`apps/api`) and web E2E tests (`apps/web`). For route handler patterns (errors, validation, logging), see [API Route Handlers](./api-route-handlers.md).

## Overview

### API (`apps/api`)

The API test suite uses:

- **PGlite** — in-process PostgreSQL for fast, isolated tests
- **better-auth testUtils plugin** — real session/user creation and authentication
- **Hono testClient** — typed RPC client for route assertions
- **Vitest** — test runner and assertion library
- **Assertion helpers** — `expectSuccess` / `expectError` for typed response checks

The reference test suite is [`apps/api/src/__tests__/wallets.test.ts`](../../apps/api/src/__tests__/wallets.test.ts).

### Web E2E (`apps/web`)

End-to-end tests use:

- **Playwright** — browser automation (Chromium only in v1)
- **Page Object Model** — locators and user actions live under `e2e/pages/`; specs orchestrate flows only
- **Custom fixtures** — inject page objects via `e2e/fixtures/test.ts`
- **Auth setup project** — onboarding-complete user saved to `e2e/.auth/user.json` for authenticated smoke tests

Layout:

```
apps/web/e2e/
├── auth.setup.ts          # Playwright setup project (storageState)
├── fixtures/test.ts       # Extended test with page object fixtures
├── helpers/               # test-user factory, env constants
├── pages/                 # Page Object Models
    └── specs/                 # Test specs (auth, onboarding, navigation, features)
```

#### Test projects

| Project | Specs | Auth state |
|---------|-------|------------|
| `setup` | `auth.setup.ts` | Creates onboarding-complete user |
| `seed` | `seed.setup.ts` | Seeds baseline wallets for feature tests |
| `chromium-unauth` | `auth` (signed-out shell + Google button) | None |
| `chromium` | `navigation` | Authenticated |
| `chromium-features` | `wallets`, `budgets`, `records`, `transfers`, `debts-loans`, `settings` | Authenticated + seeded wallets |

#### Feature coverage

| Feature | Spec file | Flows covered |
|---------|-----------|---------------|
| Wallets | `wallets.spec.ts` | Create, edit, delete, detail tabs |
| Budgets | `budgets.spec.ts` | Allocate, use budget expense |
| Records | `records.spec.ts` | Create income/expense, delete |
| Transfers | `transfers.spec.ts` | Transfer between wallets, with fee |
| Debts & Loans | `debts-loans.spec.ts` | Create debt/loan, resolve, delete |
| Settings | `settings.spec.ts` | Read-only currency display |

#### Prerequisites

E2E tests exercise the full stack (Postgres + API + web):

1. Start Postgres: `docker compose up -d db`
2. Migrate: `bun run --env-file=.env --filter @kaget/api db:migrate`
3. Start API: `bun run --env-file=.env --filter @kaget/api dev`

Playwright starts the Vite dev server automatically via `webServer` in [`playwright.config.ts`](../../apps/web/playwright.config.ts).

#### Running E2E locally

From `apps/web`:

```bash
bunx playwright install chromium   # first run only; use --with-deps on Ubuntu/CI

bun run test:e2e
bun run test:e2e:ui                # interactive UI mode
bun run test:e2e:headed          # visible browser
bun run test:e2e:report          # open HTML report
```

From the repository root:

```bash
bun run test:e2e
```

**Nix dev shell:** The flake sets `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` and related env vars. Run E2E inside `nix develop` (or `direnv`) so Playwright uses the Nix-provided Chromium binary.

#### POM conventions

- Add a new `*.page.ts` under `e2e/pages/` for each screen or layout region
- Extend `e2e/fixtures/test.ts` to inject new page objects into specs
- Prefer `getByRole` / `getByLabel` selectors; reuse existing `data-testid`s where present (onboarding, list pages)
- Add `data-testid` only when role/label selectors are unstable — do not scatter them across the app preemptively

#### CI re-enable checklist

Before removing `if: false` from [`.github/workflows/e2e.yml`](../../.github/workflows/e2e.yml):

- [ ] Smoke suite passes locally 3+ consecutive runs
- [ ] Postgres service + API startup steps wired in the workflow
- [ ] `bunx playwright install --with-deps chromium` runs in CI
- [ ] Playwright report artifact uploads on failure

## API setup

### Database (`setupTestDatabase`)

Located in `src/__tests__/helpers/db.ts`, this utility:

1. Creates an in-memory PGlite instance
2. Runs all migrations from `migrations/` directory
3. Returns a Drizzle ORM connection and cleanup functions

**Usage:**

```ts
import { setupTestDatabase } from './helpers/db'

beforeAll(async () => {
  const testDatabase = await setupTestDatabase()
  // testDatabase.db is a Drizzle connection
})

afterAll(async () => {
  await testDatabase.close()
})
```

### Authentication (`createTestAuth`)

Located in `src/__tests__/helpers/auth.ts`, this utility:

1. Creates a test-only `betterAuth` instance with the `testUtils()` plugin
2. Connects it to the same PGlite DB as the rest of the tests
3. Exposes `test` helpers for user/session creation

**Key helpers:**

| Helper | Purpose |
| --- | --- |
| `test.createUser(overrides?)` | Create a user object (not persisted) |
| `test.saveUser(user)` | Persist user to DB |
| `test.getAuthHeaders({ userId })` | Create a real session and return `Headers` with session cookie |
| `getTestAuthHeaders(test, userId)` | Same as above, returns `Record<string, string>` for `testClient` |
| `test.deleteUser(userId)` | Remove user from DB |

**Usage:**

```ts
import { createTestAuth, getTestAuthHeaders } from './helpers/auth'

let authHeaders: Record<string, string>

beforeAll(async () => {
  const testDatabase = await setupTestDatabase()
  const { auth, test } = await createTestAuth(testDatabase.db)

  const user = test.createUser({ email: 'test@example.com' })
  await test.saveUser(user)
  authHeaders = await getTestAuthHeaders(test, user.id)
})
```

Prefer `getTestAuthHeaders` over `test.getAuthHeaders` — it returns a plain object you can pass directly to `testClient` without `Object.fromEntries(headers.entries())`.

### App Factory (`createTestApp`)

Located in `src/__tests__/helpers/app.ts`, wraps `createApp` with test env config from `helpers/mock.ts`:

```ts
import { createTestApp } from './helpers/app'

const app = createTestApp(testDatabase.db, auth)
```

### Test Client (`testClient`)

From `hono/testing`, creates a typed RPC client that routes through the app in-process:

```ts
import { testClient } from 'hono/testing'

const client = testClient(createTestApp(testDatabase.db, auth))

const res = await client.api.wallets.$post(
  { json: { name: 'My Wallet', type: 'DIGITAL' } },
  { headers: authHeaders },
)
```

## Assertion helpers

Located in `src/__tests__/helpers/assertions.ts`. These replace manual status checks and union-type narrowing on `res.json()`.

### `expectSuccess`

Asserts status, verifies the body has a `data` property, and returns the parsed JSON body.

```ts
import { expectSuccess } from './helpers/assertions'

const { data } = await expectSuccess(res, 201)
expect(data).toMatchObject({ name: 'My Savings', type: 'DIGITAL' })
```

Signature:

```ts
expectSuccess<T = unknown>(res: ClientResponse<T>, status = 200): Promise<T>
```

Destructure `{ data }` from the result — handlers return `{ data: ... }`.

### `expectError`

Asserts failure status, `res.ok === false`, and that `error.code` matches the expected code.

```ts
import { expectError } from './helpers/assertions'
import { ERROR_CODES } from '../lib/error-codes'

await expectError(res, ERROR_CODES.WALLET.NOT_FOUND, 404)
await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400)
await expectError(res, ERROR_CODES.AUTH.UNAUTHORIZED, 401)
```

Signature:

```ts
expectError(res: Response, code: string, status?: number): Promise<ErrorResponse['error']>
```

Import codes from [`ERROR_CODES`](../../apps/api/src/lib/error-codes.ts) — do not hardcode string literals in tests.

## Complete test example

Mirrors [`wallets.test.ts`](../../apps/api/src/__tests__/wallets.test.ts):

```ts
import { eq } from 'drizzle-orm'
import { testClient } from 'hono/testing'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ERROR_CODES } from '../lib/error-codes'
import { createTestApp } from './helpers/app'
import { expectError, expectSuccess } from './helpers/assertions'
import { createTestAuth, getTestAuthHeaders } from './helpers/auth'
import { setupTestDatabase } from './helpers/db'

describe('Wallets API', () => {
  let testDatabase: Awaited<ReturnType<typeof setupTestDatabase>>
  let authHeaders: Record<string, string>
  let client: ReturnType<typeof testClient<ReturnType<typeof createTestApp>>>

  beforeAll(async () => {
    testDatabase = await setupTestDatabase()
    const { auth, test } = await createTestAuth(testDatabase.db)

    const user = test.createUser({ email: 'test@example.com', name: 'Test User' })
    await test.saveUser(user)
    authHeaders = await getTestAuthHeaders(test, user.id)

    client = testClient(createTestApp(testDatabase.db, auth))
  })

  afterAll(async () => {
    await testDatabase.close()
  })

  it('should create a wallet', async () => {
    const res = await client.api.wallets.$post(
      { json: { name: 'My Savings', type: 'DIGITAL', initial_balance: 0 } },
      { headers: authHeaders },
    )

    const { data } = await expectSuccess(res, 201)
    expect(data).toMatchObject({ name: 'My Savings', type: 'DIGITAL', balance: '0.0000' })
  })

  it('should return 404 for non-existent wallet', async () => {
    const res = await client.api.wallets[':id'].$get(
      { param: { id: 'non-existent-id' } },
      { headers: authHeaders },
    )

    await expectError(res, ERROR_CODES.WALLET.NOT_FOUND, 404)
  })

  it('should reject unauthorized requests', async () => {
    const res = await client.api.wallets.$get()

    await expectError(res, ERROR_CODES.AUTH.UNAUTHORIZED, 401)
  })

  it('should reject invalid input', async () => {
    const res = await client.api.wallets.$post(
      { json: { name: '', type: 'DIGITAL' } },
      { headers: authHeaders },
    )

    await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400)
  })
})
```

## Side-effect assertions

When the HTTP response alone is not enough (e.g. cascade deletes), query Drizzle directly via `testDatabase.db`:

```ts
const records = await testDatabase.db.query.record.findMany({
  where: rec => eq(rec.walletId, walletId!),
})
expect(records).toHaveLength(0)
```

## Running tests

From `apps/api`:

```bash
# Single run
bun run test

# Watch mode
bun run test:watch
```

From the repository root:

```bash
bun run test
```

> API tests are not run in CI today (see root `.github/workflows/ci.yml`).

## Best practices

1. **One test database per suite** — Create in `beforeAll`, call `close()` in `afterAll`
2. **One auth context per suite** — Create `auth` and `test` once, reuse throughout
3. **Use `getTestAuthHeaders`** — Avoid repeating `Object.fromEntries(authHeaders.entries())`
4. **Use `expectSuccess` / `expectError`** — Assert status and response shape in one call
5. **Use `ERROR_CODES` in tests** — Keeps assertions aligned with handler error codes
6. **Use testClient RPC** — Typed routes; avoid raw `app.request()` calls
7. **Pass headers per-request** — Second parameter: `{ headers: authHeaders }`
8. **Group by endpoint** — Nested `describe('GET /wallets/:id', ...)` blocks

## File layout

```
apps/api/src/__tests__/
├── helpers/
│   ├── assertions.ts  # expectSuccess, expectError
│   ├── auth.ts        # createTestAuth, getTestAuthHeaders
│   ├── app.ts         # createTestApp(db, auth)
│   ├── db.ts          # setupTestDatabase()
│   └── mock.ts        # MOCK_ENV for test app config
└── wallets.test.ts    # Reference test suite
```

## Architecture

```mermaid
flowchart TD
  Test["Test File"]
  setupDB["setupTestDatabase"]
  createAuth["createTestAuth"]
  createApp["createTestApp"]
  testClient["testClient"]
  PGlite["PGlite\n(in-memory)"]
  Routes["App Routes"]

  Test --> setupDB --> PGlite
  Test --> createAuth --> PGlite
  Test --> createApp --> Routes
  Test --> testClient --> Routes
  Routes --> PGlite
```

The test database and auth instance share the same PGlite instance. Sessions created via `getTestAuthHeaders` are valid for the app's auth middleware because both use the same DB. The `testClient` routes requests through the app in-process without real HTTP.

## Notes on `better-auth/plugins`

The `testUtils` plugin is part of the test-only auth instance (`createTestAuth`), not the production auth (`apps/api/src/lib/auth.ts`). This preserves production security while providing privileged test helpers at runtime.

For more details, see the [better-auth testUtils documentation](https://www.better-auth.com/docs/plugins/test-utils).
