import { runtimePaths } from '../../api/src/config.ts';
import { SqliteRepository } from '../src/repository.ts';

const paths = runtimePaths();
const repository = new SqliteRepository(paths.databasePath);
repository.close();
process.stdout.write(`SQLite migrations are current: ${paths.databasePath}\n`);
