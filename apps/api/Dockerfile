FROM oven/bun:1.3 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/api
RUN bun run build

FROM base AS run
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/migrations ./apps/api/migrations
COPY --from=build /app/apps/api/drizzle.config.ts ./apps/api/drizzle.config.ts
COPY --from=build /app/apps/api/src/db ./apps/api/src/db
COPY --from=build /app/package.json ./package.json
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
RUN chmod +x ./apps/api/docker-entrypoint.sh

WORKDIR /app/apps/api
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "run", "start"]
