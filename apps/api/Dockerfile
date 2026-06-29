# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM node:20-alpine AS web-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
RUN npm install -g pnpm && pnpm --filter @nano-url/web build

FROM node:20-alpine AS api-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
RUN npm install -g pnpm && pnpm --filter @nano-url/api build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono
COPY --from=api-builder /app/apps/api/dist ./dist
COPY --from=api-builder /app/node_modules ./node_modules
COPY --from=api-builder /app/apps/api/node_modules/. ./node_modules/
COPY --from=api-builder /app/apps/api/package.json ./package.json
COPY --from=web-builder /app/apps/web/dist ./web/dist
USER hono
EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]