# ─── HireGuard Web — Multi-stage Dockerfile ───────────────────────
# Stage 1: Install + Build (Node 22 Alpine)
# Stage 2: Serve (Nginx Alpine — ~25MB final image)
# ──────────────────────────────────────────────────────────────────

# ── Stage 1: Build ──
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/core/ packages/core/
COPY apps/web/ apps/web/

RUN pnpm --filter @hireguard/core build && \
    pnpm --filter @hireguard/web build

# ── Stage 2: Serve ──
FROM nginx:alpine AS production

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/hireguard.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
