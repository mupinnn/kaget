# ADR-005: Unified Versioning and release-please Release Pipeline

## Status

Accepted (2026-07-22)

## Context

KaGet is a Bun monorepo with two deployable apps (`@kaget/web`, `@kaget/api`). Versioning had drifted: root and web were `0.4.2`, the API was still `0.1.0`, and only the root `package.json` was ever bumped by `release-it`. Tags were a single unified line (`v0.1.0 … v0.4.2`). We want a repeatable release flow that bumps versions by semver, generates a changelog, and only deploys when a new release is cut, while also guarding `main` behind pull requests.

The deploy backend is [parachute](https://github.com/mupinnn/parachute), which treats the whole compose stack as **one commit-pinned Deployment** (ADR-0005 in that repo): every deploy re-tags and recreates all services together. The deploy unit is therefore the repo at a commit, not the individual app.

## Decision

### Unified / lockstep versioning

- One repo version. Root, `@kaget/web`, and `@kaget/api` bump together. The API is brought into line with the root version once (`0.1.0 → 0.4.2`), then never diverges.
- A single `vX.Y.Z` tag line (continuing the existing tags) and one root `CHANGELOG.md`.

### release-please replaces release-it

- **release-please** maintains an open release pull request titled `release: vX.Y.Z` (reusing the `release` type already allowed by [`commitlint.config.js`](../../../commitlint.config.js)). It accrues the changelog and version bumps from Conventional Commits (`feat` → minor, `fix` → patch, `!`/`BREAKING CHANGE` → major).
- Merging that PR tags the repo and publishes a GitHub Release. The GitHub Release `published` event is the single trigger for deployment (see ADR-006).
- Because the release itself is a PR, it is compatible with the guarded-`main` rule below.

### Guarded main

- No direct pushes to `main`; changes land via PR. Required status checks: **lint, check-types, build, E2E**. Require branch up-to-date, conversation resolution, and linear history. Zero required approvals (solo maintainer); admins are not restricted so the maintainer and release-please can operate.
- CI restructuring: lint / check-types (newly added) / build / E2E run as required checks on pull requests; release-please runs on push to `main`; deploy runs only on release published.

## Consequences

### Positive

- One version, one tag, one changelog — a 1:1 mapping of release → deploy that matches parachute's "one commit = one stack release" model.
- The release is a normal PR, so it respects branch protection with no bypass.
- Semver bump and changelog are derived automatically from commits already enforced by commitlint.

### Negative / trade-offs

- A change touching only one app still bumps the other app's version number. This costs nothing at deploy time because parachute recreates both containers on every deploy regardless.
- Replaces the already-configured `release-it`; the `release-it` config and `bun run release` script are removed.
- release-please commits/PR titles bypass local Lefthook commit-msg linting (they are created via the GitHub API); the `release: vX.Y.Z` convention is chosen specifically to remain commitlint-valid.

## Alternatives Considered

- **Independent per-app versioning (Changesets):** separate `web-v*` / `api-v*` tags and per-app changelogs. Rejected: independent versioning only pays off when apps ship independently, but parachute deploys them together, so it would add ceremony (changeset files, two tag lines, two changelogs) for zero deploy benefit and would make the "deploy only on new release" trigger ambiguous (which tag deploys?).
- **Keep release-it via manual `workflow_dispatch`:** lightest change, but the release commit must bypass branch protection, and it does not fit the PR-native, guarded-`main` model as cleanly as release-please's release PR.
- **Full continuous deployment (every releasable merge tags + deploys):** rejected for now in favour of an explicit human "ship" gate (merging the release PR).

## References

- [release-please](https://github.com/googleapis/release-please)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [parachute](https://github.com/mupinnn/parachute)
- ADR-006 — VPS deployment topology via parachute
- [ADR index](./README.md)
