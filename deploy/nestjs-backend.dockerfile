# Stage 1: Build stage
FROM node:24.13.1-alpine AS builder

WORKDIR /app

# Install turbo globally
RUN npm install -g turbo

# Copy root package files and turbo config first to maximize layer cache hits.
COPY package.json package-lock.json turbo.json ./

# Copy all workspace package.json files for better dependency resolution
COPY apps/nestjs-backend/package.json ./apps/nestjs-backend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/

# Install all dependencies (workspaces are linked by npm into root node_modules)
RUN npm ci

# Copy workspace sources
COPY packages/shared/ ./packages/shared/
COPY packages/db/ ./packages/db/
COPY apps/nestjs-backend/ ./apps/nestjs-backend/

# Build shared/db packages first, then the nestjs-backend (turbo handles order).
RUN turbo run build --filter=nestjs-backend...

# Stage 2: Production image
FROM node:24.13.1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package metadata so npm understands the workspace layout when needed.
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/nestjs-backend/package.json ./apps/nestjs-backend/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/db/package.json ./packages/db/

# Reuse the builder's installed node_modules (workspace symlinks resolve from
# here). Avoids a second `npm install --production` that would either fail to
# resolve "*" workspace specifiers or overwrite the prebuilt shared dist.
COPY --from=builder /app/node_modules ./node_modules

# Application + workspace build outputs
COPY --from=builder /app/apps/nestjs-backend/dist ./apps/nestjs-backend/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist

# Drop dev dependencies now that the build is done.
RUN npm prune --omit=dev --workspaces --include-workspace-root \
  && chown -R node:node /app

USER node

ENV PORT=4000
EXPOSE 4000

WORKDIR /app/apps/nestjs-backend

CMD ["node", "dist/src/main"]
