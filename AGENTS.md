# AGENTS.md

System prompt for LLM agents (Cursor, Copilot, Claude, etc.) working on **KaGet (Kawan Budget)**.

---

## Stack

**Frontend** (`apps/web`): React 19, TypeScript 6, Vite 8, TanStack Router/Query, Dexie (IndexedDB), Tailwind CSS v4, shadcn/ui (Radix unified `radix-ui` package), sonner, PWA

**Backend** (`apps/api`): Bun, Hono, better-auth, Drizzle ORM, PostgreSQL, Pino (wide-event logging), Zod 4

**Monorepo**: Bun workspaces + catalog, Turborepo, Biome 2.4 (root), Lefthook, commitlint 21

**Cross-app typing**: Hono RPC client — `AppType` exported from `@kaget/api` (`apps/api/src/app.ts`)

**Optional dev shell**: Nix flake ([`flake.nix`](flake.nix)) via `direnv` — Bun + Node 24

---

## Structure

```
apps/api/src/
├── index.ts              # Bun.serve; ContextVariableMap (requestId, wideEvent, user, session)
├── app.ts                # createApp(); mount routes; .onError(onError); export type AppType
├── config/env.ts         # Zod-validated Bun.env (API_PORT, DATABASE_URL, …)
├── db/
│   ├── client.ts
│   └── schema/           # auth + domain tables (regenerate auth via auth:generate)
├── lib/
│   ├── auth.ts           # betterAuth + getSafeSession
│   ├── error.ts          # AppError + onError handler
│   ├── error-codes.ts    # ERROR_CODES constants
│   ├── logger.ts         # Pino singleton
│   └── validator.ts      # Zod validator wrapper (throws AppError)
├── middleware/
│   ├── auth.ts           # Session middleware
│   ├── cors.ts
│   └── logger.ts         # Wide-event logging (one log line per /api/* request)
├── routes/               # me, wallets (factory per route group)
└── __tests__/            # Vitest suites + helpers (assertions, auth, app, db, mock)

apps/web/src/
├── components/ui/        # shadcn/ui primitives
├── components/           # App chrome (navbar, sidebar, layout)
├── features/{feature}/
│   ├── components/
│   ├── pages/
│   └── data/
│       ├── *.schemas.ts  # Zod 4 schemas
│       ├── *.services.ts # Dexie / domain logic (canonical today)
│       ├── *.queries.ts
│       └── *.mutations.ts
├── routes/               # e.g. _app/(wallets)/wallets.index.route.tsx
├── libs/
│   ├── db.lib.ts         # Dexie KagetDB
│   ├── api.lib.ts        # hc<AppType>(VITE_API_URL)
│   └── utils.lib.ts
├── hooks/
├── workers/
└── utils/
```

There is **no** `packages/` directory yet. Web consumes `@kaget/api` as a workspace package for `AppType` and the Hono client ([`apps/web/src/libs/api.lib.ts`](apps/web/src/libs/api.lib.ts)).

---

## Core Rules

### Data architecture (important)

- **Client-side domain data** (wallets, budgets, records, transfers, settings) lives in **Dexie** via [`apps/web/src/libs/db.lib.ts`](apps/web/src/libs/db.lib.ts).
- Feature `*.services.ts` files read/write Dexie — they are the main persistence layer for the PWA today.
- **`apps/api`** holds PostgreSQL + better-auth. Do not assume server CRUD for domain entities unless you add it.
- When adding server persistence, document sync strategy in an ADR.

### Backend (`apps/api`)

- **Runtime:** Bun only — `Bun.serve({ port: env.API_PORT, fetch: app.fetch })`. No `@hono/node-server`.
- **Env:** Validate with Zod in `config/env.ts` from `Bun.env`. Update [`.env.example`](.env.example) for every new variable. Port is **`API_PORT`**, not `PORT`.
- **App factory:** Register routes on explicit paths in `app.ts`, e.g. `.route('/api/wallets', createWalletRoutes(db, auth))`. Sub-routers use `/` internally. Mount `.onError(onError)` from `lib/error.ts`.
- **Auth:** `better-auth` with `drizzleAdapter`; mount `auth.handler` on `/api/auth/*`. Protected handlers use `getSafeSession(c)` — throws `AppError` with `ERROR_CODES.AUTH.UNAUTHORIZED` when unauthenticated.
- **Errors:** Throw `AppError(status, ERROR_CODES.DOMAIN.CODE, message, details?)` — do not `return c.json({ error: ... }, status)`. Add codes in `lib/error-codes.ts`. Global `onError` returns `{ error: { code, message, details? } }` and enriches `wideEvent.error`.
- **Validation:** Use `validator('json' | 'param' | 'query', schema)` from `lib/validator.ts` — not raw `zValidator`. Validation failures throw `AppError` with `VALIDATION_INVALID_INPUT` and field-level `details`.
- **Responses:** Success `{ data: T }` (200/201). Errors handled by `onError` — see [API Route Handlers](docs/developer-guide/api-route-handlers.md).
- **Logging:** Handlers annotate `c.get('wideEvent')` with nested domain keys on success only (e.g. `wideEvent.wallet = { id, count }`). Do not wrap handlers in try/catch for logging — `onError` sets `wideEvent.outcome` and `wideEvent.error`.
- **DB:** Prefer `db:migrate` for committed changes; `db:push` for local dev only. Commit files under `migrations/`.
- **Build:** `bun run build` compiles a standalone binary at `dist/kaget-api`; run with `bun run start`.
- **Style:** Double quotes and semicolons match current API source — follow existing files in `apps/api`.

### Root `.env` for API CLI (`auth:*`, `db:*`)

Package scripts do **not** load `.env`. [`drizzle.config.ts`](apps/api/drizzle.config.ts) uses `loadEnv()` → needs root `.env` in `Bun.env`.

| Current directory | Example |
|-------------------|---------|
| `apps/api` | `bun --env-file=../../.env run db:migrate` |
| Repository root | `bun run --env-file=.env --filter @kaget/api db:migrate` |

Same pattern for `auth:generate`, `db:push`, `db:generate`, `db:studio`. Full table: [`apps/api/README.md`](apps/api/README.md#running-auth-and-db).

### Frontend (`apps/web`)

- **Routing:** Files under `src/routes/` named `*.route.tsx` (no `~` prefix). Example:

  ```ts
  export const Route = createFileRoute("/_app/(wallets)/wallets/")({
    component: WalletsIndexPage,
  });
  ```

  Run `bun run gen:routes` after adding or renaming route files if types break.

- **Pages vs routes:** Keep route files thin; UI in `features/{feature}/pages/`.
- **Data:** TanStack Query in `*.queries.ts` / `*.mutations.ts`; Dexie in `*.services.ts` only.
- **API HTTP:** Use `api` from `@/libs/api.lib` — do not use raw `fetch` for typed API routes.
- **Validation:** Zod 4 in `*.schemas.ts` (note Zod 4 API differences vs Zod 3).
- **Imports:** `@/` → `apps/web/src/*`; `@kaget/api` for `AppType`.
- **UI:** shadcn in `components/ui/`; toast via **sonner**; icons from `lucide-react`.
- **Tailwind v4:** Configured via `@tailwindcss/vite` in [`apps/web/vite.config.ts`](apps/web/vite.config.ts) and [`apps/web/src/index.css`](apps/web/src/index.css).

### Biome (JS/TS)

- Single config: root [`biome.json`](biome.json) (Biome **2.4.16**).
- **`files.includes`** covers `apps/web/**/*`, `apps/api/**/*`, and `packages/**/*` (see root [`biome.json`](biome.json)). Do not add per-app Biome installs.
- Root scripts:
  - `bun run check` — `biome check .`
  - `bun run lint` — `biome lint`
  - `bun run format` — `biome check --write .`
- Tailwind: `css.parser.tailwindDirectives` + `noUnknownAtRules` ignore for `@tailwind`.
- `useSortedClasses` is enabled for `cn`, `clsx`, `cva`, etc.

### Git hooks

- [`lefthook.yml`](lefthook.yml): parallel pre-commit runs `bun biome check --write` on staged files; commit-msg runs `bun commitlint`.
- Conventional Commits; scopes in [`commitlint.config.js`](commitlint.config.js).

### Turborepo

- [`turbo.json`](turbo.json): `dev`, `build`, `check-types`, `db:*` tasks. Use `bunx turbo <task> --filter @kaget/web` to target one app.
- Biome is **not** a Turbo `lint` task — run root `bun run check` / `lint` instead.

---

## Key Patterns

### Adding a frontend feature (Dexie-backed)

1. Zod schemas in `features/{feature}/data/{feature}.schemas.ts`
2. Dexie logic in `features/{feature}/data/{feature}.services.ts`
3. `queryOptions` + hooks in `*.queries.ts` / `*.mutations.ts`
4. UI in `features/{feature}/components/` and `pages/`
5. Route file under `src/routes/…/*.route.tsx` → `bun run gen:routes`
6. Document in `docs/developer-guide/features/{feature}/` when non-trivial

### Adding an API route

Reference: [`apps/api/src/routes/wallets.ts`](apps/api/src/routes/wallets.ts) and [API Route Handlers](docs/developer-guide/api-route-handlers.md).

1. Add `apps/api/src/routes/{name}.ts` returning a `Hono` sub-app via `create{Name}Routes(deps)`
2. Use `getSafeSession(c)` for authenticated handlers
3. Use `validator('json', schema)` for validated inputs
4. Throw `AppError` for domain errors; add codes to `lib/error-codes.ts` if needed
5. Return `{ data: ... }` on success; annotate `wideEvent` with nested domain keys
6. Register in `createApp()` with `.route('/api/...', createXRoutes(...))`
7. Keep `export type AppType = ReturnType<typeof createApp>` in `app.ts`
8. Add integration tests using `expectSuccess` / `expectError` — see [API Testing](docs/developer-guide/testing.md)
9. Update [`apps/api/README.md`](apps/api/README.md) if the public contract changes

### Drizzle + better-auth

```ts
// apps/api/src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

export function createAuth(db: Database, env: Env) {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    emailAndPassword: { enabled: true },
    trustedOrigins: env.CORS_ORIGINS,
  })
}
```

After auth config changes:

```bash
cd apps/api
bun --env-file=../../.env run auth:generate
bun --env-file=../../.env run db:generate
bun --env-file=../../.env run db:migrate
```

### Frontend query hook pattern

```ts
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getWalletList } from "./wallets.services";

export const WALLETS_QUERY_KEY = "wallets";

export const walletsQueryOptions = (req = {}) =>
  queryOptions({
    queryKey: [WALLETS_QUERY_KEY, req],
    queryFn: () => getWalletList(req),
  });

export const useWalletsQuery = (req = {}) => useQuery(walletsQueryOptions(req));
```

### Testing (`apps/api`)

Integration tests use **PGlite** (in-process Postgres), **better-auth testUtils**, **Hono testClient**, and assertion helpers:

- **Database**: `setupTestDatabase()` creates PGlite, runs migrations, cleans up in `afterAll()`
- **Auth**: `createTestAuth(db)` returns test-only `betterAuth` with `testUtils`; use `getTestAuthHeaders(test, userId)` for plain header objects
- **Routes**: `createTestApp(db, auth)` wraps `createApp`; pass to `testClient()` for typed RPC
- **Assertions**: `expectSuccess(res, status)` and `expectError(res, ERROR_CODES.X, status)` — import codes from `lib/error-codes.ts`
- **Requests**: `client.api.{route}.$method({ ... }, { headers: authHeaders })`

Full details in [docs/developer-guide/testing.md](docs/developer-guide/testing.md). Reference: [`apps/api/src/__tests__/wallets.test.ts`](apps/api/src/__tests__/wallets.test.ts).

```ts
const testDatabase = await setupTestDatabase()
const { auth, test } = await createTestAuth(testDatabase.db)
const user = test.createUser({ email: 'test@example.com' })
await test.saveUser(user)
const authHeaders = await getTestAuthHeaders(test, user.id)
const client = testClient(createTestApp(testDatabase.db, auth))

const res = await client.api.wallets.$post(
  { json: { name: 'My Wallet', type: 'DIGITAL' } },
  { headers: authHeaders },
)
const { data } = await expectSuccess(res, 201)
expect(data).toMatchObject({ name: 'My Wallet', type: 'DIGITAL' })

await expectError(res, ERROR_CODES.WALLET.NOT_FOUND, 404)
```

---

## Commands

```bash
bun install

# Development
bun run dev
docker compose up -d db

cd apps/web && bun run dev
cd apps/api && bun run dev

# Quality (repo root — Biome)
bun run check
bun run lint
bun run format
bunx turbo check-types
bun run build

# API database (root .env via --env-file; see apps/api/README.md)
cd apps/api
bun run test
bun --env-file=../../.env run auth:generate
bun --env-file=../../.env run db:push          # dev only
bun --env-file=../../.env run db:generate
bun --env-file=../../.env run db:migrate

# From repository root:
# bun run --env-file=.env --filter @kaget/api db:migrate

# Web routes
cd apps/web && bun run gen:routes

# Docker
docker compose up --build
```

---

## Environment Variables

Root [`.env.example`](.env.example):

| Variable | Used by |
|----------|---------|
| `API_PORT` | API (`Bun.serve` port) |
| `VITE_API_URL` | Web Hono client |
| `VITE_APP_URL` | Web origin (CORS / redirects) |
| `DATABASE_URL` | API / Drizzle |
| `BETTER_AUTH_SECRET` | better-auth |
| `BETTER_AUTH_URL` | better-auth |
| `CORS_ORIGINS` | API CORS |
| `POSTGRES_*` | Docker Compose `db` service |

Never commit `.env`.

---

## Documentation

- [`docs/user-guide/`](docs/user-guide/)
- [`docs/developer-guide/`](docs/developer-guide/) + [ADRs](docs/developer-guide/adr/README.md)
- [API Route Handlers](docs/developer-guide/api-route-handlers.md) — error handling, validation, wide-event logging
- [API Testing](docs/developer-guide/testing.md) — PGlite, testClient, assertion helpers
- [ADR-004](docs/developer-guide/adr/004-tooling-stack-migration.md) — tooling migration and follow-up refinements

---

## Critical Don'ts

1. Use **Bun** only (`bun install`, `bun run`, `bunx`) — not pnpm/npm for this repo.
2. Do not add ESLint or Prettier — **Biome** at repo root.
3. Do not add Husky — **Lefthook** only.
4. Do not put domain budgeting logic in the API without an explicit decision — **Dexie is canonical** today.
5. Do not bypass `*.services.ts` for Dexie access from components.
6. Do not use `@hono/node-server` — **Bun.serve** only.
7. Do not run `auth:*` or `db:*` without `--env-file` pointing at the repo-root `.env` (unless vars are already in the shell).
8. Do not change Drizzle/better-auth schema without `auth:generate` / migrations as appropriate.
9. Do not break `AppType` in `apps/api/src/app.ts`.
10. Do not hardcode URLs — use `VITE_API_URL`, `API_PORT`, validated env.
11. Do not commit `.env`.
12. Do not edit `apps/web/src/__generated__/routeTree.ts` manually.
13. Do not add per-app Biome dependencies.
14. Do not use old route file conventions (`~` prefixes) — use current `src/routes/**/*.route.tsx` layout.
15. Do not return inline error JSON from API handlers — throw `AppError` with an `ERROR_CODES` entry.
16. Do not use raw `zValidator` in API routes — use `validator()` from `lib/validator.ts`.
17. Do not wrap API handlers in try/catch for logging — `onError` and logger middleware handle errors and wide events.

---

## Follow-ups

- Wire web UI to **better-auth** client with credentialed `hc` requests
- Sync or migrate domain data from Dexie to PostgreSQL
- Re-enable E2E CI (Playwright) when the workflow is turned back on

When touching auth, sync, or tooling, read ADRs and add a new ADR for significant decisions.
