# ─── HireGuard Web — Multi-stage Dockerfile ───────────────────────
# Stage 1: Install + Build (Node 22 Alpine)
# Stage 2: Serve (Nginx Alpine — ~25MB final image)
# ──────────────────────────────────────────────────────────────────

# ── Stage 1: Build ──
FROM node:22-alpine AS builder

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root files first (lockfile + workspace config)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy package manifests for dependency resolution
COPY packages/core/package.json packages/core/
COPY apps/web/package.json apps/web/

# Install dependencies (cached layer)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/core/ packages/core/
COPY apps/web/ apps/web/

# Build: core first (dependency), then web
RUN pnpm --filter @hireguard/core build && \
    pnpm --filter @hireguard/web build

# ── Stage 2: Serve ──
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config for SPA + CORS headers
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Nginx configuration
RUN cat > /etc/nginx/conf.d/hireguard.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # hiring.txt with CORS
    location /.well-known/hiring.txt {
        default_type text/plain;
        add_header Access-Control-Allow-Origin "*" always;
        add_header Cache-Control "public, max-age=86400";
    }

    # SPA fallback — all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
