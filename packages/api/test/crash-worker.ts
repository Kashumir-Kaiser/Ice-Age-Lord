import { SqliteRepository } from '../../storage/src/repository.ts';
import { ACTIVE_WORLD_PACKAGE } from '../../content/src/index.ts';
import { reduceCommand } from '../../sim/src/reducer.ts';
import { projectPlayerView } from '../../sim/src/view.ts';
import { canonicalStateHash } from '../../sim/src/hash.ts';

const [databasePath, saveId, killPhase] = process.argv.slice(2);
if (!databasePath || !saveId || !['before_commit', 'after_commit'].includes(killPhase ?? '')) throw new Error('CRASH_WORKER_ARGUMENTS_INVALID');
const command = {
  schemaVersion: 1 as const,
  saveId,
  commandId: `crash-${killPhase}`,
  expectedRevision: 0,
  type: 'inspect_career_card' as const,
  payload: {},
};
const repository = new SqliteRepository(databasePath, (phase, transactionName) => {
  if (phase === killPhase && transactionName === 'command') process.kill(process.pid, 'SIGKILL');
});
repository.commitCommand({
  ownerId: 'local-owner',
  saveId,
  command,
  requestSha256: canonicalStateHash(command),
  reduce: state => reduceCommand(state, command, ACTIVE_WORLD_PACKAGE),
  projectPlayerEvent: (event, eventId, state) => {
    const view = projectPlayerView(state, ACTIVE_WORLD_PACKAGE);
    return { sequence: event.sequence, eventId, type: event.type, category: 'character', title: 'Career inspected', text: view.careerCard.observed ? 'Card observed.' : 'Unavailable.' };
  },
});
repository.close();
