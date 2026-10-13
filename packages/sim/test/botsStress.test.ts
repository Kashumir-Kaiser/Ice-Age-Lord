import assert from 'node:assert/strict';
import test from 'node:test';
import { ACTIVE_WORLD_PACKAGE as world } from '../../content/src/index.ts';
import { generateBotPopulationStress } from '../src/bots/generation.ts';
import { verifyBotPopulation } from '../src/bots/state.ts';

test('stress profiles use indexed finite records at 10,000 and 100,000 participants', () => {
  for (const count of [10_000, 100_000] as const) {
    const population = generateBotPopulationStress(`bot-stress-${count}`, world, count);
    verifyBotPopulation(population);
    assert.equal(population.generationProfile, 'BENCHMARK_STRESS');
    assert.equal(population.totalParticipants, count + 1);
    assert.ok(population.configuredMapRadiusKm > world.activeMapRadiusKm);
    assert.equal(population.chunks.reduce((sum, chunk) => sum + chunk.count, 0), count);
    assert.ok(population.chunks.every(chunk => chunk.cold.every(bot => bot.structures.length >= 3 && bot.cohorts.length > 0 && bot.searchSources.length >= 4)));
  }
});
