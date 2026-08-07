# AGENTS.md

System prompt for LLM agents working on **KaGet (Kawan Budget)**.

## Stack

- **Web** (`apps/web`): React 19, TypeScript 6, Vite 8, TanStack Router/Query, Dexie, Tailwind v4, shadcn/ui, sonner, PWA
- **API** (`apps/api`): Bun, Hono, better-auth, Drizzle, PostgreSQL, Pino (wide events), Zod 4
- **Monorepo**: Bun workspaces + catalog, Turborepo, Biome 2.4 (root), Lefthook, commitlint 21
- **Typing**: `AppType` from `@kaget/api` (`apps/api/src/app.ts`) → `hc<AppType>` in web
- **Optional shell**: Nix flake + direnv — Bun + Node 24

## Data architecture

- **Envelope allocation** — see [`CONTEXT.md`](CONTEXT.md).
- **Working ledger** (wallets, budgets, records, transfers, debts/loans, settings) lives in **Dexie** (`apps/web/src/libs/db.lib.ts`). Domain engine: feature `*.services.ts`.
- **Optional durability**: one versioned JSON on Google Drive — [PRD 001](docs/developer-guide/prd/001-local-first-drive-sync.md), [ADR-007](docs/developer-guide/adr/007-local-first-drive-custodian-boundary.md).
- **`apps/api`**: Google session, OAuth token broker, Drive I/O, `fileId` in Postgres. **No** financial ledger entities. No email/password product login.
- Do not add server CRUD for domain entities without an ADR that supersedes ADR-007.

## Env layout

| File | Owns |
|------|------|
| Root `.env` | `POSTGRES_*` for Compose `db` only |
| `apps/api/.env` | API secrets (`API_PORT`, `DATABASE_URL`, `BETTER_AUTH_*`, `GOOGLE_*`, `CORS_ORIGINS`) |
| `apps/web/.env` | `VITE_API_URL`, `VITE_APP_URL` |

Shared URLs/origins are **duplicated** across apps — keep in sync manually. `auth:*` / `db:*` embed `--env-file=.env` (run `bun run db:migrate` from `apps/api` or `bun run --filter @kaget/api db:migrate`). Details: [`apps/api/README.md`](apps/api/README.md), [ADR-004](docs/developer-guide/adr/004-tooling-stack-migration.md).

## Critical don'ts

1. **Bun only** — `bun install` / `bun run` / `bunx`; not pnpm/npm.
2. **Biome** at repo root — no ESLint, Prettier, or per-app Biome.
3. **Lefthook** only — no Husky.
4. **Dexie is the working ledger** — no domain budgeting logic or ledger persistence in the API ([ADR-007](docs/developer-guide/adr/007-local-first-drive-custodian-boundary.md)).
5. Do not bypass `*.services.ts` for Dexie from components.
6. **`Bun.serve` only** — no `@hono/node-server`.
7. Put new API vars in `apps/api/.env.example`; web vars in `apps/web/.env.example`; Compose `POSTGRES_*` in root `.env.example`. Port is **`API_PORT`**, not `PORT`.
8. Do not change Drizzle/better-auth schema without `auth:generate` / migrations as appropriate.
9. Do not break `AppType` in `apps/api/src/app.ts`.
10. Do not hardcode URLs — use `VITE_*`, `API_PORT`, validated env.
11. Do not commit `.env` files (only `*.env.example`).
12. Do not edit `apps/web/src/__generated__/routeTree.ts` manually.
13. Routes: `src/routes/**/*.route.tsx` (no `~` prefixes); thin routes, UI in `features/*/pages/`.
14. API handlers: throw `AppError` + `ERROR_CODES` — no inline error JSON; use `validator()` from `lib/validator.ts`, not raw `zValidator`; do not try/catch for logging (`onError` + wide events).
15. Prefer `db:migrate` for committed schema changes; `db:push` for local dev only. Schema is auth + `drive_ledger_file` only.

## Where to look

| Topic | Doc |
|-------|-----|
| Domain language | [`CONTEXT.md`](CONTEXT.md) |
| Add Dexie feature | [Features guide](docs/developer-guide/features/README.md) |
| Add API route | [API Route Handlers](docs/developer-guide/api-route-handlers.md), [`drive-ledger.ts`](apps/api/src/routes/drive-ledger.ts) |
| API testing | [Testing](docs/developer-guide/testing.md) |
| Setup / commands | [Root README](README.md), [`apps/api/README.md`](apps/api/README.md) |
| ADRs | [ADR index](docs/developer-guide/adr/README.md) |
| Issues / triage | [`docs/agents/`](docs/agents/) |

When touching auth, sync, or tooling, read ADRs and add a new ADR for significant decisions.
