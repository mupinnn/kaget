FROM oven/bun:1.3.3-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS prepare
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune "@kaget/web" --docker

FROM base AS builder
ARG VITE_API_URL=https://kaget.mupin.dev
ARG VITE_APP_URL=https://kaget.mupin.dev
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_URL=$VITE_APP_URL
COPY --from=prepare /app/out/json ./
COPY --from=prepare /app/out/bun.lock ./bun.lock
RUN bun ci --ignore-scripts
COPY --from=prepare /app/out/full .
RUN bun turbo build --filter=@kaget/web

FROM nginxinc/nginx-unprivileged:stable-alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
