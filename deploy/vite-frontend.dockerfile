# Stage 1: Build stage
FROM node:24.13.1-alpine AS builder

WORKDIR /app

RUN npm install -g turbo

COPY package.json package-lock.json turbo.json ./
COPY apps/vite-frontend/package.json ./apps/vite-frontend/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY apps/vite-frontend/ ./apps/vite-frontend/

RUN turbo run build --filter=vite-frontend...

# Stage 2: Production image (serve static dist via nginx-unprivileged so the
# image runs as a non-root user out of the box).
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner

COPY deploy/vite-frontend.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/vite-frontend/dist /usr/share/nginx/html

# nginx-unprivileged listens on 8080 and runs as user "nginx" by default; no
# explicit USER directive needed.
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
