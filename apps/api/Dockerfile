FROM oven/bun:1.3.3-alpine AS base
RUN apk update
RUN apk update --no-cache libc6-compat
WORKDIR /app

FROM base AS prepare
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune "@kaget/api" --docker

FROM base AS builder
COPY --from=prepare /app/out/json ./
COPY --from=prepare /app/out/bun.lock ./bun.lock
RUN bun ci --ignore-scripts
COPY --from=prepare /app/out/full .
RUN bun turbo build

FROM builder AS migrate
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/migrations ./apps/api/migrations
COPY --from=builder /app/apps/api/drizzle.config.ts ./apps/api/
COPY --from=builder /app/apps/api/src/db ./apps/api/src/db
COPY --from=builder /app/apps/api/src/config ./apps/api/src/config
COPY --from=builder /app/package.json ./package.json
CMD ["bun", "turbo", "--filter=@kaget/api", "db:migrate"]

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["bun", "run", "start"]
