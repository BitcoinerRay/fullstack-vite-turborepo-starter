---
name: switch-to-cn-mirror-on-request
description: Use when the user explicitly asks to switch to a mainland China mirror source, mentions 国内镜像源 or 中国镜像源, or approves changing mirrors after Docker image layer downloads stall during deployment or container builds.
---

# Switch To CN Mirror On Request

## Overview

Only switch to mainland China mirror sources when the user explicitly asks for it, or when a verified image-pull bottleneck exists and the user approves the change.

Do not switch mirrors preemptively.

## Trigger Rules

Use this skill when any of these are true:

- The user explicitly says `国内镜像源`, `中国镜像源`, `mirror`, `加速`, or asks to switch sources in mainland China.
- A Docker build is stuck on a layer download and the user approves switching mirrors.
- The task is deployment-oriented and the user has already required slower downloads to be handled by swapping mirrors.

Do not use this skill for generic build failures, application runtime bugs, or `npm ci` errors that are unrelated to network pulls.

## Quick Triage

Before changing anything, verify whether the slowdown is actually in image pulling:

- Check exact base image cache state with `docker image inspect <image>`.
- Re-run one service build with `docker compose build --progress=plain <service>`.
- If the stall is on a line like `sha256:... 2.26MB / 51.06MB 755.0s`, treat it as a registry-layer download problem, not an app-build problem.
- If the delay is inside `npm ci`, switch the package registry inside the Dockerfile instead of the base image source only.

## Approved Mirror Addresses

Use these exact mirrored image prefixes when Docker Hub pulls are the bottleneck:

- `m.daocloud.io/docker.io/library/node:24.13.1-alpine`
- `m.daocloud.io/docker.io/nginxinc/nginx-unprivileged:1.27-alpine`

Use this package registry inside Dockerfiles when `npm` downloads are the bottleneck:

- `https://registry.npmmirror.com`

## Procedure

1. Confirm the slowdown is in Docker layer pulling, not in `npm ci` or `turbo build`.
2. Replace only the deployment Dockerfile base images with the mirrored image addresses.
3. Keep the `npm` registry override in the Dockerfile when workspace dependency downloads are part of the build.
4. Pre-pull the mirrored base images once with `docker pull` to validate the mirror path before a full rollout.
5. Re-run a single service build with `--progress=plain` and compare timing.
6. Only after the single build succeeds, continue with the full compose build or deployment.

## Common Mistakes

- Switching mirrors without explicit user approval or request.
- Changing only the `npm` registry when the actual stall is a Docker base layer pull.
- Updating the top-level deployment Dockerfile but forgetting to copy it into the active release directory before rebuilding.
- Treating post-mirror build failures as mirror problems when they are actually code or config issues.

## Detailed Reference

For a generic incident pattern, example stalled layer output, mirror addresses, and verification workflow, read [references/docker-mirror-triage.md](references/docker-mirror-triage.md).
