import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { runtimePaths } from '../src/config.ts';
import { GameApplicationService } from '../src/service.ts';
import { SqliteRepository } from '../../storage/src/repository.ts';

const [operation, first, second] = process.argv.slice(2);
const paths = runtimePaths();
const repository = new SqliteRepository(paths.databasePath);
const service = new GameApplicationService(repository);
try {
  if (operation === 'export') {
    if (!first) throw new Error('Usage: npm run backup:export -- <saveId> [outputPath]');
    const backup = service.exportBackup(first);
    const outputPath = resolve(second ?? `${paths.databasePath}.backups/${first}-${randomUUID()}.json`);
    mkdirSync(dirname(outputPath), { recursive: true, mode: 0o700 });
    writeFileSync(outputPath, `${JSON.stringify(backup, null, 2)}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    process.stdout.write(`Backup exported to ${outputPath}\n`);
  } else if (operation === 'import') {
    if (!first || !second) throw new Error('Usage: npm run backup:import -- <inputPath> <slotName>');
    const inputPath = resolve(first);
    if (statSync(inputPath).size > 10 * 1024 * 1024) throw new Error('Backup file exceeds the 10 MiB limit.');
    const backup = JSON.parse(readFileSync(inputPath, 'utf8')) as unknown;
    const result = service.importBackup(backup, second);
    process.stdout.write(`Backup imported as save ${result.save.saveId} in slot ${result.save.slotName}\n`);
  } else {
    throw new Error('Usage: npm run backup:export -- <saveId> [outputPath] | npm run backup:import -- <inputPath> <slotName>');
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'BACKUP_OPERATION_FAILED'}\n`);
  process.exitCode = 1;
} finally {
  repository.close();
}
