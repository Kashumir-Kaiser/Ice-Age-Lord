import { createOwnerKeyFile, runtimePaths } from '../src/config.ts';

const paths = runtimePaths();
try {
  const path = createOwnerKeyFile(paths.ownerKeyPath);
  process.stdout.write(`Owner key created at ${path}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'OWNER_KEY_CREATE_FAILED'}\n`);
  process.exitCode = 1;
}
