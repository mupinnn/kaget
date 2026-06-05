# AGENTS.md

System prompt for LLM agents (Cursor, Copilot, Claude, etc.) working on **KaGet (Kawan Budget)**.

---

## Stack

**Frontend** (`apps/web`): React 18, TypeScript, Vite, TanStack Router/Query, Dexie (IndexedDB), Tailwind CSS, shadcn/ui, PWA

**Backend** (`apps/api`): Bun, Hono, better-auth, Drizzle ORM, PostgreSQL, Zod

**Monorepo**: Bun workspaces, Turborepo, Biome (root), Lefthook, commitlint

**Cross-app typing**: Hono RPC client — `AppType` exported from `@kaget/api` (`apps/api/src/app.ts`)

---

## Structure

```
apps/api/src/
├── index.ts              # Bun.serve entry, wires env → db → auth → app
├── app.ts                # Hono app composition; export type AppType
├── config/env.ts         # Zod-validated process.env
├── db/
│   ├── client.ts         # drizzle(postgres) singleton
│   └── schema/           # Drizzle tables (auth today)
├── lib/auth.ts           # betterAuth + drizzleAdapter
├── routes/               # health, hello, me
└── middleware/cors.ts    # credentials + origin whitelist

apps/web/src/
├── components/ui/        # shadcn/ui primitives
├── components/           # Shared app chrome (navbar, sidebar, layout)
├── features/{feature}/
│   ├── components/       # Feature UI
│   ├── pages/            # Route-facing page components
│   └── data/
│       ├── *.schemas.ts  # Zod schemas (validation shapes)
│       ├── *.services.ts # Dexie / business logic (primary data layer)
│       ├── *.queries.ts  # TanStack Query hooks + queryOptions
│       └── *.mutations.ts
├── routes/               # TanStack file routes (~*.route.tsx)
├── libs/
│   ├── db.lib.ts         # Dexie KagetDB — wallets, budgets, records, …
│   ├── api.lib.ts        # hc<AppType>(VITE_API_URL) — API/auth only for now
│   └── utils.lib.ts
├── hooks/                # Shared React hooks
├── workers/              # Web workers (import/export)
└── utils/                # service.util (successResponse), dates, errors
```

There is **no** `packages/` shared library yet. Web depends on `@kaget/api` via Bun workspace for types and the Hono client only.

---

## Core Rules

### Data architecture (important)

- **Client-side domain data** (wallets, budgets, records, transfers, settings) lives in **Dexie** via `apps/web/src/libs/db.lib.ts`.
- Feature `*.services.ts` files read/write Dexie — they are the main persistence layer for the PWA today.
- **`apps/api`** holds PostgreSQL + better-auth boilerplate. Do not assume server APIs exist for domain CRUD unless you add them.
- When adding server persistence later, keep Dexie/API boundaries explicit and document sync in an ADR.

### Backend (`apps/api`)

- **Runtime:** Bun only — use `Bun.serve({ fetch: app.fetch })`, not `@hono/node-server`.
- **App factory:** Compose routes in `createApp()` in `app.ts`; export `export type AppType = ReturnType<typeof createApp>` for the web client.
- **Env:** Add variables to `config/env.ts` (Zod) and `.env.example`; never read secrets without validation.
- **Auth:** Mount `auth.handler` on `/api/auth/*`; use `auth.api.getSession` for session routes (see `routes/me.ts`).
- **DB:** All schema changes need Drizzle migrations (`bun run db:generate`, `bun run db:migrate` in `apps/api`).
- **CORS:** Use `createCorsMiddleware` with `credentials: true` when the web app will send cookies.
- **Naming:** `kebab-case` files, `camelCase` functions, `PascalCase` types/classes.

### Frontend (`apps/web`)

- **Routing:** File routes under `src/routes/` with `createFileRoute`. Route IDs match generated `routeTree` (e.g. `/_app/(wallets)/wallets/$walletId`) — run `bun run gen:routes` after route file changes if types drift.
- **Pages vs routes:** Route files stay thin; page UI lives in `features/{feature}/pages/`.
- **Data fetching:** Use TanStack Query in `*.queries.ts` / `*.mutations.ts`; call `*.services.ts` inside `queryFn` / `mutationFn`.
- **Dexie access:** Only through `*.services.ts` (or `db.lib.ts` helpers), not directly from components.
- **API client:** Use `api` from `@/libs/api.lib` for HTTP — typed Hono RPC. Do not use raw `fetch` for API routes unless extending the client pattern.
- **Validation:** Zod schemas in `*.schemas.ts`; services validate with `.parse` / `.safeParse` where appropriate.
- **Imports:** `@/` → `apps/web/src/*`; `@kaget/api` for `AppType` and shared API types.
- **Naming:** `kebab-case` filenames, `PascalCase` components, `camelCase` functions/hooks.
- **Icons:** [lucide-react](https://lucide-react.dev)
- **UI:** Prefer shadcn components in `components/ui/`; add via `bun run ui:add` from `apps/web`.

#### TanStack Query style

Prefer destructuring after the hook call is fine; for multi-field usage, `const walletsQuery = useWalletsQuery()` then `walletsQuery.data`, `walletsQuery.isLoading` is acceptable.

#### Formatting

- Prefer `Boolean(value)` over `!!value` for boolean checks.
- Avoid obvious line-by-line comments; explain non-obvious domain rules only.

### Biome (JS/TS)

- Config lives at **root** [`biome.json`](biome.json) — shared by all apps.
- Do **not** add per-app Biome packages; apps run `biome check .` from their directory.
- Tailwind `@apply` / `@tailwind` are enabled via `css.parser.tailwindDirectives`.
- Run `bun run format` at root or `bun run lint` via Turborepo before large PRs.

### Git hooks

- **Lefthook** (`lefthook.yml`): Biome on pre-commit (staged files), commitlint on commit-msg.
- **Commit format:** Conventional Commits; allowed scopes include `deps`, `docs`, `components`, `libs`, `utils`, `e2e` (see `commitlint.config.js`).

---

## Key Patterns

### Adding a frontend feature (Dexie-backed)

1. Define Zod schemas in `features/{feature}/data/{feature}.schemas.ts`
2. Implement Dexie logic in `features/{feature}/data/{feature}.services.ts` using `db` from `@/libs/db.lib`
3. Add `queryOptions` + hooks in `*.queries.ts` and `*.mutations.ts`
4. Build UI in `features/{feature}/components/` and `pages/`
5. Add route file `src/routes/~_app/.../~....route.tsx` and run `bun run gen:routes` if route types break
6. Document behavior in `docs/developer-guide/features/{feature}/` when non-trivial

### Adding an API route

1. Create route module in `apps/api/src/routes/`
2. Register in `app.ts` via `.route("/", createXRoutes(...))` or `.on(...)`
3. Export remains `AppType` from `app.ts` — web `hc<AppType>` picks up new routes automatically
4. Add tests or manual check; update `apps/api/README.md` if public contract changes

### Drizzle + better-auth

```ts
// apps/api/src/lib/auth.ts — pattern
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export function createAuth(db: Database, env: Env) {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    trustedOrigins: env.CORS_ORIGINS,
  });
}
```

### Frontend query hook pattern

```ts
// features/wallets/data/wallets.queries.ts
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

### Service layer pattern (Dexie)

```ts
// features/wallets/data/wallets.services.ts
import { db } from "@/libs/db.lib";
import { successResponse } from "@/utils/service.util";
import { WalletSchema } from "./wallets.schemas";

export async function getWalletList(req: WalletsRequestQuery) {
  const wallets = await db.wallet.toArray();
  return successResponse(wallets.map(w => WalletSchema.parse(w)), req);
}
```

Use `successResponse` / patterns in `@/utils/service.util` for consistent list responses.

---

## Commands

```bash
# Install + hooks
bun install

# Development (from repo root)
bun run dev                    # turbo: web + api
docker compose up -d db          # PostgreSQL only

# Per-app
cd apps/web && bun run dev
cd apps/api && bun run dev

# Quality
bun run lint                     # all packages
bun run format                   # biome check --write .
bun run build

# API database
cd apps/api
bun run db:generate
bun run db:migrate

# Web routes
cd apps/web
bun run gen:routes

# Docker (API + DB)
docker compose up --build
```

---

## Environment Variables

Root [`.env.example`](.env.example) — copy to `.env`:

| Variable | Used by |
|----------|---------|
| `DATABASE_URL` | API / Drizzle |
| `BETTER_AUTH_SECRET` | API / better-auth |
| `BETTER_AUTH_URL` | API / better-auth |
| `PORT` | API |
| `CORS_ORIGINS` | API CORS |
| `VITE_API_URL` | Web (Vite client) |

Never commit `.env`. Update `.env.example` when adding required variables.

---

## Documentation

- User-facing: [`docs/user-guide/`](docs/user-guide/)
- Engineering: [`docs/developer-guide/`](docs/developer-guide/) and [ADRs](docs/developer-guide/adr/README.md)
- Tooling decisions: [ADR-004](docs/developer-guide/adr/004-tooling-stack-migration.md)

---

## Critical Don'ts

1. Do not use `pnpm` or `npm` for this repo — use **Bun** (`bun install`, `bun run`, `bunx`).
2. Do not add ESLint or Prettier — **Biome** is the single JS/TS linter/formatter at the repo root.
3. Do not add Husky — **Lefthook** manages Git hooks.
4. Do not put domain budgeting logic in the API without an explicit product decision and migration plan — **Dexie is canonical** for wallets/budgets/records today.
5. Do not bypass `*.services.ts` with ad-hoc Dexie calls from React components.
6. Do not use `@hono/node-server` on the API — **Bun.serve** only.
7. Do not change Drizzle schema without generating and committing a migration.
8. Do not break `AppType` export from `apps/api/src/app.ts` — the web client depends on it.
9. Do not hardcode API URLs — use `VITE_API_URL` and validated server env in `config/env.ts`.
10. Do not commit `.env` or secrets.
11. Do not edit `apps/web/src/__generated__/routeTree.ts` manually — regenerate with `gen:routes`.
12. Do not edit the plan file in `.cursor/plans/` when implementing tasks unless the user asks.

---

## Follow-ups (not yet implemented)

- Wire web auth UI to **better-auth** client with credentialed `hc` requests
- Sync or migrate domain data from Dexie to PostgreSQL
- Enable E2E workflow (Playwright job is currently disabled in CI)

When touching auth or sync, read existing ADRs and add a new ADR for significant architecture changes.
