# Release and deploy

How KaGet cuts versions and lands on the VPS. Decisions: [ADR-005](./adr/005-release-and-versioning-strategy.md), [ADR-006](./adr/006-vps-deployment-via-parachute.md).

## Flow

1. Open a PR → CI runs **lint**, **check-types**, **build**, and **e2e** (required checks).
2. Merge to `main` → **release-please** opens or updates a `release: vX.Y.Z` PR with changelog + version bumps (root + `@kaget/web` + `@kaget/api`).
3. Merge the release PR → release-please tags `vX.Y.Z`, publishes the GitHub Release, and the same workflow deploys via [parachute](https://github.com/mupinnn/parachute).

Deploy is intentionally **not** wired to the `release` event: releases created with `GITHUB_TOKEN` do not trigger other workflows. The release workflow deploys when `release_created` is true (or on `workflow_dispatch`).

## Branch protection (`main`)

Configure in GitHub → Settings → Branches:

| Setting | Value |
| --- | --- |
| Require a pull request | Yes |
| Required approvals | 0 (solo) |
| Require status checks | `lint`, `check-types`, `build`, `e2e` |
| Require branches to be up to date | Yes |
| Require conversation resolution | Yes |
| Require linear history | Yes |
| Do not allow bypassing (admins) | Off — so you can unblock emergencies |

## Repository secrets (GitHub Actions)

| Secret | Purpose |
| --- | --- |
| `PARACHUTE_URL` | Tailnet base URL of the parachute daemon (e.g. `http://100.x.y.z:8787`) |
| `PARACHUTE_DEPLOY_TOKEN` | Bearer token (`PARACHUTE_DEPLOY_TOKEN` on the box) |
| `TS_OAUTH_CLIENT_ID` | Tailscale OAuth client for ephemeral CI join |
| `TS_OAUTH_SECRET` | Tailscale OAuth secret |

## Secrets on the VPS (parachute)

Set once; they are injected per service at deploy time (`parachute.toml` → `[service_secrets]`):

```bash
parachute secret set kaget POSTGRES_PASSWORD='…'
parachute secret set kaget DATABASE_URL='postgresql://kaget:…@db:5432/kaget'
parachute secret set kaget BETTER_AUTH_SECRET='…'   # ≥ 32 characters
```

Non-secret prod config (`BETTER_AUTH_URL`, `CORS_ORIGINS`, Vite URLs) lives in [`docker-compose.yml`](../../docker-compose.yml) and is baked into the web image at build time.

## Topology

- Public hostname: **`kaget.mupin.dev`** (Traefik → `web` nginx on port 8080).
- Browser calls `/api/*` same-origin; nginx proxies to the `api` container. No public API host.
- Stack: `db` + one-shot `migrate` + `api` + `web`. Rollout is `recreate` (brief downtime; `pgdata` volume persists).

## Manual deploy

Actions → **Release** → **Run workflow** redeploys the current `main` tip without cutting a new version.
