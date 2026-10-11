import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createOwnerKeyFile, runtimePaths } from '../packages/api/src/config.ts';

const root = resolve(import.meta.dirname, '..');
const frontendRoot = resolve(root, 'frontend');
const viteCli = resolve(frontendRoot, 'node_modules/vite/bin/vite.js');
const paths = runtimePaths(root);

if (!existsSync(viteCli)) {
  process.stderr.write('Frontend dependencies are missing. Run npm ci --prefix frontend, then retry npm run local:start.\n');
  process.exitCode = 1;
} else {
  if (!process.env.ILL_OWNER_KEY && !existsSync(paths.ownerKeyPath)) createOwnerKeyFile(paths.ownerKeyPath);

  function runOnce(command, args, options = {}) {
    return new Promise((resolvePromise, rejectPromise) => {
      const child = spawn(command, args, { cwd: root, stdio: 'inherit', ...options });
      child.once('error', rejectPromise);
      child.once('exit', code => code === 0
        ? resolvePromise()
        : rejectPromise(new Error(`${command} exited with status ${code ?? 'unknown'}`)));
    });
  }

  try {
    await runOnce(process.execPath, ['--experimental-strip-types', 'packages/storage/tools/migrate.ts']);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'LOCAL_MIGRATION_FAILED'}\n`);
    process.exitCode = 1;
  }

  if (process.exitCode === undefined) {
    const apiEnv = { ...process.env, ILL_ALLOWED_ORIGIN: process.env.ILL_ALLOWED_ORIGIN ?? 'http://localhost:5173' };
    const frontendEnv = { ...process.env, VITE_GAME_MODE: 'live' };
    const children = [
      spawn(process.execPath, ['--experimental-strip-types', 'packages/api/tools/server.ts'], { cwd: root, env: apiEnv, stdio: 'inherit' }),
      spawn(process.execPath, [viteCli, '--host', '127.0.0.1'], { cwd: frontendRoot, env: frontendEnv, stdio: 'inherit' }),
    ];
    let stopping = false;
    const stop = (signal, exitCode) => {
      if (stopping) return;
      stopping = true;
      if (exitCode !== undefined && process.exitCode === undefined) process.exitCode = exitCode;
      for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill(signal);
    };
    process.once('SIGINT', () => stop('SIGINT', 130));
    process.once('SIGTERM', () => stop('SIGTERM', 143));

    await new Promise(resolvePromise => {
      let remaining = children.length;
      for (const child of children) {
        child.once('error', error => {
          process.stderr.write(`Local service failed to start: ${error.message}\n`);
          stop('SIGTERM', 1);
        });
        child.once('close', (code, signal) => {
          if (!stopping) {
            process.exitCode = code === 0 && !signal ? 0 : code && code !== 0 ? code : 1;
            stop('SIGTERM');
          }
          remaining -= 1;
          if (remaining === 0) resolvePromise();
        });
      }
    });
  }
}
