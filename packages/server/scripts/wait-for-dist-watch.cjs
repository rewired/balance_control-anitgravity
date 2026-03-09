#!/usr/bin/env node
const { spawn } = require('node:child_process');
const { access } = require('node:fs/promises');
const path = require('node:path');

const DIST_ENTRY = path.resolve(__dirname, '..', 'dist', 'index.js');
const POLL_INTERVAL_MS = 200;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDistEntry() {
  for (;;) {
    try {
      await access(DIST_ENTRY);
      return;
    } catch {
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

async function main() {
  await waitForDistEntry();

  const child = spawn(process.execPath, ['--watch', DIST_ENTRY], {
    stdio: 'inherit',
  });

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on('SIGINT', () => forwardSignal('SIGINT'));
  process.on('SIGTERM', () => forwardSignal('SIGTERM'));

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error('[wait-for-dist-watch] failed to start watcher', error);
  process.exit(1);
});
