# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@10
WORKDIR /app

# --- Build stage: install all deps, build shared + web + api ---
FROM base AS build
# Manifests first for better layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json tsconfig.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# Source
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

# Build shared first (api & web depend on its compiled dist), then the apps
RUN pnpm --filter @nano-url/shared build \
 && pnpm --filter @nano-url/web build \
 && pnpm --filter @nano-url/api build

# Produce a self-contained deployment for the api with a real (non-symlinked)
# node_modules that also bundles the @nano-url/shared workspace package.
RUN pnpm --filter @nano-url/api deploy --legacy --prod /deploy

# --- Runner stage ---
FROM base AS runner
# tini as PID 1: reaps zombies and forwards SIGTERM/SIGINT to node so the
# server shuts down cleanly. Default mode forwards signals to the direct
# child (node), which is the correct behavior for a single Node process
# (no -g process-group mode needed — pino's transport runs as a worker
# thread, not a separate process).
RUN apk add --no-cache tini
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono

# Self-contained api (package.json, dist, node_modules) from the deploy output
COPY --from=build /deploy/package.json ./package.json
COPY --from=build /deploy/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
# Drizzle SQL migrations, applied on startup by the entrypoint
COPY --from=build /app/apps/api/drizzle ./drizzle
# Static frontend, served by the api at runtime (../web/dist relative to dist/index.js)
COPY --from=build /app/apps/web/dist ./web/dist
# Entrypoint: run migrations, then start the server
COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER hono
EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production
ENTRYPOINT ["tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
