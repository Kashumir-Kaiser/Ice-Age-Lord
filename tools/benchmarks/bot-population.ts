import { ACTIVE_WORLD_PACKAGE as world } from '../../packages/content/src/index.ts';
import { RULESET_VERSION } from '../../packages/content/src/sourceLock.ts';
import type { GameState } from '../../packages/contracts/src/index.ts';
import { createNewGame } from '../../packages/sim/src/initializer.ts';
import { forEachBotActionReceipt, verifyBotPopulation } from '../../packages/sim/src/bots/state.ts';
import { generateBotPopulation } from '../../packages/sim/src/bots/generation.ts';
import { BOT_BLUEPRINT_BY_ID } from '../../packages/sim/src/bots/blueprints.ts';
import { botHomeCohortCounts, botSettlementDefensePermille } from '../../packages/sim/src/bots/combat.ts';
import { integrateBotResourceBalances } from '../../packages/sim/src/bots/economy.ts';
import { BOT_MICRO, hydrateBotHotArrays } from '../../packages/sim/src/bots/state.ts';
import { advanceTo } from '../../packages/sim/src/time.ts';

const optionValue = (name: string): string | undefined => process.argv.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const populationArg = Number(optionValue('population') ?? 1_023);
const hours = Number(optionValue('hours') ?? 1);
const seed = optionValue('seed') ?? `bot-benchmark-${populationArg}`;
const showProgress = process.argv.includes('--progress');
if (![32, 48, 64, 1_023, 10_000, 100_000].includes(populationArg) || !Number.isSafeInteger(hours) || hours < 1 || hours > 168 || seed.length === 0) {
  throw new Error('Use --population=32|48|64|1023|10000|100000, --hours=1..168, and an optional non-empty --seed=value');
}
const durationMs = hours * 3_600_000;
const elapsedMs = (): number => Number(process.hrtime.bigint()) / 1_000_000;
const memory = () => ({ rssMiB: Math.round(process.memoryUsage().rss / 1_048_576), heapMiB: Math.round(process.memoryUsage().heapUsed / 1_048_576) });
const timing: Record<string, number> = {};
const start = elapsedMs();
const seedId = seed.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 72) || 'seed';
let state: GameState;
{
  const tick = elapsedMs();
  state = createNewGame({
    saveId: `bot-benchmark-save-${populationArg}-${seedId}`, campaignId: `bot-benchmark-campaign-${populationArg}-${seedId}`,
    soulId: 'LI_LAN', worldPackageId: world.id, rulesetVersion: RULESET_VERSION, contentVersion: world.contentVersion, seed,
  }, world);
  timing.initializeP0Ms = Math.round(elapsedMs() - tick);
}
if (populationArg !== 1_023) {
  const tick = elapsedMs();
  state.botPopulation = generateBotPopulation(seed, world, {
    botCount: populationArg,
    profile: 'BENCHMARK_STRESS',
    mapRadiusKm: world.activeMapRadiusKm * Math.max(1, Math.sqrt(populationArg / 1_023)),
  });
  timing.generateDiagnosticPopulationMs = Math.round(elapsedMs() - tick);
}
let advanceCalls = 0;
let projectedEvents = 0;
const tick = elapsedMs();
const checkpointHours = hours === 168 ? [24, 48, 144, 168] : [hours];
const checkpointSummaries: Record<string, unknown>[] = [];
function checkpointSummary(atHour: number): Record<string, unknown> {
  const population = state.botPopulation!;
  const gradeLabels = ['S', 'A', 'B', 'C', 'D'] as const;
  const kindLabels = ['combat', 'production'] as const;
  const survivorsByGrade: Record<string, number> = Object.fromEntries(gradeLabels.map(grade => [grade, 0]));
  const survivorsByGradeAndKind: Record<string, number> = Object.fromEntries(gradeLabels.flatMap(grade => kindLabels.map(kind => [`${grade}_${kind}`, 0])));
  const recordedDeathsByGradeAndKind: Record<string, number> = Object.fromEntries(gradeLabels.flatMap(grade => kindLabels.map(kind => [`${grade}_${kind}`, 0])));
  const resources = { food: 0, firewood: 0, wood: 0, stone: 0, ore: 0 };
  let activeSettlements = 0;
  let activeSettlementResidents = 0;
  let residentPopulation = 0;
  let civilianPopulation = 0;
  let recordedDeaths = 0;
  let homeTroops = 0;
  let potableWaterMl = 0;
  const lordsByFate: Record<string, number> = { active: 0, dead: 0, captured: 0, dispossessed: 0 };
  const lordEliminationsByCause: Record<string, number> = {};
  const lossesByCause: Record<string, number> = {};
  const territoryLevels: Record<string, number> = {};
  const blueprintItemsByStatus: Record<string, number> = {};
  let unopenedChests = 0;
  let openedChests = 0;
  let activeDefenseStructures = 0;
  let damagedDefenseStructures = 0;
  let effectiveDefensePermille = 0;
  for (const chunk of population.chunks) {
    const hot = hydrateBotHotArrays(chunk);
    for (let offset = 0; offset < chunk.count; offset += 1) {
      recordedDeaths += hot.deathCount[offset]!;
      const grade = gradeLabels[chunk.talentGrades[offset]!] ?? 'D';
      const kind = kindLabels[chunk.talentKinds[offset]!] ?? 'production';
      recordedDeathsByGradeAndKind[`${grade}_${kind}`] += hot.deathCount[offset]!;
      const bot = chunk.cold[offset]!;
      lordsByFate[bot.lordFate.status] = (lordsByFate[bot.lordFate.status] ?? 0) + 1;
      if (bot.lordFate.status !== 'active' && bot.lordFate.cause) {
        const causeKey = `${grade}_${kind}:${bot.lordFate.cause}`;
        lordEliminationsByCause[causeKey] = (lordEliminationsByCause[causeKey] ?? 0) + 1;
      }
      for (const [cause, count] of Object.entries(bot.casualtiesByCause)) lossesByCause[cause] = (lossesByCause[cause] ?? 0) + count;
      const residents = hot.population[offset]!;
      residentPopulation += residents;
      civilianPopulation += Math.max(0, residents - hot.armySize[offset]!);
      potableWaterMl += bot.potableWaterMl;
      territoryLevels[String(bot.territoryLevel)] = (territoryLevels[String(bot.territoryLevel)] ?? 0) + 1;
      for (const item of bot.blueprintItems) blueprintItemsByStatus[item.status] = (blueprintItemsByStatus[item.status] ?? 0) + 1;
      unopenedChests += bot.ownedChests.filter(chest => chest.status === 'owned').length;
      openedChests += bot.ownedChests.filter(chest => chest.status === 'opened').length;
      if (hot.alive[offset] === 0) continue;
      activeSettlements += 1;
      activeSettlementResidents += residents;
      survivorsByGrade[grade] += 1;
      survivorsByGradeAndKind[`${grade}_${kind}`] += 1;
      const elapsed = atHour * 3_600_000 - hot.lastIntegratedAtElapsedMs[offset]!;
      if (elapsed > 0) integrateBotResourceBalances(bot, chunk, hot, offset, elapsed);
      resources.food += hot.foodMicro[offset]! / BOT_MICRO;
      resources.firewood += hot.firewoodMicro[offset]! / BOT_MICRO;
      resources.wood += hot.woodMicro[offset]! / BOT_MICRO;
      resources.stone += hot.stoneMicro[offset]! / BOT_MICRO;
      resources.ore += hot.oreMicro[offset]! / BOT_MICRO;
      const home = botHomeCohortCounts(bot);
      homeTroops += bot.cohorts.reduce((sum, cohort) => sum + (home.get(cohort.id) ?? 0), 0);
      for (const structure of bot.structures) {
        if ((BOT_BLUEPRINT_BY_ID.get(structure.blueprintId)?.defensePermille ?? 0) <= 0) continue;
        if (structure.status === 'active') activeDefenseStructures += 1;
        else if (structure.status === 'damaged') damagedDefenseStructures += 1;
      }
      effectiveDefensePermille += botSettlementDefensePermille(bot);
    }
  }
  const itemTotals = population.rewardReceipts.flatMap(receipt => receipt.items).reduce((totals, item) => {
    totals.instances += 1;
    totals.quantity += item.quantity;
    totals.foodUnitsApplied += item.foodUnitsApplied;
    totals.inventoryQuantity += item.inventoryQuantity;
    return totals;
  }, { instances: 0, quantity: 0, foodUnitsApplied: 0, inventoryQuantity: 0 });
  const board = population.boardSnapshots.at(-1);
  const eventInventory = population.chunks.flatMap(chunk => chunk.cold).flatMap(bot => bot.eventInventory);
  return {
    hour: atHour,
    activeSettlements,
    recordedResidentAndTroopLosses: recordedDeaths,
    survivorsByTalentGrade: survivorsByGrade,
    survivorsByTalentGradeAndKind: survivorsByGradeAndKind,
    recordedDeathsByTalentGradeAndKind: recordedDeathsByGradeAndKind,
    lordCounts: { initialRosterSize: population.botCount, living: lordsByFate.active,
      eliminated: lordsByFate.dead + lordsByFate.captured + lordsByFate.dispossessed, byFate: lordsByFate },
    residentPopulation,
    civilianPopulation,
    activeSettlementResidents,
    deathCauseBreakdown: { lordEliminations: lordEliminationsByCause, residentAndTroopLosses: lossesByCause },
    resourceReserves: { ...Object.fromEntries(Object.entries(resources).map(([key, value]) => [key, Number(value.toFixed(3))])), potableWaterMl },
    defense: { activeStructures: activeDefenseStructures, damagedStructures: damagedDefenseStructures, homeTroops, summedEffectiveDefensePermille: effectiveDefensePermille },
    openingBoard: { status: board?.status ?? 'not_published', rows: board?.rows.length ?? 0, rewardReceipts: population.rewardReceipts.length, itemTotals },
    marketTrades: { completed: population.marketTransactions.length,
      activeListings: population.marketListings.filter(listing => listing.status === 'active').length,
      paymentsByResource: Object.fromEntries(['food', 'water'].map(resource => [resource, population.marketTransactions
        .filter(transaction => transaction.paymentResource === resource).reduce((sum, transaction) => sum + transaction.paymentAmount, 0)])) },
    blueprintLiquidation: blueprintItemsByStatus,
    territoryUpgrades: { settlementsByLevel: territoryLevels,
      upgradedSettlements: population.chunks.reduce((sum, chunk) => sum + chunk.cold.filter(bot => bot.territoryLevel > 1).length, 0) },
    chestOwnership: { unopened: unopenedChests, opened: openedChests },
    rewardUse: { appliedFoodItems: eventInventory.reduce((sum, item) => sum + item.appliedQuantity, 0),
    consumedItems: eventInventory.reduce((sum, item) => sum + item.consumedQuantity, 0),
    blockedOpeningRewardSlots: population.rewardReceipts.flatMap(receipt => receipt.items).filter(item => item.status === 'blocked').length },
    unsupportedSystems: ['source reward-chest template to rarity mapping', 'non-opening ranked event contracts and participant-scoped settlement',
      'resource-bag contents, weapon templates, recruitment candidates, and power-heart effect'],
  };
}
for (const checkpointHour of checkpointHours) {
  const checkpointAtMs = checkpointHour * 3_600_000;
  while (state.simElapsedMs < checkpointAtMs) {
    const beforeSimElapsedMs = state.simElapsedMs;
    const beforePopulation = state.botPopulation!;
    const beforeCompletedActions = beforePopulation.completedActionCount;
    const beforeIntegratedSegments = beforePopulation.benchmarkCounters.integratedBotSegments;
    const beforePlannerExpansions = beforePopulation.benchmarkCounters.plannerExpansions;
    const beforePublicRevision = beforePopulation.publicRevision;
    const result = advanceTo(state, checkpointAtMs, {
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
      targetHour: checkpointHour,
      caughtUp: result.caughtUp,
      completedActions: state.botPopulation?.completedActionCount,
      plannerExpansions: state.botPopulation?.benchmarkCounters.plannerExpansions,
      integratedSegments: state.botPopulation?.benchmarkCounters.integratedBotSegments,
    })}\n`);
    if (state.simElapsedMs >= checkpointAtMs) break;
    const afterPopulation = state.botPopulation!;
    const madeProgress = state.simElapsedMs > beforeSimElapsedMs
      || result.events.length > 0
      || afterPopulation.completedActionCount > beforeCompletedActions
      || afterPopulation.benchmarkCounters.integratedBotSegments > beforeIntegratedSegments
      || afterPopulation.benchmarkCounters.plannerExpansions > beforePlannerExpansions
      || afterPopulation.publicRevision > beforePublicRevision;
    if (!madeProgress) throw new Error(`BOT_BENCHMARK_ADVANCE_STALLED:${beforeSimElapsedMs}`);
  }
  if (state.simElapsedMs !== checkpointAtMs) throw new Error(`BOT_BENCHMARK_CHECKPOINT_MISSED:${state.simElapsedMs}/${checkpointAtMs}`);
  const summary = checkpointSummary(checkpointHour);
  checkpointSummaries.push(summary);
  if (showProgress) process.stderr.write(`${JSON.stringify({ checkpoint: summary })}\n`);
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
  seed,
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
    aliveBots, eliminatedBots: state.botPopulation!.botCount - aliveBots, qualifiedBots, currentPlans,
    levelDistribution: Object.fromEntries([...levelCounts.entries()].sort((a, b) => a[0] - b[0])),
    talentProgressByGradeAndKind: Object.fromEntries([...talentProgress.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([talent, value]) => [talent, {
      population: value.count, meanLevel: Number((value.totalLevel / value.count).toFixed(3)), level10Count: value.level10Count,
      meanQualificationHour: value.qualifyingElapsedMs.length > 0
        ? Number((value.qualifyingElapsedMs.reduce((sum, time) => sum + time, 0) / value.qualifyingElapsedMs.length / 3_600_000).toFixed(3)) : null,
      committedActions: value.committedActions, baseXp: value.baseXp, adjustedXp: value.adjustedXp,
    }])),
    actionResults: Object.fromEntries([...actionResults.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)),
  },
  checkpointSummaries,
  timingMs: timing, totalMs: Math.round(elapsedMs() - start), memory: memory(), verified: true,
}));
