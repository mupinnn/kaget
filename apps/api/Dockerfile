FROM oven/bun:1.3.3-alpine AS base
RUN apk add --no-cache libc6-compat
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
RUN bun turbo build --filter=@kaget/api

FROM builder AS migrate
CMD ["bun", "turbo", "--filter=@kaget/api", "db:migrate"]

FROM base AS runner
WORKDIR /app/apps/api
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/node_modules /app/node_modules
ENV NODE_PATH=/app/node_modules
EXPOSE 3000
CMD ["bun", "run", "./dist/index.js"]
