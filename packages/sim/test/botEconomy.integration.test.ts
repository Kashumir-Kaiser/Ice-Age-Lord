import assert from 'node:assert/strict';
import test from 'node:test';
import type { BotColdRecord, BotStateChunk } from '../../contracts/src/index.ts';
import { ACTIVE_WORLD_PACKAGE } from '../../content/src/index.ts';
import { deterministicChestOutcome } from '../src/chestLoot.ts';
import { BOT_RESOURCE_CAP_UNITS, BOT_STARVATION_LOSS_INTERVAL_MS, acquireBotChest, botResourceCapacityUnits, completePlan, integrateBot, integrateBotResourceBalances, openBotChest, projectedBotWaterMl } from '../src/bots/economy.ts';
import { botCohortPower, botHomeCohortCounts, botMovementCohortCounts, botSettlementDefensePermille, resolveBotSettlementBattle } from '../src/bots/combat.ts';
import { chooseBotDecision } from '../src/bots/planner.ts';
import { botChunkHash, botPopulationNeedsMigration, botPopulationRoot, botRowHash, botCombatPermille, botConstructionPermille, botTalentXpMultiplierPermille, BOT_BLUEPRINT_RULE_VERSION, BOT_EVENT_REWARD_RULE_VERSION, BOT_MICRO, BOT_SIMULATION_RULE_VERSION, BOT_PLANNER_RULE_VERSION, BOT_UPKEEP_UNITS_PER_PERSON_HOUR, hydrateBotHotArrays, migrateBotPopulation, serializeBotHotArrays, verifyBotPopulation } from '../src/bots/state.ts';
import { generateBotPopulation } from '../src/bots/generation.ts';
import { nextBotWeatherStormAt } from '../src/bots/weather.ts';
import { awardBotOpeningRankRewards } from '../src/bots/rewards.ts';
import { BOT_MARKET_ACCESS_RADIUS_MM, botMarketAsk } from '../src/bots/market.ts';
import { createBotLord } from '../src/bots/lord.ts';

type ResourceValues = {
  food: number;
  foodNode: number;
  wood: number;
  woodland: number;
  firewood: number;
  stone: number;
  stoneNode: number;
  ore: number;
  oreNode: number;
};

function setup(initial: ResourceValues, population = 20, gathering = { food: 0, wood: 10, stone: 0, ore: 0 }) {
  const one = (value = 0) => [value];
  const hot = {
    foodMicro: one(initial.food), foodRemainder: one(), foodNodeMicro: one(initial.foodNode), foodNodeRemainder: one(), foodConsumptionRemainder: one(),
    woodMicro: one(initial.wood), woodRemainder: one(), woodNodeMicro: one(initial.woodland), woodNodeRemainder: one(),
    firewoodMicro: one(initial.firewood), firewoodRemainder: one(), firewoodNodeRemainder: one(), firewoodConsumptionRemainder: one(),
    stoneMicro: one(initial.stone), stoneRemainder: one(), stoneNodeMicro: one(initial.stoneNode), stoneNodeRemainder: one(),
    oreMicro: one(initial.ore), oreRemainder: one(), oreNodeMicro: one(initial.oreNode), oreNodeRemainder: one(),
    alive: one(1), lastIntegratedAtElapsedMs: one(), nextWakeAtElapsedMs: one(), population: one(population), armySize: one(5),
    workers: one(Math.max(0, population - 5)), deathCount: one(), armyHealthPermille: one(1_000),
    workKind: one(), assignedWorkers: one(), workProgress: one(), workRequired: one(),
  } as unknown as Parameters<typeof integrateBotResourceBalances>[2];
  const chunk = { population: [population], farmCount: [0], millCount: [0], quarryCount: [0] } as unknown as BotStateChunk;
  const cold = { workforce: {
    gatherFood: gathering.food, gatherWood: gathering.wood, gatherStone: gathering.stone, gatherOre: gathering.ore,
    farmers: 0, millWorkers: 0, quarryWorkers: 0, smiths: 0, builders: 0, scouts: 0, guards: 0, recruiters: 0,
  }, botId: 'BOT-P0-TEST', ordinal: 1, position: { xMm: 0, yMm: 0, sourceZMetres: 0 },
    lord: createBotLord('BOT-P0-TEST', { xMm: 0, yMm: 0, sourceZMetres: 0 }),
    lordFate: { status: 'active', changedAtElapsedMs: null, cause: null, triggerId: null },
    potableWaterMl: 500_000, localIceRemainingMl: 2_000_000, waterConsumptionRemainder: 0,
    dehydrationExposureMs: 0, lordStarvationExposureMs: 0, lordDehydrationExposureMs: 0, lordColdExposureMs: 0,
    starvationExposureMs: 0, coldExposureMs: 0, cohorts: [], structures: [], eventInventory: [], searchSources: [],
    casualtiesByCause: { starvation: 0, dehydration: 0, fuelExhaustion: 0, regionalBlizzard: 0, battle: 0, wildlife: 0, unattributed: 0 },
    currentPlan: null, armyMovement: null, actionReceipts: [], actionReceiptArchive: [] } as BotColdRecord;
  return { chunk, cold, hot };
}

function integrate(initial: ResourceValues, segments: number[], population = 20, gathering = { food: 0, wood: 10, stone: 0, ore: 0 }) {
  const { chunk, cold, hot } = setup(initial, population, gathering);
  for (const milliseconds of segments) integrateBotResourceBalances(cold, chunk, hot, 0, milliseconds);
  return hot;
}

const empty: ResourceValues = { food: 0, foodNode: 0, wood: 0, woodland: 1_000 * BOT_MICRO, firewood: 0,
  stone: 0, stoneNode: 0, ore: 0, oreNode: 0 };
const marketFixtureState = { survival: { environment: null } } as never;
const warmEnvironment = { apparentTemperatureC: 20, windKph: 0, wetness: 0, activityFactor: 1 as const,
  insulation: 1, shelter: 1 };

test('fuel and food conservation agree across 1s, 3s, 5s, irregular and large segments', () => {
  const total = 15_000;
  const oneSegment = integrate(empty, [total]);
  const oneSecond = integrate(empty, Array.from({ length: 15 }, () => 1_000));
  const threeSecond = integrate(empty, Array.from({ length: 5 }, () => 3_000));
  const fiveSecond = integrate(empty, Array.from({ length: 3 }, () => 5_000));
  const irregular = integrate(empty, [333, 2_017, 1_111, 4_539, 7_000]);
  for (const field of ['foodMicro', 'foodNodeMicro', 'woodMicro', 'woodNodeMicro', 'firewoodMicro', 'stoneMicro', 'oreMicro'] as const) {
    assert.equal(oneSegment[field][0], oneSecond[field][0], field);
    assert.equal(oneSegment[field][0], threeSecond[field][0], field);
    assert.equal(oneSegment[field][0], fiveSecond[field][0], field);
    assert.equal(oneSegment[field][0], irregular[field][0], field);
  }
  assert.equal(oneSegment.woodNodeMicro[0]! + oneSegment.firewoodMicro[0]!
    + oneSegment.woodMicro[0]! + 6_255
    + Math.round(BOT_UPKEEP_UNITS_PER_PERSON_HOUR.firewood * BOT_MICRO / 3_600) * total / 1_000,
  empty.woodland,
  'woodland debit is credited to fuel/log stocks, resident upkeep and separate owner-lord upkeep');
  assert.equal(oneSegment.foodMicro[0]! + oneSegment.foodNodeMicro[0]!, empty.foodNode, 'food remains conserved');
});

test('territory upgrades increase storage and housing capacity without changing lord XP level', () => {
  const population = generateBotPopulation('territory-upgrade-fixture', ACTIVE_WORLD_PACKAGE);
  const chunk = population.chunks[0]!;
  const source = chunk.cold[0]!;
  const plan = { goal: 'expand' as const, action: 'upgrade_territory' as const, actionId: `${source.botId}:ACT:TERRITORY-2`,
    startedAtElapsedMs: 0, completesAtElapsedMs: 24 * 60 * 60_000, targetId: `${source.botId}:TERRITORY:2`,
    workersAssigned: 3, reserved: { food: 0, wood: 70, stone: 60, ore: 0 },
    startingResourcesMicro: { food: chunk.foodMicro[0]!, wood: chunk.woodMicro[0]!, stone: chunk.stoneMicro[0]!, ore: chunk.oreMicro[0]! },
    expectedOutcome: 'upgrade to territory level 2' };
  const cold = { ...source, territoryLevel: 1, currentPlan: plan } as BotColdRecord;
  const coldRows = chunk.cold.slice() as BotColdRecord[];
  coldRows[0] = cold;
  const hot = hydrateBotHotArrays(chunk);
  hot.woodMicro[0] = 100 * BOT_MICRO;
  hot.stoneMicro[0] = 100 * BOT_MICRO;
  hot.levels[0] = 100;
  const levelBefore = hot.levels[0];
  const result = completePlan(population, chunk, hot, coldRows, 0, cold, 'A', {} as never, plan.completesAtElapsedMs);
  assert.equal(result.cold.territoryLevel, 2);
  assert.equal(hot.levels[0], levelBefore, 'territory progression does not directly change lord XP level');
  assert.equal(botResourceCapacityUnits('food', result.cold.territoryLevel), 2_250);
  assert.equal(botResourceCapacityUnits('wood', result.cold.territoryLevel), 1_500);
  assert.ok(result.events.some(event => event.type === 'bot_territory_upgraded'));
});

test('matched talent grades strengthen only their specialty and apply the opposing penalty once', () => {
  assert.equal(botCombatPermille('S', 'combat'), 1_600);
  assert.equal(botCombatPermille('S', 'production'), 800);
  assert.equal(botConstructionPermille('S', 'production'), 1_600);
  assert.equal(botConstructionPermille('S', 'combat'), 800);
  assert.equal(botCombatPermille('D', 'combat'), 1_080);
  assert.equal(botConstructionPermille('D', 'production'), 1_080);
  assert.equal(botTalentXpMultiplierPermille('S', 'combat'), 2_000);
  assert.equal(botTalentXpMultiplierPermille('S', 'production'), 650);
});

test('regional blizzards are seeded and independent of integration segment size', () => {
  const saveSeed = 'regional-weather-segment-fixture';
  const population = generateBotPopulation(saveSeed, ACTIVE_WORLD_PACKAGE);
  const chunk = population.chunks[0]!;
  const initialCold = chunk.cold[0]!;
  let weatherSeed = saveSeed;
  while (nextBotWeatherStormAt(weatherSeed, initialCold, 0, 48 * 60 * 60_000) === null) weatherSeed += '-next';
  const run = (segments: readonly number[]) => {
    let cold = initialCold;
    const hot = hydrateBotHotArrays(chunk);
    const events: string[] = [];
    for (const at of segments) {
      const result = integrateBot(cold, hot, hot, 0, at, 'S', 'combat', weatherSeed);
      cold = result.cold;
      events.push(...result.events.filter(event => event.type === 'bot_weather_hazard').map(event => String(event.occurredAtElapsedMs)));
    }
    return { cold, hot, events };
  };
  const twoDays = 48 * 60 * 60_000;
  const single = run([twoDays]);
  const segmented = run([6, 12, 18, 24, 30, 36, 42, 48].map(hours => hours * 60 * 60_000));
  assert.deepEqual(single.events, segmented.events);
  assert.deepEqual(single.events, [...new Set(single.events)].sort((a, b) => Number(a) - Number(b)));
  assert.equal(single.hot.firewoodMicro[0], segmented.hot.firewoodMicro[0]);
  assert.equal(single.hot.foodMicro[0], segmented.hot.foodMicro[0]);
  assert.equal(single.hot.population[0], segmented.hot.population[0]);
  assert.equal(single.cold.lordFate.status, segmented.cold.lordFate.status);
  assert.ok(single.events.length > 0, `seed ${weatherSeed} must produce a storm in the tested horizon`);
});

test('full storage does not consume woodland for discarded overflow', () => {
  const full: ResourceValues = { ...empty, woodland: 500 * BOT_MICRO,
    food: BOT_RESOURCE_CAP_UNITS.food * BOT_MICRO, wood: BOT_RESOURCE_CAP_UNITS.wood * BOT_MICRO,
    firewood: BOT_RESOURCE_CAP_UNITS.firewood * BOT_MICRO, stone: BOT_RESOURCE_CAP_UNITS.stone * BOT_MICRO,
    ore: BOT_RESOURCE_CAP_UNITS.ore * BOT_MICRO };
  const one = integrate(full, [60_000], 0);
  const many = integrate(full, Array.from({ length: 60 }, () => 1_000), 0);
  const lordFuelUpkeep = Math.round(BOT_UPKEEP_UNITS_PER_PERSON_HOUR.firewood * BOT_MICRO / 3_600) * 60;
  assert.equal(one.woodNodeMicro[0], full.woodland - lordFuelUpkeep);
  assert.equal(many.woodNodeMicro[0], full.woodland - lordFuelUpkeep);
  assert.equal(one.firewoodMicro[0], full.firewood);
  assert.equal(one.woodMicro[0], full.wood);
  assert.equal(one.firewoodMicro[0], many.firewoodMicro[0]);
  assert.equal(one.woodMicro[0], many.woodMicro[0]);
});

test('upkeep may refill available storage without debiting more than delivered production', () => {
  const nearFull: ResourceValues = { ...empty, woodland: 500 * BOT_MICRO, foodNode: 10 * BOT_MICRO,
    firewood: BOT_RESOURCE_CAP_UNITS.firewood * BOT_MICRO, food: BOT_RESOURCE_CAP_UNITS.food * BOT_MICRO - 100_000 };
  const one = integrate(nearFull, [60_000], 20, { food: 10, wood: 10, stone: 0, ore: 0 });
  const many = integrate(nearFull, Array.from({ length: 60 }, () => 1_000), 20, { food: 10, wood: 10, stone: 0, ore: 0 });
  assert.equal(one.foodMicro[0], nearFull.food + (nearFull.foodNode - one.foodNodeMicro[0]!) - 63_000,
    'food production and upkeep net to the stored amount');
  assert.equal(one.foodMicro[0], many.foodMicro[0]);
  assert.equal(one.firewoodMicro[0], many.firewoodMicro[0]);
  assert.ok(one.foodMicro[0]! <= BOT_RESOURCE_CAP_UNITS.food * BOT_MICRO);
});

test('finite shared woodland and zero-stock recovery preserve the same segment result', () => {
  const tinyWoodland: ResourceValues = { ...empty, woodland: 2 };
  const noOwnerIntegration = (segments: number[]) => {
    const fixture = setup(tinyWoodland, 0);
    fixture.cold = { ...fixture.cold, lord: { ...fixture.cold.lord, location: 'field' } };
    for (const milliseconds of segments) integrateBotResourceBalances(fixture.cold, fixture.chunk, fixture.hot, 0, milliseconds);
    return fixture.hot;
  };
  const one = noOwnerIntegration([5_000]);
  const many = noOwnerIntegration([1_000, 1_000, 1_000, 1_000, 1_000]);
  assert.equal(one.woodNodeMicro[0], 0);
  assert.equal(one.firewoodMicro[0]! + one.woodMicro[0]!, 2, 'each woodland micro-unit is credited once');
  assert.equal(one.firewoodMicro[0], many.firewoodMicro[0]);
  assert.equal(one.woodMicro[0], many.woodMicro[0]);

  const emptyStock = setup({ ...empty, woodland: 0, foodNode: 1_000 * BOT_MICRO }, 1, { food: 4, wood: 0, stone: 0, ore: 0 });
  integrateBotResourceBalances(emptyStock.cold, emptyStock.chunk, emptyStock.hot, 0, 3_600_000);
  assert.ok(emptyStock.hot.foodMicro[0]! > 0, 'food gathering restores a zero balance when a finite node has stock');
});

test('long advances split at finite food and woodland exhaustion before charging exposure', () => {
  const duration = 48 * 60 * 60_000;
  const run = (source: ResourceValues, segments: readonly number[], gathering: { food: number; wood: number; stone: number; ore: number }) => {
    const fixture = setup(source, 20, gathering);
    let cold = { ...fixture.cold, botId: 'BOT-P0-0010' } as BotColdRecord;
    let at = 0;
    for (const part of segments) {
      at += part;
      cold = integrateBot(cold, fixture.chunk, fixture.hot, 0, at, 'A', 'production', '', warmEnvironment).cold;
      if (cold.lord.lifeState === 'dead') break;
    }
    return { cold, hot: fixture.hot };
  };
  const hourly = Array.from({ length: 48 }, () => 60 * 60_000);
  const foodSource: ResourceValues = { ...empty, foodNode: 2 * BOT_MICRO, firewood: 200 * BOT_MICRO };
  const foodOne = run(foodSource, [duration], { food: 1, wood: 0, stone: 0, ore: 0 });
  const foodHourly = run(foodSource, hourly, { food: 1, wood: 0, stone: 0, ore: 0 });
  assert.equal(foodOne.hot.foodNodeMicro[0], 0);
  assert.equal(foodOne.hot.foodMicro[0], foodHourly.hot.foodMicro[0]);
  assert.equal(foodOne.hot.population[0], foodHourly.hot.population[0]);
  assert.equal(foodOne.hot.deathCount[0], foodHourly.hot.deathCount[0]);
  assert.deepEqual(foodOne.cold.casualtiesByCause, foodHourly.cold.casualtiesByCause);

  const woodland: ResourceValues = { ...empty, woodland: 2, food: 200 * BOT_MICRO };
  const woodOne = run(woodland, [duration], { food: 0, wood: 10, stone: 0, ore: 0 });
  const woodHourly = run(woodland, hourly, { food: 0, wood: 10, stone: 0, ore: 0 });
  assert.equal(woodOne.hot.woodNodeMicro[0], 0);
  assert.equal(woodOne.hot.firewoodMicro[0], woodHourly.hot.firewoodMicro[0]);
  assert.equal(woodOne.hot.population[0], woodHourly.hot.population[0]);
  assert.equal(woodOne.hot.deathCount[0], woodHourly.hot.deathCount[0]);
  assert.deepEqual(woodOne.cold.casualtiesByCause, woodHourly.cold.casualtiesByCause);
});

test('a depleted food node only adds starvation exposure after the final segment supply is consumed', () => {
  const hour = 60 * 60_000;
  const fixture = setup({ ...empty, foodNode: 4.5 * BOT_MICRO }, 24,
    { food: 1, wood: 0, stone: 0, ore: 0 });
  const cold = { ...fixture.cold, botId: 'BOT-P0-0010', starvationExposureMs: 0, coldExposureMs: 0,
    cohorts: [], structures: [], currentPlan: null, eventInventory: [] } as unknown as BotColdRecord;
  const result = integrateBot(cold, fixture.chunk, fixture.hot, 0, hour, 'S', 'production', '', warmEnvironment);
  assert.equal(fixture.hot.foodNodeMicro[0], 0);
  assert.equal(fixture.hot.foodMicro[0], 0, 'production exactly covers upkeep through source exhaustion');
  assert.equal(fixture.hot.deathCount[0], 0);
  assert.equal(result.cold.starvationExposureMs, 0);
});

test('a stocked lord survives quiet time and projected preparation enters at its completion boundary', () => {
  const day = 24 * 60 * 60_000;
  const fixture = setup({ ...empty, food: 1_000 * BOT_MICRO, firewood: 1_000 * BOT_MICRO }, 10);
  const cold = { ...fixture.cold, botId: 'BOT-P0-0010' } as BotColdRecord;
  const survived = integrateBot(cold, fixture.chunk, fixture.hot, 0, day, 'A', 'production', '', warmEnvironment);
  assert.equal(survived.cold.lordFate.status, 'active');
  assert.equal(fixture.hot.alive[0], 1);
  assert.equal(fixture.hot.deathCount[0], 0);

  const planCold = { ...cold, potableWaterMl: 0, localIceRemainingMl: 100_000,
    currentPlan: { action: 'prepare_water', completesAtElapsedMs: 2 * 60 * 60_000 } } as BotColdRecord;
  assert.equal(projectedBotWaterMl(planCold, 10, 0, 6 * 60 * 60_000), 46_333,
    'a 50L batch is credited after two hours, then four hours of resident and owner use is charged');
});

test('dehydration can eliminate the lord while civilians and army remain', () => {
  const hour = 60 * 60_000;
  const fixture = setup({ ...empty, food: 1_000 * BOT_MICRO, firewood: 1_000 * BOT_MICRO }, 10);
  const cold = { ...fixture.cold, botId: 'BOT-P0-0010', potableWaterMl: 0 } as BotColdRecord;
  const result = integrateBot(cold, fixture.chunk, fixture.hot, 0, 72 * hour, 'S', 'combat', '', warmEnvironment);
  assert.equal(result.cold.lordFate.status, 'dead');
  assert.equal(result.cold.lordFate.cause, 'dehydration');
  assert.ok(result.cold.lordFate.changedAtElapsedMs! > 36 * hour && result.cold.lordFate.changedAtElapsedMs! < 72 * hour,
    'personal dehydration damage crosses the 36-hour band and reaches zero HP before day three');
  assert.equal(result.cold.lordFate.triggerId, result.cold.lord.deathRecord?.deathEventId);
  assert.ok(fixture.hot.population[0]! < 10 && fixture.hot.population[0]! > 0,
    'resident dehydration casualties accrue independently until the personal death boundary');
  assert.ok(fixture.hot.armySize[0]! > 0, 'lord death does not imply an army wipe');
  assert.equal(fixture.hot.alive[0], 0, 'an eliminated lord stops scheduling actions');
  assert.equal(result.cold.casualtiesByCause.dehydration, 3, 'resident losses retain their durable cause');
  assert.ok(result.events.some(event => event.type === 'bot_lord_eliminated'));
});

test('water at the exact rescue boundary prevents dehydration deaths and lord elimination', () => {
  const hour = 60 * 60_000;
  const fixture = setup({ ...empty, food: 1_000 * BOT_MICRO, firewood: 1_000 * BOT_MICRO }, 10);
  const cold = { ...fixture.cold, botId: 'BOT-P0-0010', potableWaterMl: 1,
    dehydrationExposureMs: 24 * hour, lordDehydrationExposureMs: 71 * hour } as BotColdRecord;
  const rescued = { ...cold, potableWaterMl: 20_000, dehydrationExposureMs: 24 * hour,
    lordDehydrationExposureMs: 71 * hour } as BotColdRecord;
  const result = integrateBot(rescued, fixture.chunk, fixture.hot, 0, hour, 'A', 'production');
  assert.equal(result.cold.lordFate.status, 'active');
  assert.equal(fixture.hot.deathCount[0], 0);
  assert.equal(result.cold.dehydrationExposureMs, 0);
  assert.equal(result.cold.casualtiesByCause.dehydration, 0);
});

test('survival casualties reconcile the persisted detachment sent on an active route', () => {
  const fixture = setup({ ...empty, woodland: 0 }, 5, { food: 0, wood: 0, stone: 0, ore: 0 });
  const cohort = { id: 'cohort-away', templateId: 'unit', firstMemberOrdinal: 1, livingCount: 5, recruitedCount: 5,
    lostCount: 0, level: 1, xp: 0, healthPerMember: 100, maxHealthPerMember: 100,
    equipmentTemplateIds: [], order: 'raid' as const, location: { xMm: 0, yMm: 0 } };
  const cold = { ...fixture.cold, botId: 'BOT-P0-0010', starvationExposureMs: BOT_STARVATION_LOSS_INTERVAL_MS - 1,
    coldExposureMs: 0, cohorts: [cohort], structures: [], eventInventory: [],
    currentPlan: { goal: 'contest', action: 'raid', actionId: 'raid-one', startedAtElapsedMs: 0, completesAtElapsedMs: 3_600_000,
      targetId: 'BOT-P0-0011', workersAssigned: 1, reserved: { food: 0, wood: 0, stone: 0, ore: 0 },
      startingResourcesMicro: { food: 0, wood: 0, stone: 0, ore: 0 }, expectedOutcome: 'test raid' },
    armyMovement: { orderId: 'raid-one', targetId: 'BOT-P0-0011', unitKind: 'army', unitCount: 5,
      cohortMemberCounts: [{ cohortId: cohort.id, memberCount: 5 }], from: { xMm: 0, yMm: 0 }, to: { xMm: 10, yMm: 0 },
      startedAtElapsedMs: 0, arrivesAtElapsedMs: 7_200_000, status: 'outbound' },
  } as unknown as BotColdRecord;

  const result = integrateBot(cold, fixture.chunk, fixture.hot, 0, 60 * 60_000, 'S', 'combat');
  assert.equal(fixture.hot.population[0], 4);
  assert.equal(fixture.hot.armySize[0], 4);
  assert.equal(result.cold.armyMovement?.unitCount, 4);
  assert.deepEqual(result.cold.armyMovement?.cohortMemberCounts, [{ cohortId: cohort.id, memberCount: 4 }]);
});

test('resident extinction leaves the owner active and clears a scout with no surviving workers', () => {
  const fixture = setup(empty, 1, { food: 0, wood: 0, stone: 0, ore: 0 });
  fixture.hot.armySize[0] = 0;
  fixture.hot.workers[0] = 1;
  const cold = { ...fixture.cold, botId: 'BOT-P0-0010', starvationExposureMs: BOT_STARVATION_LOSS_INTERVAL_MS - 1,
    coldExposureMs: 0, cohorts: [], structures: [], eventInventory: [], currentPlan: null,
    workforce: { ...fixture.cold.workforce, scouts: 1 },
    armyMovement: { orderId: 'scout-one', targetId: 'site-one', unitKind: 'scout', unitCount: 1,
      from: { xMm: 0, yMm: 0 }, to: { xMm: 10, yMm: 0 }, startedAtElapsedMs: 0, arrivesAtElapsedMs: 7_200_000, status: 'outbound' },
  } as unknown as BotColdRecord;

  const result = integrateBot(cold, fixture.chunk, fixture.hot, 0, 1, 'S', 'combat');
  assert.equal(fixture.hot.population[0], 0);
  assert.equal(fixture.hot.alive[0], 1, 'the settlement owner has an independent life state');
  assert.equal(result.cold.lord.lifeState, 'alive');
  assert.equal(result.cold.armyMovement, null);
});

test('the planner does not dispatch scouts without workers to send', () => {
  const generated = generateBotPopulation('zero-scout-worker-fixture', ACTIVE_WORLD_PACKAGE);
  const source = generated.chunks[0]!;
  const offset = 0;
  const rows = {
    ...source,
    population: source.population.slice(), workers: source.workers.slice(), armySize: source.armySize.slice(),
    foodMicro: source.foodMicro.slice(), woodMicro: source.woodMicro.slice(), stoneMicro: source.stoneMicro.slice(),
    oreMicro: source.oreMicro.slice(), firewoodMicro: source.firewoodMicro.slice(),
    farmCount: source.farmCount.slice(), millCount: source.millCount.slice(), quarryCount: source.quarryCount.slice(),
    barracksCount: source.barracksCount.slice(), buildingCount: source.buildingCount.slice(),
  };
  rows.population[offset] = 1;
  rows.workers[offset] = 0;
  rows.armySize[offset] = 0;
  rows.foodMicro[offset] = 1_000 * BOT_MICRO;
  rows.woodMicro[offset] = 500 * BOT_MICRO;
  rows.stoneMicro[offset] = 500 * BOT_MICRO;
  rows.oreMicro[offset] = 200 * BOT_MICRO;
  rows.firewoodMicro[offset] = 500 * BOT_MICRO;
  rows.farmCount[offset] = 0;
  rows.millCount[offset] = 0;
  rows.quarryCount[offset] = 0;
  rows.barracksCount[offset] = 0;
  rows.buildingCount[offset] = 0;
  const bot = source.cold[offset]!;
  const baseCold = { ...bot, blueprintIds: [], structures: [], knownTargets: [], carriedCargo: { food: 0, wood: 0, stone: 0, ore: 0, firewood: 0 } };
  const scoutSources = [
    { id: 'contact', kind: 'survey_site' as const, remainingActions: 1, position: bot.position, discovered: false,
      eligibleBlueprintIds: [], contactTargetId: 'BOT-P0-0011' },
    { id: 'blueprint-cache', kind: 'survey_site' as const, remainingActions: 1, position: bot.position, discovered: true,
      eligibleBlueprintIds: ['BP-BOT-FARM'] },
  ];

  for (const sourceRow of scoutSources) {
    const decision = chooseBotDecision({ ...baseCold, searchSources: [sourceRow] }, rows, offset,
      'S', 'combat', 10 * 60 * 60_000);
    assert.ok(!['scout', 'search', 'hunt'].includes(decision.plan.action),
      `${decision.plan.action} must not be selected when no scout workers can be assigned`);
    assert.equal(decision.workforce.scouts, 0);
  }
});

test('opening food rewards enter stock at their award time before later hunger exposure', () => {
  const hour = 60 * 60_000;
  const setupState = setup(empty, 20, { food: 0, wood: 0, stone: 0, ore: 0 });
  const cold = {
    ...setupState.cold,
    botId: 'BOT-P0-0010',
    starvationExposureMs: 21 * hour,
    coldExposureMs: 0,
    cohorts: [],
    structures: [],
    currentPlan: null,
    eventInventory: [{ instanceId: 'reward-food', itemTemplateId: 'MEAT', quantity: 10, appliedQuantity: 0, consumedQuantity: 0,
      eventId: 'EV01-OPENING-LEVEL', rewardReceiptId: 'opening-reward', awardedAtElapsedMs: hour, ruleVersion: BOT_EVENT_REWARD_RULE_VERSION }],
  } as unknown as BotColdRecord;

  const result = integrateBot(cold, setupState.chunk, setupState.hot, 0, 3 * hour, 'S', 'combat');
  assert.equal(setupState.hot.deathCount[0], 1, 'only exposure before the reward boundary is charged');
  assert.equal(setupState.hot.population[0], 19);
  assert.ok(setupState.hot.foodMicro[0]! > 0, 'the awarded food protects the following interval');
  assert.equal(result.cold.eventInventory[0]!.quantity, 0);
  assert.equal(result.cold.eventInventory[0]!.appliedQuantity, 10, 'food application remains attributable after the inventory reaches zero');
});

test('a committed recovery spends one medicine and retains the consumed quantity in the item ledger', () => {
  const population = generateBotPopulation('medicine-use-fixture', ACTIVE_WORLD_PACKAGE);
  const chunk = population.chunks[0]!;
  const hot = hydrateBotHotArrays(chunk);
  const source = chunk.cold[0]!;
  const medicine = { instanceId: 'reward-medicine', itemTemplateId: 'BASIC_MEDICINE', quantity: 1,
    appliedQuantity: 0, consumedQuantity: 0, eventId: 'EV01-OPENING-LEVEL', rewardReceiptId: 'opening-reward',
    awardedAtElapsedMs: 0, ruleVersion: BOT_EVENT_REWARD_RULE_VERSION };
  const cohort = { id: 'injured', templateId: 'unit', firstMemberOrdinal: 1, livingCount: 5, recruitedCount: 5, lostCount: 0,
    level: 1, xp: 0, healthPerMember: 20, maxHealthPerMember: 100, equipmentTemplateIds: [], order: 'defend' as const, location: source.position };
  const at = 60 * 60_000;
  const plan = { goal: 'recover' as const, action: 'recover' as const, actionId: 'recover-with-medicine', startedAtElapsedMs: 0,
    completesAtElapsedMs: at, targetId: cohort.id, workersAssigned: 1,
    reserved: { food: 0, wood: 0, stone: 0, ore: 0 },
    startingResourcesMicro: { food: hot.foodMicro[0]!, wood: hot.woodMicro[0]!, stone: hot.stoneMicro[0]!, ore: hot.oreMicro[0]! }, expectedOutcome: 'recover injured unit' };
  const cold = { ...source, cohorts: [cohort], eventInventory: [medicine], currentPlan: plan } as BotColdRecord;
  const coldRows = chunk.cold.slice() as BotColdRecord[];
  coldRows[0] = cold;
  const result = completePlan(population, chunk, hot, coldRows, 0, cold, 'A', {} as never, at);
  assert.equal(result.cold.cohorts[0]!.healthPerMember, 100);
  assert.equal(result.cold.eventInventory[0]!.quantity, 0);
  assert.equal(result.cold.eventInventory[0]!.consumedQuantity, 1);
  assert.ok(result.events.some(event => event.type === 'bot_cohort_recovered'
    && event.payload.medicineUsed === medicine.instanceId));
});

test('rank reward settlement keeps source-blocked slots and delivers only usable assets', () => {
  const generated = generateBotPopulation('blocked-reward-slot-fixture', ACTIVE_WORLD_PACKAGE);
  const bot = generated.chunks[0]!.cold[0]!;
  const actionReceiptId = `${bot.botId}:ACT:QUALIFY`;
  const population = { ...generated, eventReceipts: [{ id: `EV01:${actionReceiptId}`, eventId: 'EV01-OPENING-LEVEL',
    botId: bot.botId, actionReceiptId, scoreRule: 'BOT-OPENING-LEVEL-10-RECEIPT-1.0', scoreDelta: 1, occurredAtElapsedMs: 1 }] };
  const rows = [{ playerId: bot.botId, rank: 1, rewardBandId: 'RANK_1', rewardItems: [
    { instanceId: 'slot-meat', itemTemplateId: 'MEAT', quantity: 200, status: 'committed' as const, blocker: null },
    { instanceId: 'slot-bag', itemTemplateId: 'MEDIUM_RESOURCE_BAG', quantity: 10, status: 'blocked' as const, blocker: 'RESOURCE_BAG_CONTENTS_NOT_COMPILED' },
  ] }];
  const settled = awardBotOpeningRankRewards(population, rows, 144 * 60 * 60_000);
  const receipt = settled.rewardReceipts[0]!;
  assert.deepEqual(receipt.items.map(item => [item.itemTemplateId, item.status, item.blocker, item.inventoryQuantity]), [
    ['MEAT', 'committed', null, 200], ['MEDIUM_RESOURCE_BAG', 'blocked', 'RESOURCE_BAG_CONTENTS_NOT_COMPILED', 0],
  ]);
  const delivered = settled.chunks[0]!.cold[0]!.eventInventory;
  assert.equal(delivered.length, 1);
  assert.equal(delivered[0]!.itemTemplateId, 'MEAT');
  assert.equal(delivered[0]!.quantity, 200);
  assert.equal(delivered[0]!.appliedQuantity, 0);
  assert.equal(delivered[0]!.consumedQuantity, 0);
  assert.deepEqual(awardBotOpeningRankRewards(settled, rows, 144 * 60 * 60_000), settled, 'reward replay is idempotent');

  const legacyReceiptId = `EV01-OPENING-LEVEL:${bot.botId}:REWARD`;
  const legacy = { ...settled, rewardReceipts: [{ ...receipt, id: legacyReceiptId }] };
  assert.deepEqual(awardBotOpeningRankRewards(legacy, rows, 144 * 60 * 60_000), legacy,
    'a save using the pre-save-scoped receipt identity cannot mint a second entitlement');
});

test('away cohorts do not contribute to home defense power', () => {
  const cohorts = [
    { id: 'cohort-a', livingCount: 4, level: 2, equipmentTemplateIds: ['BOT-WEAPON-IRON-1.0'], healthPerMember: 100, maxHealthPerMember: 100 },
    { id: 'cohort-b', livingCount: 3, level: 1, equipmentTemplateIds: [], healthPerMember: 100, maxHealthPerMember: 100 },
  ];
  const cold = { botId: 'defender', cohorts, armyMovement: { unitKind: 'army', unitCount: 2,
    cohortMemberCounts: [{ cohortId: 'cohort-a', memberCount: 2 }] } } as unknown as BotColdRecord;
  const away = botMovementCohortCounts(cold, cold.armyMovement!);
  const home = botHomeCohortCounts(cold);
  assert.equal(away.get('cohort-a'), 2);
  assert.equal(home.get('cohort-a'), 2);
  assert.equal(home.get('cohort-b'), 3);
  assert.ok(botCohortPower(cold, 'A', 'combat', home) < botCohortPower(cold, 'A', 'combat'));
});

test('operational and damaged defenses affect an otherwise undefended settlement battle', () => {
  const cold = { botId: 'defender', cohorts: [], structures: [
    { id: 'tower', blueprintId: 'BP-BOT-WATCHTOWER', status: 'active', damagePermille: 0 },
    { id: 'wall', blueprintId: 'BP-BOT-WALL', status: 'damaged', damagePermille: 250 },
    { id: 'broken', blueprintId: 'BP-BOT-WATCHTOWER', status: 'destroyed', damagePermille: 1_000 },
  ] } as unknown as BotColdRecord;
  const defense = botSettlementDefensePermille(cold);
  assert.equal(defense, 133);
  const attacker = { power: 100, memberCount: 8, defensePermille: 0 };
  const undefended = resolveBotSettlementBattle('controlled-seed', 'same-raid', attacker,
    { power: 1, memberCount: 0, defensePermille: 0 }, 0);
  const defended = resolveBotSettlementBattle('controlled-seed', 'same-raid', attacker,
    { power: 1, memberCount: 0, defensePermille: defense }, defense);
  assert.equal(undefended.winner, 'attacker');
  assert.equal(undefended.attackerLosses, 0);
  assert.ok(defended.attackerLosses > 0 || defended.winner === 'defender', 'the completed structures change the battle outcome or losses');
});

test('a found blueprint is owned first, then one committed learn action consumes it into an unlock', () => {
  const population = generateBotPopulation('blueprint-ownership-fixture', ACTIVE_WORLD_PACKAGE);
  const chunk = population.chunks[0]!;
  const source = chunk.cold[0]!;
  const sourceId = source.searchSources[0]!.id;
  const item = { instanceId: 'find-1:BLUEPRINT', blueprintId: 'BP-BOT-WATCHTOWER', sourceId,
    acquiredAtElapsedMs: 0, status: 'owned' as const, resolvedAtElapsedMs: null, transactionId: null,
    ruleVersion: BOT_BLUEPRINT_RULE_VERSION };
  const actionId = `${source.botId}:ACT:LEARN-1`;
  const plan = { goal: 'discover' as const, action: 'learn_blueprint' as const, actionId, startedAtElapsedMs: 0,
    completesAtElapsedMs: 1_800_000, targetId: item.instanceId, workersAssigned: 1,
    reserved: { food: 0, wood: 0, stone: 0, ore: 0 },
    startingResourcesMicro: { food: chunk.foodMicro[0]!, wood: chunk.woodMicro[0]!, stone: chunk.stoneMicro[0]!, ore: chunk.oreMicro[0]! },
    expectedOutcome: 'learn owned blueprint' };
  const cold = { ...source, blueprintItems: [item], currentPlan: plan } as BotColdRecord;
  const coldRows = chunk.cold.slice() as BotColdRecord[];
  coldRows[0] = cold;
  const result = completePlan(population, chunk, hydrateBotHotArrays(chunk), coldRows, 0, cold, 'A', {} as never, plan.completesAtElapsedMs);
  assert.ok(result.cold.blueprintIds.includes(item.blueprintId));
  assert.equal(result.cold.blueprintItems[0]!.status, 'learned');
  assert.equal(result.cold.blueprintItems[0]!.resolvedAtElapsedMs, plan.completesAtElapsedMs);
  assert.ok(result.events.some(event => event.type === 'bot_blueprint_learned'));
  assert.equal(result.cold.actionReceipts.at(-1)?.ruleVersion, BOT_BLUEPRINT_RULE_VERSION);
});

test('nearby market settlement transfers an escrowed blueprint and real food once, with no free stock when no buyer qualifies', () => {
  const scenario = (buyerHasFood: boolean) => {
    const population = generateBotPopulation(`bot-market-${buyerHasFood ? 'buyer' : 'empty'}`, ACTIVE_WORLD_PACKAGE, { botCount: 10 });
    const sourceChunk = population.chunks[0]!;
    const sellerIndex = 0;
    const buyerIndex = 1;
    const seller = sourceChunk.cold[sellerIndex]!;
    const buyer = sourceChunk.cold[buyerIndex]!;
    const withinRadius = BOT_MARKET_ACCESS_RADIUS_MM - 1_000;
    const buyerPosition = { ...seller.position, xMm: seller.position.xMm + Math.min(1_000_000, withinRadius) };
    const item = { instanceId: `${seller.botId}:MARKET:WATCHTOWER`, blueprintId: 'BP-BOT-WATCHTOWER',
      sourceId: seller.searchSources[0]!.id, acquiredAtElapsedMs: 0, status: 'owned' as const,
      resolvedAtElapsedMs: null, transactionId: null, ruleVersion: BOT_BLUEPRINT_RULE_VERSION };
    const plan = { goal: 'survive' as const, action: 'list_blueprint' as const, actionId: `${seller.botId}:LIST:1`,
      startedAtElapsedMs: 0, completesAtElapsedMs: 0, targetId: item.instanceId, workersAssigned: 1,
      reserved: { food: 0, wood: 0, stone: 0, ore: 0 },
      startingResourcesMicro: { food: sourceChunk.foodMicro[sellerIndex]!, wood: sourceChunk.woodMicro[sellerIndex]!,
        stone: sourceChunk.stoneMicro[sellerIndex]!, ore: sourceChunk.oreMicro[sellerIndex]! },
      expectedOutcome: 'sell surplus blueprint', marketPaymentResource: 'food' as const };
    const coldRows = sourceChunk.cold.slice() as BotColdRecord[];
    coldRows[sellerIndex] = { ...seller, blueprintItems: [item], currentPlan: plan };
    coldRows[buyerIndex] = { ...buyer, regionId: seller.regionId, position: buyerPosition };
    const chunk = { ...sourceChunk, cold: coldRows };
    const hot = hydrateBotHotArrays(chunk);
    hot.foodMicro[sellerIndex] = 100 * BOT_MICRO;
    hot.foodMicro[buyerIndex] = buyerHasFood ? 500 * BOT_MICRO : 0;
    for (let offset = 2; offset < chunk.count; offset += 1) hot.foodMicro[offset] = 0;
    const ask = botMarketAsk(item.blueprintId, 'food', 0);
    const sellerBefore = hot.foodMicro[sellerIndex]!;
    const buyerBefore = hot.foodMicro[buyerIndex]!;
    const committed = completePlan(population, chunk, hot, coldRows, sellerIndex, coldRows[sellerIndex]!, 'A', marketFixtureState, 0);
    return { committed, coldRows, hot, sellerIndex, buyerIndex, ask, sellerBefore, buyerBefore, radius: Math.hypot(
      coldRows[buyerIndex]!.position.xMm - seller.position.xMm, coldRows[buyerIndex]!.position.yMm - seller.position.yMm) };
  };

  const trade = scenario(true);
  assert.ok(trade.radius <= BOT_MARKET_ACCESS_RADIUS_MM);
  assert.equal(trade.committed.population.marketTransactions.length, 1);
  assert.equal(trade.committed.population.marketTransactions[0]!.buyerBotId, trade.coldRows[trade.buyerIndex]!.botId);
  assert.equal(trade.committed.cold.blueprintItems[0]!.status, 'sold');
  assert.equal(trade.coldRows[trade.buyerIndex]!.blueprintItems[0]!.blueprintId, 'BP-BOT-WATCHTOWER');
  assert.equal(trade.hot.foodMicro[trade.sellerIndex], trade.sellerBefore + trade.ask * BOT_MICRO);
  assert.equal(trade.hot.foodMicro[trade.buyerIndex], trade.buyerBefore - trade.ask * BOT_MICRO);

  const emptyMarket = scenario(false);
  assert.equal(emptyMarket.committed.population.marketTransactions.length, 0);
  assert.equal(emptyMarket.committed.population.marketListings[0]!.status, 'active');
  assert.equal(emptyMarket.committed.cold.blueprintItems[0]!.status, 'escrowed');
  assert.equal(emptyMarket.hot.foodMicro[emptyMarket.sellerIndex], emptyMarket.sellerBefore, 'unsold escrow creates no payment');
});

test('water barter picks the nearest eligible buyer with stable identity tie-breaking', () => {
  const population = generateBotPopulation('bot-market-water-competition', ACTIVE_WORLD_PACKAGE, { botCount: 10 });
  const source = population.chunks[0]!;
  const sellerIndex = 0;
  const buyerIndex = 1;
  const secondBuyerIndex = 2;
  const seller = source.cold[sellerIndex]!;
  const item = { instanceId: `${seller.botId}:MARKET:WATCHTOWER`, blueprintId: 'BP-BOT-WATCHTOWER',
    sourceId: seller.searchSources[0]!.id, acquiredAtElapsedMs: 0, status: 'owned' as const,
    resolvedAtElapsedMs: null, transactionId: null, ruleVersion: BOT_BLUEPRINT_RULE_VERSION };
  const plan = { goal: 'survive' as const, action: 'list_blueprint' as const, actionId: `${seller.botId}:LIST:WATER`,
    startedAtElapsedMs: 0, completesAtElapsedMs: 0, targetId: item.instanceId, workersAssigned: 1,
    reserved: { food: 0, wood: 0, stone: 0, ore: 0 },
    startingResourcesMicro: { food: source.foodMicro[sellerIndex]!, wood: source.woodMicro[sellerIndex]!,
      stone: source.stoneMicro[sellerIndex]!, ore: source.oreMicro[sellerIndex]! },
    expectedOutcome: 'sell a blueprint for potable water', marketPaymentResource: 'water' as const };
  const coldRows = source.cold.slice() as BotColdRecord[];
  coldRows[sellerIndex] = { ...seller, blueprintItems: [item], currentPlan: plan, potableWaterMl: 20_000 };
  const buyerPosition = { ...seller.position, xMm: seller.position.xMm + 100_000 };
  for (const offset of [buyerIndex, secondBuyerIndex]) {
    coldRows[offset] = { ...coldRows[offset]!, regionId: seller.regionId, position: buyerPosition, potableWaterMl: 150_000 };
  }
  const chunk = { ...source, cold: coldRows };
  const hot = hydrateBotHotArrays(chunk);
  const ask = botMarketAsk(item.blueprintId, 'water', 0);
  const firstBefore = coldRows[buyerIndex]!.potableWaterMl;
  const secondBefore = coldRows[secondBuyerIndex]!.potableWaterMl;
  const result = completePlan(population, chunk, hot, coldRows, sellerIndex, coldRows[sellerIndex]!, 'A', marketFixtureState, 0);
  assert.equal(result.population.marketTransactions.length, 1);
  assert.equal(result.population.marketTransactions[0]!.paymentResource, 'water');
  assert.equal(result.population.marketTransactions[0]!.buyerBotId, coldRows[buyerIndex]!.botId);
  assert.equal(coldRows[buyerIndex]!.potableWaterMl, firstBefore - ask);
  assert.equal(coldRows[secondBuyerIndex]!.potableWaterMl, secondBefore, 'the stable first buyer wins an exact distance and balance tie');
  assert.equal(result.cold.potableWaterMl, 20_000 + ask);
});

test('one fixed world chest cannot be claimed twice; its committed loot opens once across reload state', () => {
  const population = generateBotPopulation('shared-chest-ownership-fixture', ACTIVE_WORLD_PACKAGE);
  const first = population.chunks[0]!.cold[0]!;
  const second = population.chunks[0]!.cold[1]!;
  const chest = ACTIVE_WORLD_PACKAGE.fieldChests.find(item => item.chestType === 'field')!;
  const state = { seed: 'shared-chest-seed', fieldChestStates: ACTIVE_WORLD_PACKAGE.fieldChests.map(item => ({
    chestId: item.id, state: 'unopened' as const, openedAtElapsedMs: null, discovery: 'hidden' as const,
    discoveredAtElapsedMs: null, signalId: null, custody: 'world' as const, claimedById: null, carrierId: null, lootOutcome: null,
  })) } as never;
  const source = { id: `${first.botId}:TEST-FIELD-CACHE`, kind: 'field_cache' as const,
    position: chest.position, remainingActions: 1, eligibleBlueprintIds: [], discovered: true, fieldChestId: chest.id };
  const acquired = acquireBotChest(state, ACTIVE_WORLD_PACKAGE, first, source, 'first-search', population.saveSeed, 1_000);
  assert.equal(acquired.result, 'discovered');
  assert.equal(acquired.cold.ownedChests[0]!.fieldChestId, chest.id);
  const secondSource = { ...source, id: `${second.botId}:TEST-FIELD-CACHE` };
  assert.equal(acquireBotChest(state, ACTIVE_WORLD_PACKAGE, second, secondSource, 'second-search', population.saveSeed, 2_000).result, 'depleted');

  const fixture = setup({ ...empty, food: 100 * BOT_MICRO, firewood: 100 * BOT_MICRO }, 10);
  const opened = openBotChest(state, ACTIVE_WORLD_PACKAGE, acquired.cold, fixture.hot, 0, chest.id, 3_000);
  const expected = deterministicChestOutcome(state.seed, chest).rewardStacks.map(item => ({ itemTemplateId: item.templateId, quantity: item.quantity }));
  assert.equal(opened.result, 'completed');
  assert.deepEqual(opened.cold.ownedChests[0]!.lootOutcome, expected);
  assert.equal(opened.cold.ownedChests[0]!.status, 'opened');
  assert.equal(state.fieldChestStates.find(item => item.chestId === chest.id)!.custody, 'opened');
  assert.equal(openBotChest(state, ACTIVE_WORLD_PACKAGE, opened.cold, fixture.hot, 0, chest.id, 4_000).result, 'depleted');
});

test('persisted raid detachment composition validates against its actual cohorts', () => {
  const generated = generateBotPopulation('focused-detachment-fixture', ACTIVE_WORLD_PACKAGE);
  const source = generated.chunks[0]!;
  const bot = source.cold[0]!;
  const cohort = bot.cohorts[0]!;
  const targetId = bot.ordinal < generated.botCount ? `BOT-P0-${String(bot.ordinal + 10).padStart(4, '0')}` : 'RC-002';
  const withMovement = (unitCount: number, assignedCount = unitCount) => {
    const cold = source.cold.slice();
    cold[0] = {
      ...bot,
      currentPlan: { goal: 'contest', action: 'raid', actionId: `${bot.botId}:TEST-RAID`, startedAtElapsedMs: 0,
        completesAtElapsedMs: 3_600_000, targetId, workersAssigned: 1,
        reserved: { food: 0, wood: 0, stone: 0, ore: 0 },
        startingResourcesMicro: { food: source.foodMicro[0]!, wood: source.woodMicro[0]!, stone: source.stoneMicro[0]!, ore: source.oreMicro[0]! },
        expectedOutcome: 'test raid' },
      armyMovement: { orderId: `${bot.botId}:TEST-RAID`, targetId, unitKind: 'army', unitCount,
        cohortMemberCounts: [{ cohortId: cohort.id, memberCount: assignedCount }], from: bot.position,
        to: { xMm: bot.position.xMm + 1, yMm: bot.position.yMm, sourceZMetres: bot.position.sourceZMetres ?? 0 },
        startedAtElapsedMs: 0, arrivesAtElapsedMs: 1, status: 'outbound' },
    };
    const rowSha256 = source.rowSha256.slice();
    const withoutHash = { ...source, cold, rowSha256, chunkSha256: '' } as BotStateChunk;
    rowSha256[0] = botRowHash(withoutHash, 0);
    const materialized = { ...withoutHash, rowSha256 } as BotStateChunk;
    const updatedChunk = { ...materialized, chunkSha256: botChunkHash(materialized) };
    const chunks = generated.chunks.slice();
    chunks[0] = updatedChunk;
    return { ...generated, chunks, chunkRootSha256: botPopulationRoot(chunks) };
  };

  const valid = withMovement(2);
  verifyBotPopulation(valid);
  assert.throws(() => verifyBotPopulation(withMovement(2, 1)), /BOT_POPULATION_INVALID:movement-cohort-count/);
});

test('legacy zero-unit scout routes are canceled and their reservations released during migration', () => {
  const generated = generateBotPopulation('legacy-zero-scout-migration', ACTIVE_WORLD_PACKAGE);
  const source = generated.chunks[0]!;
  const bot = source.cold[0]!;
  const targetId = 'CONTACT-RC-003';
  const cold = source.cold.slice();
  cold[0] = {
    ...bot,
    nextActionOrdinal: 1,
    currentPlan: { goal: 'scout', action: 'scout', actionId: `${bot.botId}:ACT:00000001`, startedAtElapsedMs: 0,
      completesAtElapsedMs: 3_600_000, targetId, workersAssigned: 0, reserved: { food: 3, wood: 0, stone: 0, ore: 0 },
      startingResourcesMicro: { food: source.foodMicro[0]!, wood: source.woodMicro[0]!, stone: source.stoneMicro[0]!, ore: source.oreMicro[0]! },
      expectedOutcome: 'legacy zero-worker scout route' },
    workforce: { ...bot.workforce, scouts: 0 },
    armyMovement: { orderId: `${bot.botId}:ACT:00000001`, targetId, unitKind: 'scout', unitCount: 0,
      from: bot.position, to: bot.position, startedAtElapsedMs: 0, arrivesAtElapsedMs: 3_600_000, status: 'outbound' },
  } as BotColdRecord;
  const rowSha256 = source.rowSha256.slice();
  const reservedFoodMicro = source.reservedFoodMicro.slice();
  reservedFoodMicro[0] = 3 * BOT_MICRO;
  const unhashed = { ...source, cold, reservedFoodMicro, rowSha256, chunkSha256: '' } as BotStateChunk;
  rowSha256[0] = botRowHash(unhashed, 0);
  const withRows = { ...unhashed, rowSha256 } as BotStateChunk;
  const chunk = { ...withRows, chunkSha256: botChunkHash(withRows) };
  const chunks = generated.chunks.slice();
  chunks[0] = chunk;
  const invalidMovement = { ...generated, chunks, chunkRootSha256: botPopulationRoot(chunks) };
  assert.throws(() => verifyBotPopulation(invalidMovement), /BOT_POPULATION_INVALID:movement:1:unit-count:0/);
  const legacy = { ...invalidMovement, rulesVersion: 'BOT-AUTHORITATIVE-SIM-1.5', plannerRuleVersion: 'BOT-UTILITY-GOAP-1.2' };
  assert.equal(botPopulationNeedsMigration(legacy), true);

  const migrated = migrateBotPopulation(legacy);
  verifyBotPopulation(migrated);
  assert.equal(migrated.rulesVersion, BOT_SIMULATION_RULE_VERSION);
  assert.equal(migrated.plannerRuleVersion, BOT_PLANNER_RULE_VERSION);
  assert.equal(migrated.chunks[0]!.cold[0]!.armyMovement, null);
  assert.equal(migrated.chunks[0]!.cold[0]!.currentPlan, null);
  assert.equal(migrated.chunks[0]!.reservedFoodMicro[0], 0);
  assert.equal(migrated.chunks[0]!.cold[0]!.blueprintIds.length, bot.blueprintIds.length);
});

test('causeless historical population losses migrate as unattributed and refresh chunk roots', () => {
  const generated = generateBotPopulation('legacy-casualty-ledger-migration', ACTIVE_WORLD_PACKAGE);
  const source = generated.chunks[0]!;
  const hot = hydrateBotHotArrays(source);
  hot.deathCount[0] = 7;
  const cold = source.cold.slice() as BotColdRecord[];
  const { casualtiesByCause: _removedLedger, ...legacyBot } = cold[0]!;
  cold[0] = legacyBot as BotColdRecord;
  const serialized = serializeBotHotArrays({ ...source, cold }, hot);
  const rowSha256 = serialized.rowSha256.slice();
  rowSha256[0] = botRowHash({ ...serialized, rowSha256, chunkSha256: '' }, 0);
  const unhashed = { ...serialized, rowSha256, chunkSha256: '' };
  const chunk = { ...unhashed, chunkSha256: botChunkHash(unhashed) } as BotStateChunk;
  const chunks = generated.chunks.slice();
  chunks[0] = chunk;
  const legacy = { ...generated, chunks, chunkRootSha256: botPopulationRoot(chunks) };

  assert.equal(botPopulationNeedsMigration(legacy), true);
  const migrated = migrateBotPopulation(legacy);
  verifyBotPopulation(migrated);
  assert.deepEqual(migrated.chunks[0]!.cold[0]!.casualtiesByCause, {
    starvation: 0, dehydration: 0, fuelExhaustion: 0, regionalBlizzard: 0,
    battle: 0, wildlife: 0, unattributed: 7,
  });
  assert.equal(migrated.chunks[0]!.deathCount[0], 7);
});
