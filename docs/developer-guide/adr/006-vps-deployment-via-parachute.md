# ADR-006: Single-Stack VPS Deployment via parachute with Same-Origin API Proxy

## Status

Accepted (2026-07-22)

## Context

The web app deployed to Cloudflare Pages; the API had a Dockerfile and a local `docker-compose.yml` but no CI deployment. We are migrating deployment **entirely to a single VPS** using [parachute](https://github.com/mupinnn/parachute), the maintainer's deployment tool. Parachute lands a GHCR-image compose stack on one box behind Traefik, routing by hostname, injecting secrets at deploy time, with Cloudflare DNS + TLS.

Parachute is fully typechecked and unit-tested but **not yet exercised against a live Docker/Cloudflare/Tailscale box** — those code paths are unrun. We are nonetheless adopting it now for both apps and accepting that risk.

Deployment is triggered by the GitHub Release `published` event produced by the release pipeline in ADR-005.

## Decision

### One Deployment for the whole stack

- The parachute Deployment is a single compose stack: **`db` + one-shot `migrate` + `api` + `web` (nginx)**. `migrate` runs after `db` is healthy; `api` waits for `migrate` to complete successfully (the existing `depends_on` chain), extended with the web service.
- Postgres lives **inside** the released stack. Consequence: the rollout is `recreate` (parachute's `auto` recreates when a writable volume exists), so each release has **brief downtime during cutover**. The named `pgdata` volume persists across container recreation, so data survives — it is only lost if the volume is explicitly removed.
- Images are built in CI and pushed to GHCR tagged with the release commit; parachute renders the tag-pinned compose (`IMAGE_TAG=<commit>`) and runs `up --no-build --pull always`.

### Same-origin API proxy

- Only **`kaget.mupin.dev`** is a public Traefik route. The web nginx container reverse-proxies `/api/*` to the API container over parachute's shared Docker network (`proxy_pass http://<api-container>:<port>`). The API is **not** exposed publicly.
- **`kaget-api.mupin.dev` is unused for now** (can be added as a direct public route later if external API access is ever needed).
- Because the browser calls `/api` same-origin, **CORS is eliminated** and auth cookies are same-site.

### Configuration split (build-time vs runtime)

- The web app is static: `VITE_API_URL` and `VITE_APP_URL` (both `https://kaget.mupin.dev`) are **baked at image build time** in CI as build args — parachute's runtime secret injection cannot set them. They are public URLs, so this is acceptable.
- Runtime API config is injected by parachute at deploy: `BETTER_AUTH_SECRET`, `DATABASE_URL` (points at the internal `db` service), and `POSTGRES_PASSWORD` are **parachute secrets** (never travel through CI). Non-sensitive stable config (`BETTER_AUTH_URL=https://kaget.mupin.dev`, `API_PORT`, `POSTGRES_USER`, `POSTGRES_DB`) lives in the committed Spec/compose.

### Cloudflare Pages removed

- The existing `deploy.yml` (build artifact + `wrangler-action` to Cloudflare Pages) is removed. Web now ships as a container behind Traefik on the VPS.

## Consequences

### Positive

- A single artifact/commit deploys the entire product; no split-brain between a CF-Pages web and a separately-deployed API.
- Same-origin proxy removes CORS complexity and simplifies auth cookies.
- Secrets live in parachute, not in CI or the repo.

### Negative / trade-offs

- **Brief downtime per release** (recreate rollout) and Postgres cycling on deploy; acceptable for a personal budgeting PWA, but not zero-downtime.
- Bundling Postgres in the release stack keeps data one accidental volume removal away from loss; backups are a separate concern to address.
- We are betting the deploy path on parachute code that has not yet run against live infrastructure.
- Loss of Cloudflare Pages' global CDN edge for static assets; served from the single VPS via Traefik instead.

### Follow-ups

- Postgres backup strategy for the in-stack `pgdata` volume.
- Smoke-test parachute against the live VPS (Docker / Cloudflare / Tailscale paths were unrun when this ADR was accepted).

## Alternatives Considered

- **Keep web on Cloudflare Pages, deploy only the API to the VPS:** smaller blast radius, but rejected in favour of consolidating the entire deployment on one box as intended.
- **Postgres as a separate long-lived / external managed DB:** would enable blue-green (zero-downtime) app rollouts and isolate data from release churn. Rejected for now to keep a single self-contained compose stack on one box; revisit if downtime or data-safety becomes a concern.
- **Expose both `kaget.mupin.dev` and `kaget-api.mupin.dev` publicly with cross-origin browser calls:** rejected in favour of the internal same-origin proxy (no CORS, no public API surface).

## References

- [parachute](https://github.com/mupinnn/parachute) (single-server deploy; ADR-0005 compose/monorepo model)
- [Traefik file provider](https://doc.traefik.io/traefik/providers/file/)
- ADR-005 — Unified versioning and release-please pipeline
- [ADR index](./README.md)
