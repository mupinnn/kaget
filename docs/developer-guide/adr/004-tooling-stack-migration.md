# ADR-004: Tooling Stack Migration (Bun, Biome, Lefthook)

## Status

Accepted

## Context

The monorepo used pnpm, Husky, lint-staged, Prettier, and per-app ESLint flat configs. The API layer is being expanded with PostgreSQL and authentication, requiring a consistent developer experience and a Bun-native runtime for the API.

## Decision

- **Package manager / runtime:** Bun workspaces for the entire monorepo; API served via `Bun.serve`.
- **Linting and formatting:** Biome replaces ESLint and Prettier.
- **Git hooks:** Lefthook replaces Husky and lint-staged.
- **Commit messages:** commitlint remains unchanged.

## Consequences

### Positive

- Single tool (Biome) for format and lint reduces configuration surface.
- Bun improves API dev startup and aligns runtime with Docker images (`oven/bun`).
- Lefthook runs hooks without Husky’s Node hook shim.

### Tradeoffs

- Web no longer uses `@tanstack/eslint-plugin-query`, `eslint-plugin-react-refresh`, or Prettier’s Tailwind class sorting plugin. Biome’s `useSortedClasses` nursery rule provides partial Tailwind ordering.
- Contributors must install Bun instead of pnpm.
- devenv provides `pkgs.bun` instead of Node + pnpm; Playwright remains available for E2E.

## References

- [Biome](https://biomejs.dev/)
- [Lefthook](https://github.com/evilmartians/lefthook)
- [Bun](https://bun.sh/docs)
