# KaGet (Kawan Budget)

> KaGet helps you plan spending, track cash flow, and stay on budget — with wallets, budgets, records, and transfers in one offline-first PWA.

## Tech Stack

**Frontend** (`apps/web`)

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) 6
- [Vite](https://vitejs.dev) 8 — build tool and dev server
- [TanStack Router](https://tanstack.com/router) — file-based routing (`src/routes/**/*.route.tsx`)
- [TanStack Query](https://tanstack.com/query) — async state (API integration)
- [Dexie](https://dexie.org) — IndexedDB persistence (primary data store today)
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) — styling and components
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — installable PWA
- [Zod](https://zod.dev) 4 — client-side validation

**Backend** (`apps/api`)

- [Bun](https://bun.sh) — runtime and package manager
- [Hono](https://hono.dev) — API framework
- [better-auth](https://www.better-auth.com) — authentication (email/password)
- [Drizzle ORM](https://orm.drizzle.team) + [PostgreSQL](https://www.postgresql.org) — database layer
- [Zod](https://zod.dev) 4 — env validation

**Monorepo & Tooling**

- [Turborepo](https://turbo.build) — task orchestration (`dev`, `build`, `check-types`, DB tasks)
- [Bun workspaces](https://bun.sh/docs/install/workspaces) + **catalog** — shared dependency versions (`typescript`, `hono`, `zod`, …)
- [Biome](https://biomejs.dev) 2.4 — linter and formatter (root `biome.json`; covers `apps/web`, `apps/api`, and future `packages/*`)
- [Lefthook](https://lefthook.dev) — Git hooks
- [commitlint](https://commitlint.js.org) 21 — commit message linting
- [Nix flake](flake.nix) — optional dev shell (`bun`, Node 24) via `direnv`
- [Docker Compose](docker-compose.yml) — local PostgreSQL and API

**Deployment**

- [Cloudflare Pages](https://pages.cloudflare.com) — frontend static hosting (see `.github/workflows/deploy.yml`)

## Prerequisites

Install [Bun](https://bun.sh) **1.3.3+** (see `packageManager` in [`package.json`](package.json)):

```bash
curl -fsSL https://bun.sh/install | bash
```

You also need [Docker](https://docs.docker.com/get-docker/) (or a local PostgreSQL 16 instance) for API and database development.

Optional: [Nix](https://nixos.org) + [direnv](https://direnv.net) — run `direnv allow` to load the flake dev shell from [`.envrc`](.envrc).

## Getting Started

### Clone the repo

```bash
git clone https://github.com/<your-org>/kaget.git kaget
cd kaget
```

### Install dependencies and set up Git hooks

```bash
bun install
```

`bun install` runs `lefthook install` via the `prepare` script (Biome on pre-commit, commitlint on commit-msg).

### Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your secrets. The example file uses `API_PORT` for the API listen port and builds `VITE_API_URL` / `BETTER_AUTH_URL` from it (see [Environment variables](#environment-variables)).

### Start PostgreSQL and apply migrations

```bash
docker compose up -d db
cd apps/api && bun --env-file=../../.env run db:migrate && cd ../..
```

`auth:*` and `db:*` need the repository-root `.env` via `--env-file` (path depends on your cwd). From the repo root:

```bash
bun run --env-file=.env --filter @kaget/api db:migrate
```

See [apps/api/README.md — Running `auth:*` and `db:*`](apps/api/README.md#running-auth-and-db) for the full table and examples.

For a quick local schema sync during development you can use `bun --env-file=../../.env run db:push` from `apps/api` instead of migrations.

## Running the Project

```bash
# Start web + API (Turborepo TUI)
bun run dev

# Or run apps individually
cd apps/web && bun run dev   # http://localhost:5173
cd apps/api && bun run dev   # http://localhost:3000 (or API_PORT from .env)
```

| Service | URL |
|---------|-----|
| Web (PWA) | http://localhost:5173 |
| API | http://localhost:3000 (default `API_PORT`) |
| API health | http://localhost:3000/api/health |
| better-auth | http://localhost:3000/api/auth/* |

Run API + database in Docker:

```bash
docker compose up --build
```

## Project Structure

```
kaget/
├── apps/
│   ├── web/                      # React PWA (primary product UI)
│   │   ├── src/
│   │   │   ├── features/         # Feature modules (pages, components, data)
│   │   │   ├── routes/           # TanStack file routes (*.route.tsx)
│   │   │   ├── libs/             # db.lib.ts (Dexie), api.lib.ts (Hono client)
│   │   │   ├── components/       # Shared UI (shadcn, layout)
│   │   │   └── workers/          # Web workers (import/export)
│   │   └── package.json
│   └── api/                      # Hono API on Bun
│       ├── src/
│       │   ├── app.ts            # Hono app + AppType export for web RPC client
│       │   ├── config/           # Zod-validated Bun.env
│       │   ├── db/               # Drizzle client + schema (auth)
│       │   ├── lib/              # better-auth setup
│       │   ├── routes/           # health, hello, me
│       │   └── middleware/       # CORS
│       ├── migrations/           # Drizzle SQL migrations
│       ├── drizzle.config.ts
│       └── Dockerfile
├── docs/
│   ├── user-guide/
│   └── developer-guide/          # Feature docs + ADRs
├── biome.json                    # Biome (web + packages)
├── lefthook.yml
├── commitlint.config.js
├── docker-compose.yml
├── flake.nix                     # Nix dev shell
├── turbo.json
└── package.json                  # Bun workspaces root + catalog
```

## Common Tasks

### Whole monorepo (from repo root)

```bash
bun run dev            # web + api (Turbo)
bun run build          # production builds
bun run check          # biome check .
bun run lint           # biome lint
bun run format         # biome check --write .
```

Type-check via Turbo:

```bash
bunx turbo check-types
```

### Frontend (`@kaget/web`)

```bash
cd apps/web
bun run dev              # Dev server (port 5173)
bun run build            # tsc -b && vite build
bun run check-types      # tsc --noEmit
bun run gen:routes       # Regenerate TanStack Router route tree
bun run ui:add           # Add shadcn/ui component (bunx shadcn)
```

### Backend (`@kaget/api`)

```bash
cd apps/api
bun run dev              # Bun watch mode
bun run build            # tsc + compiled binary → dist/kaget-api
bun run start            # Run compiled binary (after build)
bun run check-types      # tsc --noEmit

# auth:* and db:* — pass root .env (cwd: apps/api)
bun --env-file=../../.env run auth:generate
bun --env-file=../../.env run db:migrate
```

From the **repository root**:

```bash
bun run --env-file=.env --filter @kaget/api db:migrate
```

`auth:*` and `db:*` require `--env-file` pointing at the root `.env`. See [apps/api/README.md](apps/api/README.md) for all scripts, auth routes, and Docker.

## Type-Safe API Client

The web app imports `AppType` from the workspace package `@kaget/api` and uses Hono’s RPC client:

```ts
import { hc } from "hono/client";
import type { AppType } from "@kaget/api";

export const api = hc<AppType>(import.meta.env.VITE_API_URL);
```

When you add or change API routes in [`apps/api/src/app.ts`](apps/api/src/app.ts), types flow to the web app via `"types": "./src/app.ts"` on `@kaget/api`. Run `bun run check-types` (or your IDE) after route changes.

**Note:** Budgeting data (wallets, budgets, records, transfers) still lives in **Dexie (IndexedDB)** on the client. The API provides auth and health endpoints; server-side domain sync is a planned follow-up.

## Database Migrations

Auth tables are managed with Drizzle Kit from `apps/api`. Ensure [`.env`](.env.example) exists at the **repository root** (`DATABASE_URL`, `BETTER_AUTH_*`, etc.).

```bash
cd apps/api
bun --env-file=../../.env run auth:generate
bun --env-file=../../.env run db:generate
bun --env-file=../../.env run db:migrate
```

Or from the repository root:

```bash
bun run --env-file=.env --filter @kaget/api db:migrate
```

Details and copy-paste examples for every `db:*` script: [apps/api/README.md](apps/api/README.md#running-auth-and-db).

Docker runs `db:migrate` via [`apps/api/docker-entrypoint.sh`](apps/api/docker-entrypoint.sh) before the server starts.

## Environment Variables

Copy [.env.example](.env.example) to `.env` at the repository root.

| Variable | Description |
|----------|-------------|
| `API_PORT` | API listen port (default `3000`) |
| `VITE_API_URL` | API base URL for the web client (e.g. `http://localhost:3000`) |
| `VITE_APP_URL` | Web app origin (e.g. `http://localhost:5173`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 characters) |
| `BETTER_AUTH_URL` | Public API base URL for better-auth |
| `CORS_ORIGINS` | Comma-separated allowed browser origins |
| `POSTGRES_USER` | Docker Compose Postgres user |
| `POSTGRES_PASSWORD` | Docker Compose Postgres password |
| `POSTGRES_DB` | Docker Compose Postgres database name |

Docker Compose loads `.env` via `env_file` for `db` and `api`. The API reads `Bun.env` through [`apps/api/src/config/env.ts`](apps/api/src/config/env.ts) (Zod-validated).

## Documentation

- [User guide](docs/user-guide/README.md) — wallets, budgets, records, transfers, settings
- [Developer guide](docs/developer-guide/README.md) — feature technical docs and [ADRs](docs/developer-guide/adr/README.md)
- [AGENTS.md](AGENTS.md) — conventions for AI-assisted development

### Product overview

| Area | Summary |
|------|---------|
| **Wallets** | Cash or digital balance containers; cascade delete to related data |
| **Budgets** | Spending plans tied to a wallet; archive when balance is zero |
| **Records** | Income, expense, debt, and loan entries with optional line items |
| **Transfers** | Internal moves between wallets/budgets (immutable, snapshot metadata) |

Details: [docs/user-guide/](docs/user-guide/).

## Contributing

This project uses [Conventional Commits](https://www.conventionalcommits.org) with scopes such as `feat`, `fix`, `docs`, `chore`, and `deps` (see [commitlint.config.js](commitlint.config.js)).

- **Pre-commit:** Lefthook runs `bun biome check --write` on staged files (parallel)
- **Commit-msg:** `bun commitlint` validates the message

For agent-assisted development, see [AGENTS.md](AGENTS.md).

## License

See the repository license file if present; otherwise contact the maintainers.
