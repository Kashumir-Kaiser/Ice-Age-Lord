import { performance } from 'node:perf_hooks';
import { ACTIVE_WORLD_PACKAGE as world } from '../../packages/content/src/index.ts';
import { RULESET_VERSION } from '../../packages/content/src/sourceLock.ts';
import { createNewGame } from '../../packages/sim/src/initializer.ts';
import { advanceTo, DAY_MS } from '../../packages/sim/src/time.ts';
import type { BotColdRecord, BotPopulationState, GameState } from '../../packages/contracts/src/index.ts';
import { BOT_LORD_RULE_VERSION } from '../../packages/sim/src/bots/lord.ts';
import { BOT_MICRO, BOT_UPKEEP_UNITS_PER_PERSON_HOUR, BOT_WATER_ML_PER_PERSON_PER_DAY } from '../../packages/sim/src/bots/state.ts';

const FIXED_SEEDS = ['cal-tune-1', 'cal-tune-2', 'cal-tune-3'] as const;
const DEADLINE_MS = 115_000;
const TIERS = ['S', 'A', 'B', 'C', 'D'] as const;
const CONDITIONS = ['safe', 'resource_stressed', 'post_battle', 'supported'] as const;
const MAX_TRACES_PER_SEED = 5;

function selectedSeeds(): readonly string[] {
  const raw = process.argv.find(value => value.startsWith('--seeds='))?.slice('--seeds='.length);
  if (!raw) return FIXED_SEEDS;
  const seeds = raw.split(',').filter(Boolean);
  if (seeds.length < 1 || seeds.length > 3 || seeds.some(seed => !FIXED_SEEDS.includes(seed as typeof FIXED_SEEDS[number]))) {
    throw new Error(`Choose one to three fixed seeds: ${FIXED_SEEDS.join(',')}`);
  }
  return seeds;
}

function advanceBounded(state: GameState, target: number, startedAt: number): GameState {
  let current = state;
  while (current.simElapsedMs < target) {
    if (performance.now() - startedAt >= DEADLINE_MS) throw new Error(`BOT_SURVIVAL_DIAGNOSTIC_TIMEOUT:${Math.round(performance.now() - startedAt)}ms`);
    const priorElapsed = current.simElapsedMs;
    const result = advanceTo(current, target, { maxBoundaries: 2_000 }, world);
    current = result.state;
    if (result.caughtUp && current.simElapsedMs < target) {
      throw new Error(`BOT_SURVIVAL_DIAGNOSTIC_STOPPED_EARLY:${result.stoppedBy ?? 'unknown'}:${current.simElapsedMs}`);
    }
    if (current.simElapsedMs <= priorElapsed && result.events.length === 0 && !result.caughtUp) {
      throw new Error(`BOT_SURVIVAL_DIAGNOSTIC_STALLED:${priorElapsed}`);
    }
  }
  return current;
}

function conditionAt(bot: BotColdRecord, chunk: BotPopulationState['chunks'][number], offset: number, at: number): string {
  const lord = bot.lord;
  const dead = lord.lifeState === 'dead';
  const support = dead ? lord.deathRecord?.supportProviderId : lord.supportProviderId;
  if (support) return 'supported';
  const recentBattle = bot.actionReceipts.some(receipt => receipt.action === 'raid' && at - receipt.occurredAtElapsedMs <= 7 * DAY_MS);
  if (recentBattle || dead && lord.deathRecord?.primaryCause === 'combat') return 'post_battle';
  const consumers = chunk.population[offset]! + Number(!dead);
  const foodUnits = (chunk.foodMicro[offset]! + bot.carriedCargo.food * BOT_MICRO + lord.carriedFoodMicro) / BOT_MICRO;
  const foodRunwayHours = consumers > 0
    ? foodUnits / (consumers * BOT_UPKEEP_UNITS_PER_PERSON_HOUR.food) : Number.POSITIVE_INFINITY;
  const waterMl = bot.potableWaterMl + Math.floor(lord.carriedWaterMicro / 1_000);
  const waterRunwayHours = consumers > 0
    ? waterMl / (consumers * BOT_WATER_ML_PER_PERSON_PER_DAY) * 24 : Number.POSITIVE_INFINITY;
  const firewoodUnits = chunk.firewoodMicro[offset]! / BOT_MICRO + bot.carriedCargo.firewood;
  const firewoodRunwayHours = consumers > 0
    ? firewoodUnits / (consumers * BOT_UPKEEP_UNITS_PER_PERSON_HOUR.firewood) : Number.POSITIVE_INFINITY;
  const injured = lord.hpMicro < lord.maxHpMicro || lord.foodShortfallMs > 0 || lord.waterShortfallMs > 0 || lord.coldLoadMicro > 0;
  const stressedStores = foodRunwayHours < 24 || waterRunwayHours < 24 || firewoodRunwayHours < 24;
  return injured || stressedStores ? 'resource_stressed' : 'safe';
}

function checkpoint(state: GameState, day: number, priorDeadIds: Set<string>, traceBudget: number) {
  const population = state.botPopulation!;
  const tiers = Object.fromEntries(TIERS.map(tier => [tier, { total: 0, alive: 0, dead: 0, causes: {} as Record<string, number> }])) as Record<string, {
    total: number; alive: number; dead: number; causes: Record<string, number>;
  }>;
  const conditions: Record<string, { total: number; alive: number; dead: number }> = {
    safe: { total: 0, alive: 0, dead: 0 }, resource_stressed: { total: 0, alive: 0, dead: 0 },
    post_battle: { total: 0, alive: 0, dead: 0 }, supported: { total: 0, alive: 0, dead: 0 },
  };
  const byTierCondition = Object.fromEntries(TIERS.map(tier => [tier,
    Object.fromEntries(CONDITIONS.map(condition => [condition, { total: 0, alive: 0, dead: 0 }]))])) as Record<
      typeof TIERS[number], Record<typeof CONDITIONS[number], { total: number; alive: number; dead: number }>>;
  const causes: Record<string, number> = {};
  const newTraces: Record<string, unknown>[] = [];
  let alive = 0;
  let dead = 0;
  for (const chunk of population.chunks) for (let offset = 0; offset < chunk.count; offset += 1) {
    const bot = chunk.cold[offset]!;
    const tierName = TIERS[chunk.talentGrades[offset]!]!;
    const tier = tiers[tierName]!;
    tier.total += 1;
    const isAlive = bot.lord.lifeState === 'alive';
    const condition = conditionAt(bot, chunk, offset, state.simElapsedMs);
    conditions[condition]!.total += 1;
    byTierCondition[tierName]![condition as typeof CONDITIONS[number]]!.total += 1;
    if (isAlive) {
      alive += 1;
      tier.alive += 1;
      conditions[condition]!.alive += 1;
      byTierCondition[tierName]![condition as typeof CONDITIONS[number]]!.alive += 1;
    } else {
      dead += 1;
      tier.dead += 1;
      conditions[condition]!.dead += 1;
      byTierCondition[tierName]![condition as typeof CONDITIONS[number]]!.dead += 1;
      const death = bot.lord.deathRecord!;
      causes[death.primaryCause] = (causes[death.primaryCause] ?? 0) + 1;
      tier.causes[death.primaryCause] = (tier.causes[death.primaryCause] ?? 0) + 1;
      if (!priorDeadIds.has(bot.botId) && newTraces.length < traceBudget) {
        newTraces.push({ botId: bot.botId, tier: tierName, dayOfDeath: Number((death.atElapsedMs / DAY_MS).toFixed(3)),
          cause: death.primaryCause, contributors: death.contributors, precedingHp: death.precedingHpMicro / 1_000_000,
          regionId: bot.regionId, location: bot.lord.location, activity: bot.lord.activity,
          residents: chunk.population[offset], troops: chunk.armySize[offset], foodShortfallHours: Number((death.foodShortfallMs / 3_600_000).toFixed(2)),
          waterShortfallHours: Number((death.waterShortfallMs / 3_600_000).toFixed(2)), coldLoad: death.coldLoadMicro / 1_000_000,
          supportProviderId: death.supportProviderId,
          shelterStructureId: death.shelterStructureId,
          activeShelters: bot.structures.filter(structure => structure.status === 'active'
            && ['BP-BOT-KEEP', 'BP-BOT-HEARTH'].includes(structure.blueprintId)).map(structure => structure.blueprintId),
          foodStockUnits: Number((chunk.foodMicro[offset]! / BOT_MICRO).toFixed(3)),
          waterStockLitres: Number((bot.potableWaterMl / 1_000).toFixed(1)),
          firewoodStockUnits: Number((chunk.firewoodMicro[offset]! / BOT_MICRO).toFixed(3)) });
      }
      priorDeadIds.add(bot.botId);
    }
  }
  const byTier = Object.fromEntries(TIERS.map(tierName => {
    const tier = tiers[tierName]!;
    return [tierName, { ...tier, mortalityPercent: Number((tier.dead * 100 / Math.max(1, tier.total)).toFixed(2)) }];
  }));
  for (const tier of TIERS) for (const condition of CONDITIONS) {
    const row = byTierCondition[tier]![condition]!;
    Object.assign(row, { mortalityPercent: Number((row.dead * 100 / Math.max(1, row.total)).toFixed(2)) });
  }
  return { day, alive, dead, total: alive + dead,
    mortalityPercent: Number((dead * 100 / Math.max(1, alive + dead)).toFixed(2)),
    byTier, byCondition: conditions, byTierCondition, causes, newDeathTraces: newTraces };
}

const startedAt = performance.now();
const seeds = selectedSeeds();
const results: Record<string, unknown>[] = [];
for (const seed of seeds) {
  const state = createNewGame({ saveId: `survival-calibration-${seed}`, campaignId: `survival-calibration-${seed}`,
    soulId: 'LI_LAN', worldPackageId: world.id, rulesetVersion: RULESET_VERSION,
    contentVersion: world.contentVersion, seed }, world);
  if (state.botPopulation?.botCount !== 1_023) throw new Error('BOT_SURVIVAL_DIAGNOSTIC_REQUIRES_STANDARD_1023_POPULATION');
  const priorDeadIds = new Set<string>();
  const snapshots = [];
  let current = state;
  let traceCount = 0;
  for (const day of [1, 3, 7] as const) {
    current = advanceBounded(current, day * DAY_MS, startedAt);
    const snapshot = checkpoint(current, day, priorDeadIds, Math.max(0, MAX_TRACES_PER_SEED - traceCount));
    traceCount += snapshot.newDeathTraces.length;
    snapshots.push(snapshot);
  }
  results.push({ seed, snapshots });
}

const elapsedMs = Math.round(performance.now() - startedAt);
if (elapsedMs > 120_000) throw new Error(`BOT_SURVIVAL_DIAGNOSTIC_TIMEOUT:${elapsedMs}ms`);
process.stdout.write(`${JSON.stringify({ ruleVersion: BOT_LORD_RULE_VERSION, seeds, elapsedMs, results })}\n`);
