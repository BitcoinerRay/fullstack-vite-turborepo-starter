# Docker Mirror Triage

## Purpose

Use this reference when a deployment or container build is slow and the user has explicitly asked to switch to a mainland China mirror source.

This document is intentionally generic. It describes how to distinguish Docker image pull slowness from application build slowness, and how to validate a mirror swap safely.

## Verified Symptom Pattern

The key symptom is a Docker image layer download that barely progresses for a long time.

Example:

```text
#6 sha256:8ba8341791ce72c3cdec81ab7f3abf29803e34a45ed9a8389accf9dbc4fa8355 2.26MB / 51.06MB 755.0s
```

Interpretation:

- This indicates a registry-layer pull stall.
- It does not, by itself, indicate a problem in `npm ci`.
- It does not, by itself, indicate a problem in `turbo build`, `vite build`, `nest build`, or the application runtime.

## Generic Root Cause Checklist

Before changing any source:

1. Check whether the exact base images are already cached with `docker image inspect <image>`.
2. Re-run one affected service build with `docker compose build --progress=plain <service>`.
3. If the delay happens before application source is compiled, treat it as a registry pull problem.
4. If the delay is inside package-manager output, treat it as a package registry problem instead.

## Approved Mirror Examples

These are examples of mirrored Docker base image paths that were validated in practice:

```text
m.daocloud.io/docker.io/library/node:24.13.1-alpine
m.daocloud.io/docker.io/nginxinc/nginx-unprivileged:1.27-alpine
```

This is an example `npm` registry that was validated in practice:

```text
https://registry.npmmirror.com
```

These examples are useful defaults, but they should still be validated in the user’s environment.

## Validation Workflow

1. Confirm the user explicitly wants a mainland China mirror source.
2. Change only the deployment Dockerfile base images first.
3. If package downloads are also slow, change the package registry inside the Dockerfile.
4. Pre-pull the mirrored base images with `docker pull` before running a full deployment build.
5. Re-run a single service build with `--progress=plain`.
6. Compare the timing before and after the mirror change.

## Example Commands

```bash
docker pull m.daocloud.io/docker.io/library/node:24.13.1-alpine
docker pull m.daocloud.io/docker.io/nginxinc/nginx-unprivileged:1.27-alpine
```

Example Dockerfile pattern:

```dockerfile
FROM m.daocloud.io/docker.io/library/node:24.13.1-alpine AS builder
FROM m.daocloud.io/docker.io/library/node:24.13.1-alpine AS runner
FROM m.daocloud.io/docker.io/nginxinc/nginx-unprivileged:1.27-alpine AS runner

RUN npm config set registry https://registry.npmmirror.com \
  && npm install -g turbo
```

## Common Follow-On Issues

Once the mirror bottleneck is removed, a second class of failures often becomes visible:

1. Missing files in the Docker build context.
2. Environment-variable validation failures.
3. Old deployment files still being used in the active release directory.
4. Runtime health-check failures that were previously masked by the stalled build.

These are not mirror-source problems. Treat them as separate deployment or application issues.
