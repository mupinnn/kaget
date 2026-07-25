# ADR-004: Tooling Stack Migration (Bun, Biome, Lefthook)

## Status

Accepted (updated 2026-06-02)

## Context

The monorepo previously used pnpm, Husky, lint-staged, Prettier, and per-app ESLint flat configs. The API layer was expanded with PostgreSQL, Drizzle, and better-auth, requiring a Bun-native runtime and a simpler, faster developer toolchain.

A follow-up pass refined the stack: frontend major upgrades, centralized Biome rules, Bun workspace catalogs, API compile output, and Nix-based dev shells.

## Decision

### Initial migration

- **Package manager / runtime:** Bun workspaces for the entire monorepo; API served via `Bun.serve`.
- **Linting and formatting:** Biome replaces ESLint and Prettier.
- **Git hooks:** Lefthook replaces Husky and lint-staged.
- **Commit messages:** commitlint remains (now v21 at repo root).

### Subsequent refinements

| Area | Choice |
|------|--------|
| **Bun workspaces** | Root `workspaces.packages` + `catalog` for shared versions (`typescript` 6, `zod` 4, `hono`, `vitest`, …) |
| **Biome scope** | Root `biome.json` 2.4; **`files.includes` covers `apps/web`, `apps/api`, and `packages/*`** |
| **Root scripts** | `check` (`biome check .`), `lint` (`biome lint`), `format` (`biome check --write .`); no per-app `lint` scripts |
| **Lefthook** | `bun biome check --write` on pre-commit (`parallel: true`); `bun commitlint` on commit-msg |
| **Turborepo** | `check-types`, `db:*` tasks; TUI enabled; `build` depends on `^build` |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), TanStack Router 1.17x, Zod 4, sonner, unified `radix-ui` package |
| **Routes** | File routes under `apps/web/src/routes/**/*.route.tsx` (no `~` filename prefix); paths like `/_app/(wallets)/wallets/` |
| **API env** | `API_PORT` (not `PORT`); validation via `Bun.env` + Zod 4 `z.prettifyError` |
| **API build** | `tsc` + `bun build --compile` → `dist/kaget-api`; `start` runs the binary |
| **API env for CLI** | `auth:*` and `db:*` require manual `--env-file`: `bun --env-file=../../.env run …` from `apps/api`, or `bun run --env-file=.env --filter @kaget/api …` from repo root (not embedded in package scripts) |
| **Auth schema** | `bun run auth:generate` (better-auth CLI) writes `src/db/schema/auth.ts` |
| **DB dev** | `db:push` for local schema sync alongside `db:generate` / `db:migrate` |
| **Dev environment** | `devenv.nix` removed; optional **`flake.nix`** dev shell (`bun`, `nodejs_24`) + `direnv` (`use flake`) |
| **Docker Compose** | `env_file: .env`; Postgres credentials via `POSTGRES_*`; API port via `API_PORT`; build context `apps/api` |

## Consequences

### Positive

- Single formatter/linter for the web app reduces config drift; stricter Biome rules catch unused imports and JSX keys.
- Bun catalog keeps hono/zod/typescript aligned across apps.
- Compiled API binary simplifies deployment artifacts.
- `auth:generate` keeps Drizzle auth tables aligned with better-auth config.
- Nix flake is minimal compared to the previous devenv + Playwright bundle.

### Tradeoffs

- **`auth:*` / `db:*` depend on root `.env`** — pass `--env-file` relative to cwd (`../../.env` in `apps/api`; `bun run --env-file=.env --filter @kaget/api` at repo root); documented in [`apps/api/README.md`](../../apps/api/README.md).
- Web lost ESLint-only rules (`@tanstack/eslint-plugin-query`, `react-refresh`); rely on Biome + TypeScript + tests.
- Tailwind class order uses Biome `useSortedClasses` (not Prettier Tailwind plugin).
- Contributors use Bun instead of pnpm; CI pins Bun via `oven-sh/setup-bun` (align with `packageManager` in root `package.json`).
- Domain data remains in Dexie; tooling migration does not imply server-side budgeting APIs.

## References

- [Biome](https://biomejs.dev/)
- [Lefthook](https://lefthook.dev/)
- [Bun workspaces & catalog](https://bun.sh/docs/install/workspaces)
- [better-auth CLI](https://www.better-auth.com/docs/concepts/cli)
- [ADR index](./README.md)
