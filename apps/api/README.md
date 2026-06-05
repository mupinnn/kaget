# @kaget/api

Hono API server running on Bun with PostgreSQL, Drizzle ORM, and better-auth.

## Prerequisites

- [Bun](https://bun.sh/) 1.2+
- PostgreSQL 16 (local or via Docker)

## Setup

```bash
# From repository root
cp .env.example .env
docker compose up -d db
bun install
cd apps/api
bun run db:migrate
bun run dev
```

The server listens on `http://localhost:3000`.

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret key (min 32 characters) |
| `BETTER_AUTH_URL` | Public API base URL |
| `PORT` | HTTP port (default `3000`) |
| `CORS_ORIGINS` | Comma-separated allowed origins |

## Database

```bash
bun run db:generate   # Generate migrations from schema changes
bun run db:migrate    # Apply migrations
bun run db:studio     # Open Drizzle Studio
```

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check with DB ping |
| GET | `/api/hello?name=` | Smoke test route |
| GET | `/api/me` | Current session user |
| GET/POST | `/api/auth/*` | better-auth handlers |

## Docker

Build and run API + PostgreSQL from the repository root:

```bash
docker compose up --build
```

Migrations run automatically via `docker-entrypoint.sh` before the server starts.
