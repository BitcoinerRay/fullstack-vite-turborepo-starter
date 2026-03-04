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

# Stage 2: Production image (serve static dist)
FROM nginx:alpine AS runner

COPY deploy/vite-frontend.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/vite-frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
