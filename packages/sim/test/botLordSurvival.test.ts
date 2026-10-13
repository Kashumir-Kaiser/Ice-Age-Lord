import assert from 'node:assert/strict';
import test from 'node:test';
import { createBotLord, damageBotLord, integrateBotLord, resolveBotLordSupport, type BotLordSupportProvider } from '../src/bots/lord.ts';

const HOUR = 3_600_000;
const MINUTE = 60_000;
const home = { xMm: 0, yMm: 0, sourceZMetres: 0 };
const servedAndWarm = {
  fromElapsedMs: 0, toElapsedMs: 0, foodCoveragePermille: 1_000, waterCoveragePermille: 1_000,
  coldLoadRateMicroPerMinute: 0, resting: false,
};

test('the normal-human lord has no tier bonus and survives a served, warm seven-day interval', () => {
  const lord = createBotLord('BOT-P0-0010', home);
  const result = integrateBotLord(lord, { ...servedAndWarm, toElapsedMs: 7 * 24 * HOUR });
  assert.equal(lord.maxHpMicro, 100_000_000);
  assert.equal(result.lord.lifeState, 'alive');
  assert.equal(result.lord.hpMicro, lord.maxHpMicro);
  assert.equal(result.death, null);
});

test('personal food deprivation crosses its 24-hour damage boundary during a long interval', () => {
  const lord = createBotLord('BOT-P0-0011', home);
  const result = integrateBotLord(lord, { ...servedAndWarm, toElapsedMs: 25 * HOUR, foodCoveragePermille: 0 });
  assert.equal(result.lord.foodShortfallMs, 25 * HOUR);
  assert.equal(result.lord.hpMicro, 99_500_000, 'the below-24-hour interval is harmless; only the final hour applies the 0.5% rate');
  assert.equal(result.death, null);
});

test('full food and water service reduces deprivation twice as fast without restoring lost HP', () => {
  const lord = { ...createBotLord('BOT-P0-0012', home), hpMicro: 80_000_000, foodShortfallMs: 24 * HOUR };
  const result = integrateBotLord(lord, { ...servedAndWarm, toElapsedMs: 12 * HOUR });
  assert.equal(result.lord.foodShortfallMs, 0);
  assert.equal(result.lord.hpMicro, 74_000_000, 'damage continues at the current band while the counter recovers');
});

test('support changes a lord trajectory only through a provider delivery for that lord and interval', () => {
  const lord = { ...createBotLord('BOT-P0-0016', home), waterShortfallMs: 8 * HOUR };
  const aidProvider: BotLordSupportProvider = {
    id: 'FIXTURE-DELIVERED-WATER-1.0',
    supportFor: (recipient, fromElapsedMs, toElapsedMs) => recipient.id === lord.id && fromElapsedMs === 0 && toElapsedMs === 8 * HOUR
      ? { providerId: 'FIXTURE-DELIVERED-WATER-1.0', foodCoveragePermille: 0, waterCoveragePermille: 1_000,
        coldLoadReductionMicroPerMinute: 0, shelterStructureId: null }
      : null,
  };
  const noSupport = integrateBotLord(lord, { ...servedAndWarm, fromElapsedMs: 0, toElapsedMs: 8 * HOUR, waterCoveragePermille: 0 });
  const delivered = resolveBotLordSupport(aidProvider, lord, 0, 8 * HOUR);
  assert.ok(delivered, 'the provider confirms a recipient-specific delivery in the tested interval');
  const withSupport = integrateBotLord(lord, { ...servedAndWarm, fromElapsedMs: 0, toElapsedMs: 8 * HOUR,
    waterCoveragePermille: 0, support: delivered });
  assert.equal(noSupport.lord.hpMicro, 92_000_000, 'unserved water crosses the 12-hour band and damages HP');
  assert.equal(withSupport.lord.hpMicro, lord.maxHpMicro, 'delivered water reverses shortfall before HP damage begins');
  assert.equal(withSupport.lord.waterShortfallMs, 0);
  assert.equal(withSupport.lord.supportProviderId, aidProvider.id);
  assert.equal(resolveBotLordSupport(aidProvider, { ...lord, id: 'LORD:OTHER-BOT' }, 0, 8 * HOUR), null,
    'a shared label cannot route support to another lord');
});

test('a 10-HP lord with 36 hours without water dies after exactly two more hours', () => {
  const lord = { ...createBotLord('BOT-P0-0013', home), hpMicro: 10_000_000, waterShortfallMs: 36 * HOUR };
  const result = integrateBotLord(lord, { ...servedAndWarm, toElapsedMs: 2 * HOUR, waterCoveragePermille: 0 });
  assert.equal(result.lord.lifeState, 'dead');
  assert.equal(result.lord.hpMicro, 0);
  assert.equal(result.death?.atElapsedMs, 2 * HOUR);
  assert.equal(result.death?.primaryCause, 'water_deprivation');
  assert.equal(result.death?.waterShortfallMs, 38 * HOUR, 'the death tombstone retains the conditions at the HP-zero boundary');
});

test('one two-hour water catch-up and two one-hour segments agree on HP, death time, and cause', () => {
  const lord = { ...createBotLord('BOT-P0-0017', home), hpMicro: 10_000_000, waterShortfallMs: 36 * HOUR };
  const oneShot = integrateBotLord(lord, { ...servedAndWarm, toElapsedMs: 2 * HOUR, waterCoveragePermille: 0 });
  const first = integrateBotLord(lord, { ...servedAndWarm, toElapsedMs: HOUR, waterCoveragePermille: 0 });
  assert.equal(first.lord.lifeState, 'alive');
  const second = integrateBotLord(first.lord, { ...servedAndWarm, fromElapsedMs: HOUR, toElapsedMs: 2 * HOUR, waterCoveragePermille: 0 });
  assert.equal(second.lord.hpMicro, oneShot.lord.hpMicro);
  assert.deepEqual(second.death, oneShot.death);
});

test('20 cold-load units per minute kill a healthy lord at the 60-minute threshold', () => {
  const lord = createBotLord('BOT-P0-0014', home);
  const result = integrateBotLord(lord, { ...servedAndWarm, toElapsedMs: 60 * MINUTE, coldLoadRateMicroPerMinute: 20_000_000 });
  assert.equal(result.lord.lifeState, 'dead');
  assert.equal(result.death?.atElapsedMs, 60 * MINUTE);
  assert.equal(result.death?.primaryCause, 'cold');
  assert.equal(result.lord.coldLoadMicro, 1_200_000_000);
  assert.equal(result.death?.coldLoadMicro, 1_200_000_000);
});

test('combat uses the same HP-zero terminal handler and cannot revive a dead lord', () => {
  const lord = { ...createBotLord('BOT-P0-0015', home), hpMicro: 10_000_000 };
  const dead = damageBotLord(lord, 10, 'combat', 0, 'controlled-hit');
  assert.equal(dead.lifeState, 'dead');
  assert.equal(dead.deathRecord?.primaryCause, 'combat');
  assert.equal(dead.deathRecord?.precedingHpMicro, 10_000_000);
  assert.equal(damageBotLord(dead, 1, 'combat', 0, 'duplicate-hit'), dead);
});
