# KaGet (Kawan Budget)

> KaGet helps you plan spending, track cash flow, and stay on budget — with wallets, budgets, records, and transfers in one offline-first PWA.

## Tech Stack

**Frontend** (`apps/web`)

- [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev) — build tool and dev server
- [TanStack Router](https://tanstack.com/router) — file-based routing
- [TanStack Query](https://tanstack.com/query) — server/async state (API integration)
- [Dexie](https://dexie.org) — IndexedDB persistence (primary data store today)
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) — styling and components
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — installable PWA

**Backend** (`apps/api`)

- [Bun](https://bun.sh) — runtime and package manager
- [Hono](https://hono.dev) — API framework
- [better-auth](https://www.better-auth.com) — authentication (email/password boilerplate)
- [Drizzle ORM](https://orm.drizzle.team) + [PostgreSQL](https://www.postgresql.org) — database layer
- [Zod](https://zod.dev) — env and request validation

**Monorepo & Tooling**

- [Turborepo](https://turbo.build) — task orchestration (`dev`, `build`, `lint`)
- [Bun workspaces](https://bun.sh/docs/install/workspaces) — JavaScript package manager
- [Biome](https://biomejs.dev) — linter and formatter (root `biome.json`, shared across apps)
- [Lefthook](https://lefthook.dev) — Git hooks
- [commitlint](https://commitlint.js.org) — commit message linting
- [devenv](https://devenv.sh) — optional reproducible dev environment (Bun + Playwright)
- [Docker Compose](https://docs.docker.com/compose/) — local PostgreSQL and API

**Deployment**

- [Cloudflare Pages](https://pages.cloudflare.com) — frontend static hosting (see `.github/workflows/deploy.yml`)

## Prerequisites

Install [Bun](https://bun.sh) 1.3+ (manages dependencies and runs the API):

```bash
curl -fsSL https://bun.sh/install | bash
```

You also need [Docker](https://docs.docker.com/get-docker/) (or a local PostgreSQL 16 instance) for API and database development.

Optional: [devenv](https://devenv.sh) + [direnv](https://direnv.net) for Playwright and pinned tooling via `devenv.nix`.

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

Edit `.env` with your secrets (see [Environment variables](#environment-variables) below).

### Start PostgreSQL and run migrations

```bash
docker compose up -d db
cd apps/api && bun run db:migrate && cd ../..
```

## Running the Project

```bash
# Start web + API (Turborepo)
bun run dev

# Or run apps individually
cd apps/web && bun run dev   # http://localhost:5173
cd apps/api && bun run dev   # http://localhost:3000
```

| Service | URL |
|---------|-----|
| Web (PWA) | http://localhost:5173 |
| API | http://localhost:3000 |
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
│   │   │   ├── routes/           # TanStack file-based routes (~*.route.tsx)
│   │   │   ├── libs/             # db.lib.ts (Dexie), api.lib.ts (Hono client)
│   │   │   ├── components/       # Shared UI (shadcn, layout)
│   │   │   └── workers/          # Web workers (import/export)
│   │   └── package.json
│   └── api/                      # Hono API on Bun
│       ├── src/
│       │   ├── app.ts            # Hono app + AppType export for web RPC client
│       │   ├── config/           # Zod-validated env
│       │   ├── db/               # Drizzle client + schema
│       │   ├── lib/              # better-auth setup
│       │   ├── routes/           # /api/health, /api/me, etc.
│       │   └── middleware/       # CORS
│       ├── migrations/           # Drizzle SQL migrations
│       ├── drizzle.config.ts
│       └── Dockerfile
├── docs/
│   ├── user-guide/               # End-user documentation
│   └── developer-guide/          # Technical docs + ADRs
├── biome.json                    # Shared Biome config (root)
├── lefthook.yml                  # Git hook definitions
├── commitlint.config.js          # Commit message rules
├── docker-compose.yml            # PostgreSQL + API
├── turbo.json
└── package.json                  # Bun workspaces root
```

## Common Tasks

### Frontend (`@kaget/web`)

```bash
cd apps/web
bun run dev              # Dev server (port 5173)
bun run build            # Production build
bun run lint             # Biome check
bun run gen:routes       # Regenerate TanStack Router route tree
bun run ui:add           # Add shadcn/ui component (bunx shadcn)
```

From repo root with Turborepo:

```bash
bun run dev              # web + api
bun run build            # all packages
bun run lint             # all packages
bun run format           # Biome check --write (entire repo)
```

### Backend (`@kaget/api`)

```bash
cd apps/api
bun run dev              # Bun watch mode
bun run build            # tsc → dist/
bun run start            # Run compiled output
bun run lint             # Biome check
bun run db:generate      # Generate migration from schema changes
bun run db:migrate       # Apply migrations
bun run db:studio        # Drizzle Studio
```

See [apps/api/README.md](apps/api/README.md) for auth routes and Docker details.

## Type-Safe API Client

The web app imports `AppType` from `@kaget/api` and uses Hono’s RPC client:

```ts
import { hc } from "hono/client";
import type { AppType } from "@kaget/api";

export const api = hc<AppType>(import.meta.env.VITE_API_URL);
```

When you add or change API routes in `apps/api/src/app.ts`, TypeScript types flow to `apps/web` through the workspace package (`"types": "./src/app.ts"`). Rebuild or rely on IDE checking after route changes.

**Note:** Budgeting data (wallets, budgets, records, transfers) still lives in **Dexie (IndexedDB)** on the client. The API currently provides auth boilerplate and health checks; server-side domain sync is a planned follow-up.

## Database Migrations

Auth tables are managed with Drizzle Kit from `apps/api`:

```bash
cd apps/api

# After changing src/db/schema/
bun run db:generate
bun run db:migrate
```

Migrations run automatically in Docker via `apps/api/docker-entrypoint.sh` before the server starts.

## Environment Variables

Copy [.env.example](.env.example) to `.env` at the repository root.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 characters) |
| `BETTER_AUTH_URL` | Public API base URL (e.g. `http://localhost:3000`) |
| `PORT` | API port (default `3000`) |
| `CORS_ORIGINS` | Comma-separated allowed origins (e.g. `http://localhost:5173`) |
| `VITE_API_URL` | API base URL for the web app (e.g. `http://localhost:3000`) |

Docker Compose reads root `.env` for the `api` and `db` services. The API loads variables at startup via `apps/api/src/config/env.ts` (Zod-validated).

For the web app, set `VITE_API_URL` in `.env` (Vite exposes `VITE_*` variables to the client).

## Documentation

- [User guide](docs/user-guide/README.md) — how to use wallets, budgets, records, transfers, and settings
- [Developer guide](docs/developer-guide/README.md) — feature technical docs and [ADRs](docs/developer-guide/adr/README.md)

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

- **Pre-commit:** Lefthook runs Biome on staged files
- **Commit-msg:** commitlint validates the message

For agent-assisted development conventions, see [AGENTS.md](AGENTS.md).

## License

See the repository license file if present; otherwise contact the maintainers.
