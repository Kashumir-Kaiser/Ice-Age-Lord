import { ACTIVE_WORLD_PACKAGE as world } from '../../packages/content/src/index.ts';
import { RULESET_VERSION } from '../../packages/content/src/sourceLock.ts';
import type { GameState } from '../../packages/contracts/src/index.ts';
import { createNewGame } from '../../packages/sim/src/initializer.ts';
import { forEachBotActionReceipt, verifyBotPopulation } from '../../packages/sim/src/bots/state.ts';
import { generateBotPopulationStress } from '../../packages/sim/src/bots/generation.ts';
import { advanceTo } from '../../packages/sim/src/time.ts';

const populationArg = Number(process.argv.find(value => value.startsWith('--population='))?.split('=')[1] ?? 1_023);
const hours = Number(process.argv.find(value => value.startsWith('--hours='))?.split('=')[1] ?? 1);
const showProgress = process.argv.includes('--progress');
if (![1_023, 10_000, 100_000].includes(populationArg) || !Number.isSafeInteger(hours) || hours < 1 || hours > 144) {
  throw new Error('Use --population=1023|10000|100000 and --hours=1..144');
}
const durationMs = hours * 3_600_000;
const elapsedMs = (): number => Number(process.hrtime.bigint()) / 1_000_000;
const memory = () => ({ rssMiB: Math.round(process.memoryUsage().rss / 1_048_576), heapMiB: Math.round(process.memoryUsage().heapUsed / 1_048_576) });
const timing: Record<string, number> = {};
const start = elapsedMs();
const seed = `bot-benchmark-${populationArg}-${hours}h`;
let state: GameState;
{
  const tick = elapsedMs();
  state = createNewGame({
    saveId: `bot-benchmark-save-${populationArg}-${hours}h`, campaignId: `bot-benchmark-campaign-${populationArg}-${hours}h`,
    soulId: 'LI_LAN', worldPackageId: world.id, rulesetVersion: RULESET_VERSION, contentVersion: world.contentVersion, seed,
  }, world);
  timing.initializeP0Ms = Math.round(elapsedMs() - tick);
}
if (populationArg !== 1_023) {
  const tick = elapsedMs();
  state.botPopulation = generateBotPopulationStress(seed, world, populationArg as 10_000 | 100_000);
  timing.generateStressPopulationMs = Math.round(elapsedMs() - tick);
}
let advanceCalls = 0;
let projectedEvents = 0;
const tick = elapsedMs();
while (state.simElapsedMs < durationMs) {
  const beforeSimElapsedMs = state.simElapsedMs;
  const beforePopulation = state.botPopulation!;
  const beforeCompletedActions = beforePopulation.completedActionCount;
  const beforeIntegratedSegments = beforePopulation.benchmarkCounters.integratedBotSegments;
  const beforePlannerExpansions = beforePopulation.benchmarkCounters.plannerExpansions;
  const beforePublicRevision = beforePopulation.publicRevision;
  const result = advanceTo(state, durationMs, {
    maxBoundaries: 10_000,
    deferBotPopulationCommit: true,
    mutatePrivateState: advanceCalls > 0,
  }, world);
  state = result.state;
  advanceCalls += 1;
  projectedEvents += result.events.length;
  if (showProgress) process.stderr.write(`${JSON.stringify({
    advanceCalls,
    simHours: Number((state.simElapsedMs / 3_600_000).toFixed(3)),
    caughtUp: result.caughtUp,
    completedActions: state.botPopulation?.completedActionCount,
    plannerExpansions: state.botPopulation?.benchmarkCounters.plannerExpansions,
    integratedSegments: state.botPopulation?.benchmarkCounters.integratedBotSegments,
  })}\n`);
  if (result.caughtUp) break;
  if (state.simElapsedMs >= durationMs) break;
  const afterPopulation = state.botPopulation!;
  const madeProgress = state.simElapsedMs > beforeSimElapsedMs
    || result.events.length > 0
    || afterPopulation.completedActionCount > beforeCompletedActions
    || afterPopulation.benchmarkCounters.integratedBotSegments > beforeIntegratedSegments
    || afterPopulation.benchmarkCounters.plannerExpansions > beforePlannerExpansions
    || afterPopulation.publicRevision > beforePublicRevision;
  if (!madeProgress) throw new Error(`BOT_BENCHMARK_ADVANCE_STALLED:${beforeSimElapsedMs}`);
}
timing.advanceMs = Math.round(elapsedMs() - tick);
if (state.simElapsedMs !== durationMs) throw new Error(`BOT_BENCHMARK_NOT_CAUGHT_UP:${state.simElapsedMs}/${durationMs}`);
const verifyTick = elapsedMs();
verifyBotPopulation(state.botPopulation!);
timing.verifyMs = Math.round(elapsedMs() - verifyTick);
const botRecords = state.botPopulation!.chunks.flatMap(chunk => chunk.cold.map((bot, offset) => ({ bot, chunk, offset })));
const levelCounts = new Map<number, number>();
const actionResults = new Map<string, number>();
const structuresByBlueprint = new Map<string, number>();
const learnedBlueprints = new Map<string, number>();
let equippedCohortCount = 0;
let damagedStructureCount = 0;
const talentProgress = new Map<string, { count: number; totalLevel: number; level10Count: number; qualifyingElapsedMs: number[]; committedActions: number; baseXp: number; adjustedXp: number }>();
let currentPlans = 0;
let aliveBots = 0;
let qualifiedBots = 0;
for (const { bot, chunk, offset } of botRecords) {
  const level = chunk.levels[offset]!;
  const grade = (['S', 'A', 'B', 'C', 'D'] as const)[chunk.talentGrades[offset]!]!;
  const kind = (['combat', 'production'] as const)[chunk.talentKinds[offset]!]!;
  const talentKey = `${grade}_${kind}`;
  const progress = talentProgress.get(talentKey) ?? { count: 0, totalLevel: 0, level10Count: 0, qualifyingElapsedMs: [], committedActions: 0, baseXp: 0, adjustedXp: 0 };
  progress.count += 1;
  progress.totalLevel += level;
  if (chunk.completionAtElapsedMs[offset]! > 0) {
    progress.level10Count += 1;
    progress.qualifyingElapsedMs.push(chunk.completionAtElapsedMs[offset]!);
  }
  talentProgress.set(talentKey, progress);
  levelCounts.set(level, (levelCounts.get(level) ?? 0) + 1);
  if (chunk.alive[offset] !== 0) aliveBots += 1;
  if (chunk.completionAtElapsedMs[offset]! > 0) qualifiedBots += 1;
  if (bot.currentPlan) currentPlans += 1;
  for (const blueprintId of bot.blueprintIds) learnedBlueprints.set(blueprintId, (learnedBlueprints.get(blueprintId) ?? 0) + 1);
  for (const structure of bot.structures) if (structure.status !== 'destroyed') structuresByBlueprint.set(structure.blueprintId, (structuresByBlueprint.get(structure.blueprintId) ?? 0) + 1);
  damagedStructureCount += bot.structures.filter(structure => structure.status === 'damaged').length;
  equippedCohortCount += bot.cohorts.filter(cohort => cohort.livingCount > 0 && cohort.equipmentTemplateIds.length > 0).length;
  forEachBotActionReceipt(bot, receipt => {
    const key = `${receipt.action}:${receipt.result}`;
    actionResults.set(key, (actionResults.get(key) ?? 0) + 1);
    progress.committedActions += 1;
    progress.baseXp += receipt.baseXpAwarded;
    progress.adjustedXp += receipt.xpAwarded;
  });
}
console.log(JSON.stringify({
  population: state.botPopulation!.botCount, totalParticipants: state.botPopulation!.totalParticipants,
  simHours: hours, simElapsedMs: state.simElapsedMs, generationProfile: state.botPopulation!.generationProfile,
  advanceCalls, projectedEvents, completedActions: state.botPopulation!.completedActionCount,
  plansStarted: state.botPopulation!.chunks.reduce((sum, chunk) => sum + chunk.cold.reduce((n, bot) => n + bot.nextActionOrdinal, 0), 0),
  plannerExpansions: state.botPopulation!.benchmarkCounters.plannerExpansions,
  integratedBotSegments: state.botPopulation!.benchmarkCounters.integratedBotSegments,
    learnedBlueprintsByPopulation: Object.fromEntries([...learnedBlueprints.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)),
    structuresByBlueprint: Object.fromEntries([...structuresByBlueprint.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)),
    equippedCohorts: equippedCohortCount,
    damagedStructures: damagedStructureCount,
  boardSnapshots: state.botPopulation!.boardSnapshots.map(snapshot => ({
    boardId: snapshot.boardId, status: snapshot.status, asOfSimMs: snapshot.asOfSimMs,
    observedThroughSimMs: snapshot.observedThroughSimMs, rowCount: snapshot.rows.length, snapshotSha256: snapshot.snapshotSha256,
  })),
  populationOutcomes: {
    aliveBots, qualifiedBots, currentPlans,
    levelDistribution: Object.fromEntries([...levelCounts.entries()].sort((a, b) => a[0] - b[0])),
    talentProgressByGradeAndKind: Object.fromEntries([...talentProgress.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([talent, value]) => [talent, {
      population: value.count, meanLevel: Number((value.totalLevel / value.count).toFixed(3)), level10Count: value.level10Count,
      meanQualificationHour: value.qualifyingElapsedMs.length > 0
        ? Number((value.qualifyingElapsedMs.reduce((sum, time) => sum + time, 0) / value.qualifyingElapsedMs.length / 3_600_000).toFixed(3)) : null,
      committedActions: value.committedActions, baseXp: value.baseXp, adjustedXp: value.adjustedXp,
    }])),
    actionResults: Object.fromEntries([...actionResults.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)),
  },
  timingMs: timing, totalMs: Math.round(elapsedMs() - start), memory: memory(), verified: true,
}));
