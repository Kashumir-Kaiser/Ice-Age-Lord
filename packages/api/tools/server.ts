import { runtimePaths, readOwnerKey } from '../src/config.ts';
import { createApiServer } from '../src/server.ts';
import { GameApplicationService } from '../src/service.ts';
import { SqliteRepository } from '../../storage/src/repository.ts';

const port = Number(process.env.ILL_API_PORT ?? 8081);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('ILL_API_PORT must be between 1 and 65535.');
const paths = runtimePaths();
const repository = new SqliteRepository(paths.databasePath);
const service = new GameApplicationService(repository);
const { server } = createApiServer(service, {
  ownerKey: readOwnerKey(paths.ownerKeyPath),
  allowedOrigin: process.env.ILL_ALLOWED_ORIGIN ?? 'http://localhost:5173',
});
server.on('close', () => repository.close());
server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Ice Age Lord API listening at http://127.0.0.1:${port}/api/v1 (loopback only)\n`);
  process.stdout.write(`SQLite database: ${paths.databasePath}\n`);
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => server.close(() => process.exit(0)));
}
