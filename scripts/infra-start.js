#!/usr/bin/env node

const {execSync} = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');

const COMPOSE_DIR = path.join(__dirname, '..');

function loadPortsFromEnv() {
  const envPath = path.join(COMPOSE_DIR, '.env');
  const env = {};
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const val = trimmed
        .slice(eqIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');
      env[key] = val;
    }
  } catch {
    /* no .env file — use docker-compose defaults */
  }

  return {
    postgres: Number(env.POSTGRES_PORT) || 5432,
    redis: Number(env.REDIS_PORT) || 6379,
  };
}

function getComposeRunningServices() {
  try {
    const output = execSync('docker compose ps --services --filter status=running', {
      cwd: COMPOSE_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, '0.0.0.0');
  });
}

async function main() {
  const ports = loadPortsFromEnv();
  const serviceNames = Object.keys(ports);
  const running = getComposeRunningServices();
  const allRunning = serviceNames.every((s) => running.includes(s));

  if (allRunning) {
    console.log('[infra] All services already running — skipping docker compose up.');
    return;
  }

  const notRunning = serviceNames.filter((s) => !running.includes(s));

  const conflicts = [];
  for (const service of notRunning) {
    if (await isPortInUse(ports[service])) {
      conflicts.push({service, port: ports[service]});
    }
  }

  if (conflicts.length > 0) {
    console.error('[infra] Port conflict — cannot start docker compose:');
    for (const {service, port} of conflicts) {
      console.error(`  ${service}: port ${port} is already in use`);
    }
    console.error('');
    console.error('Suggestions:');
    console.error('  - Stop the process occupying the port (docker ps / netstat)');
    console.error('  - Or change the port in .env (POSTGRES_PORT / REDIS_PORT)');
    process.exit(1);
  }

  console.log(`[infra] Starting services: ${notRunning.join(', ')}...`);
  try {
    execSync('docker compose up -d', {cwd: COMPOSE_DIR, stdio: 'inherit'});
    console.log('[infra] Infrastructure services started.');
  } catch {
    console.error('[infra] Failed to start infrastructure. Is Docker running?');
    process.exit(1);
  }
}

main();
