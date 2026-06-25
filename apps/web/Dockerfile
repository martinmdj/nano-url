# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/ ./packages/shared/
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/
RUN npm install -g pnpm && pnpm --filter @nano-url/web build

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 vite
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
USER vite
EXPOSE 5173
ENV PORT=5173
CMD ["pnpm", "preview"]