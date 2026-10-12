import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OPENING_LEVEL_CLOSES_AT_MS,
  OPENING_LEVEL_DISPLAY_DELAY_MS,
  OPENING_LEVEL_MAX_ROWS,
  OPENING_LEVEL_OPENS_AT_MS,
  OPENING_LEVEL_REWARD_BANDS,
  OPENING_LEVEL_RIVALS,
  forecastOpeningRival,
  openingLevelRewardBand,
  rankOpeningLevelCompletions,
  visibleOpeningLevelRows,
  type OpeningLevelCompletion,
} from '../src/openingRanking.ts';

const HOUR_MS = 60 * 60_000;

test('fixed File 07 P0 forecast inputs reproduce the source formula without assigning ranks', () => {
  const forecasts = OPENING_LEVEL_RIVALS.map(forecastOpeningRival);
  const byId = new Map(forecasts.map(row => [row.contenderId, row]));
  assert.equal(OPENING_LEVEL_RIVALS.length, 9, 'RC-001 is the player and uses a live action ledger, not an NPC forecast');
  assert.equal(byId.get('RC-004')?.completionStat.toFixed(2), '76.20');
  assert.equal(byId.get('RC-004')?.projectedDurationMinutes, 46 * 60 + 25);
  assert.equal(byId.get('RC-009')?.completionStat.toFixed(2), '47.10');
  assert.equal(byId.get('RC-009')?.projectedDurationMinutes, 104 * 60 + 3);
  assert.equal(forecasts.some(row => 'rank' in row), false);
});

test('opening board respects its open time, three-minute display delay, qualification and close time', () => {
  const completions: OpeningLevelCompletion[] = [
    { playerId: 'RC-004', realName: 'Phương Long', level: 10, progressToNextLevelPermille: 20, completionAtElapsedMs: 50 * HOUR_MS },
    { playerId: 'RC-005', realName: 'Chu Bác', level: 10, progressToNextLevelPermille: 10, completionAtElapsedMs: 51 * HOUR_MS },
    { playerId: 'RC-006', realName: 'Vũ Hưng Hổ', level: 9, progressToNextLevelPermille: 999, completionAtElapsedMs: 49 * HOUR_MS },
    { playerId: 'RC-007', realName: 'Tạ Nghiên', level: 10, progressToNextLevelPermille: 30, completionAtElapsedMs: OPENING_LEVEL_CLOSES_AT_MS + 1 },
  ];
  assert.deepEqual(visibleOpeningLevelRows(completions, OPENING_LEVEL_OPENS_AT_MS - 1), []);
  assert.deepEqual(visibleOpeningLevelRows(completions, 50 * HOUR_MS + OPENING_LEVEL_DISPLAY_DELAY_MS - 1), []);
  const visible = visibleOpeningLevelRows(completions, 50 * HOUR_MS + OPENING_LEVEL_DISPLAY_DELAY_MS);
  assert.deepEqual(visible.map(row => [row.playerId, row.rank]), [['RC-004', 1]]);
  const frozen = rankOpeningLevelCompletions(completions, OPENING_LEVEL_CLOSES_AT_MS);
  assert.deepEqual(frozen.map(row => [row.playerId, row.rank]), [['RC-004', 1], ['RC-005', 2]]);
});

test('opening ranking ties use stable player ID, retain at most 100 rows, and reward bands are fixed', () => {
  const tied: OpeningLevelCompletion[] = [
    { playerId: 'ZED', realName: 'Zed', level: 10, progressToNextLevelPermille: 0, completionAtElapsedMs: 80 * HOUR_MS },
    { playerId: 'ALPHA', realName: 'Alpha', level: 10, progressToNextLevelPermille: 999, completionAtElapsedMs: 80 * HOUR_MS },
  ];
  assert.deepEqual(rankOpeningLevelCompletions(tied).map(row => [row.playerId, row.rank]), [['ALPHA', 1], ['ZED', 2]]);
  const crowd = Array.from({ length: 102 }, (_, index) => ({
    playerId: `P-${String(index).padStart(3, '0')}`, realName: `P${index}`, level: 10,
    progressToNextLevelPermille: 0, completionAtElapsedMs: index,
  }));
  assert.equal(rankOpeningLevelCompletions(crowd).length, OPENING_LEVEL_MAX_ROWS);
  assert.equal(openingLevelRewardBand(1)?.payload.find(item => item.item === 'meat')?.quantity, 200);
  assert.equal(openingLevelRewardBand(51)?.payload.find(item => item.item === 'bread')?.quantity, 20);
  assert.equal(openingLevelRewardBand(101), null);
  assert.deepEqual(OPENING_LEVEL_REWARD_BANDS.map(band => [band.minRank, band.maxRank]), [[1, 1], [2, 2], [3, 3], [4, 10], [11, 20], [21, 50], [51, 100]]);
});
