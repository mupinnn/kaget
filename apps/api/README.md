# @kaget/api

Hono API on Bun with PostgreSQL, Drizzle ORM, and [better-auth](https://www.better-auth.com). Exports `AppType` for the typed Hono RPC client in `@kaget/web`.

Postgres holds **auth/session tables** and the **Drive ledger `fileId` pointer** only. Financial ledger entities (wallets, budgets, records, transfers, debts/loans, settings) live in the web app’s Dexie store and optionally as an opaque JSON file on Google Drive — see [ADR-007](../../docs/developer-guide/adr/007-local-first-drive-custodian-boundary.md).

## Prerequisites

- [Bun](https://bun.sh/) **1.3.3+** (see root `packageManager` in [`package.json`](../../package.json))
- PostgreSQL 16 (local or via root [`docker-compose.yml`](../../docker-compose.yml))
- Root [`.env`](../../.env.example) (copy from `.env.example`)

The API reads configuration from `Bun.env` ([`src/config/env.ts`](src/config/env.ts)). There is no `.env` inside `apps/api/` — you must pass the repo-root file with `--env-file` when running `auth:*` and `db:*` (see below).

## Quick start

From the **repository root**:

```bash
cp .env.example .env
bun install
docker compose up -d db
cd apps/api
bun --env-file=../../.env run db:migrate
bun run dev
```

Default URL: `http://localhost:3000` (or the port set in `API_PORT`).

From the **repository root** without `cd`:

```bash
bunx turbo dev --filter @kaget/api
bun run --env-file=.env --filter @kaget/api db:migrate
```

## Running `auth:*` and `db:*`

Scripts in [`package.json`](package.json) do **not** load `.env` for you. [`drizzle.config.ts`](drizzle.config.ts) calls `loadEnv()`, which needs `DATABASE_URL`, `BETTER_AUTH_*`, and related vars in `Bun.env`.

Pass `--env-file` using a path **relative to your current working directory**:

| Current directory | Example (`auth:generate`) |
|-------------------|---------------------------|
| `apps/api` | `bun --env-file=../../.env run auth:generate` |
| Repository root | `bun run --env-file=.env --filter @kaget/api auth:generate` |

Use the same pattern for `db:push`, `db:generate`, `db:migrate`, and `db:studio`:

```bash
# cwd: apps/api
bun --env-file=../../.env run db:migrate
bun --env-file=../../.env run auth:generate
bun --env-file=../../.env run db:generate

# cwd: repository root
bun run --env-file=.env --filter @kaget/api db:migrate
bun run --env-file=.env --filter @kaget/api auth:generate
```

Plain `bun run db:migrate` from `apps/api` without `--env-file` only works if those variables are already exported in your shell.

## Scripts

| Script | Description |
|--------|-------------|
| `dev` | Dev server (`bun --watch src/index.ts`) |
| `build` | `tsc` + compile standalone binary → `dist/kaget-api` |
| `start` | Run `dist/kaget-api` (after `build`) |
| `check-types` | `tsc --noEmit` |
| `auth:generate` | Regenerate `src/db/schema/auth.ts` (better-auth CLI; use with `--env-file`, see above) |
| `db:push` | Push schema to DB (local dev; no migration file) |
| `db:generate` | Generate SQL migration from schema changes |
| `db:migrate` | Apply pending migrations |
| `db:studio` | Open Drizzle Studio |
| `test` | Run Vitest integration tests |
| `test:watch` | Vitest watch mode |

Production-style local run:

```bash
bun run build
bun run start
```

## Environment variables

Set these in the **root** `.env` (see [`.env.example`](../../.env.example)).

| Variable | Required | Description |
|----------|----------|-------------|
| `API_PORT` | No (default `3000`) | HTTP listen port (`Bun.serve`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Secret key (min 32 characters) |
| `BETTER_AUTH_URL` | Yes | Public API base URL (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID (Drive `drive.file` scopes requested at sign-in) |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `CORS_ORIGINS` | No | Comma-separated browser origins (default `http://localhost:5173`) |

Related root-only variables used by Docker Compose and the web app:

| Variable | Used for |
|----------|----------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `db` service in Compose |
| `VITE_API_URL` | Web Hono client (`@kaget/web`) |

## Project layout

```
apps/api/
├── src/
│   ├── index.ts              # Entry: env → db → auth → Bun.serve
│   ├── app.ts                # Hono app; export type AppType
│   ├── config/env.ts         # Zod validation (Bun.env)
│   ├── db/                   # Drizzle client + schema (auth + drive_ledger_file)
│   ├── lib/
│   │   ├── auth.ts           # betterAuth + getSafeSession
│   │   ├── drive/            # Drive port, Google adapter, memory fake
│   │   ├── error.ts          # AppError + onError handler
│   │   ├── error-codes.ts    # ERROR_CODES constants
│   │   ├── logger.ts         # Pino singleton
│   │   └── validator.ts      # Zod validator wrapper
│   ├── middleware/
│   │   ├── auth.ts           # Session middleware
│   │   ├── cors.ts
│   │   └── logger.ts         # Wide-event logging
│   ├── routes/
│   │   ├── me.ts
│   │   └── drive-ledger.ts   # Opaque Drive ledger broker + fileId pointer
│   └── __tests__/            # Vitest suites + helpers
├── migrations/               # Drizzle SQL (committed)
├── drizzle.config.ts
├── Dockerfile
└── docker-entrypoint.sh      # db:migrate then exec CMD
```

Routes are mounted in [`src/app.ts`](src/app.ts) on explicit paths (e.g. `.route('/api/drive/ledger', createDriveLedgerRoutes(...))`). See [API Route Handlers](../../docs/developer-guide/api-route-handlers.md) for handler conventions.

## Database workflow

**Schema** is auth tables (from better-auth) plus `drive_ledger_file`. Always import tables in [`src/db/schema/index.ts`](src/db/schema/index.ts) so Drizzle Kit picks them up.

```bash
bun --env-file=../../.env run auth:generate
bun --env-file=../../.env run db:generate
bun --env-file=../../.env run db:migrate
```

**Local iteration** (no migration file):

```bash
bun --env-file=../../.env run db:push
```

**Committed changes**:

```bash
bun --env-file=../../.env run db:generate
bun --env-file=../../.env run db:migrate
```

### Migration squash / local DB wipe

Domain ledger tables were removed and migration history was squashed to a single baseline (`0000_*.sql`) covering auth + `drive_ledger_file` only. **Local and Docker Postgres databases that still have the old domain tables / journal must be wiped and recreated** (e.g. `docker compose down -v` then `up -d db`, then `db:migrate`). Do not try to migrate forward from the pre-squash journal.

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/me` | Current user (requires session) |
| POST | `/api/drive/ledger/ensure` | Create-or-open `KaGet/kaget-ledger.json`; persist `fileId` pointer |
| GET | `/api/drive/ledger` | Download opaque JSON `{ content }` for the bound file |
| PUT | `/api/drive/ledger` | Upload opaque JSON `{ content }` to the bound file |
| DELETE | `/api/drive/ledger` | Clear Postgres `fileId` pointer only (Drive file kept) |
| GET, POST | `/api/auth/*` | better-auth handlers |

There is **no** server CRUD for wallets, budgets, records, transfers, debts/loans, or settings.

Protected routes return `{ data: ... }` on success and `{ error: { code, message, details? } }` on failure (except `/api/me`, which returns `{ user }`). See [API Route Handlers](../../docs/developer-guide/api-route-handlers.md).

CORS is applied under `/api/*` with credentials support for cookie-based web auth.

## Workspace typing (`@kaget/web`)

[`package.json`](package.json) sets `"types": "./src/app.ts"`. The web app imports:

```ts
import type { AppType } from "@kaget/api";
import { hc } from "hono/client";

export const api = hc<AppType>(import.meta.env.VITE_API_URL);
```

After changing routes in `app.ts`, run `bun run check-types` in this package (or `bunx turbo check-types` from the root).

## Docker

From the **repository root** (Compose loads root `.env` via `env_file`):

```bash
docker compose up -d db      # PostgreSQL only
docker compose up --build    # API + PostgreSQL
```

- **`db`** — Postgres 16, port `127.0.0.1:5432`, credentials from `POSTGRES_*`
- **`api`** — port `127.0.0.1:${API_PORT}:${API_PORT}`, environment from `env_file: .env` (no `../../.env` path in the container)
- **Entrypoint** — runs `bun run db:migrate`, then `bun run start` (variables already set by Compose)

The [`Dockerfile`](Dockerfile) is a multi-stage Bun build: install workspace deps, `bun run build` (compiled `dist/kaget-api`), then run with migrations.

> **Build context:** The Dockerfile copies the root `package.json`, `bun.lock`, and workspace packages. If `docker compose` fails to build, set the API service build `context` to the **repository root** (`.`) and `dockerfile: apps/api/Dockerfile`, or build manually:
>
> ```bash
> docker build -f apps/api/Dockerfile -t kaget-api .
> ```

## Related docs

- [Root README](../../README.md) — monorepo setup and tooling
- [AGENTS.md](../../AGENTS.md) — conventions for API and full-stack work
- [API Route Handlers](../../docs/developer-guide/api-route-handlers.md) — error handling, validation, logging
- [API Testing](../../docs/developer-guide/testing.md) — PGlite, testClient, assertion helpers
- [ADR-004](../../docs/developer-guide/adr/004-tooling-stack-migration.md) — Bun, Biome, Lefthook migration notes
- [ADR-007](../../docs/developer-guide/adr/007-local-first-drive-custodian-boundary.md) — local-first custodian boundary
