import type { BotColdRecord } from '../../../contracts/src/index.ts';
import { randomIntFromFields } from '../hash.ts';

/** Deliberate simulation overlay: the source package has no regional bot weather API. */
export const BOT_WEATHER_RULE_VERSION = 'BOT-REGIONAL-WINTER-STORM-1.1';
export const BOT_WEATHER_WINDOW_MS = 12 * 60 * 60_000;
export const BOT_WEATHER_STORM_CHANCE_PERMILLE = 120;
export const BOT_WEATHER_FUEL_DEMAND_UNITS = 8;
export const BOT_WEATHER_SHELTERED_FUEL_DEMAND_UNITS = 3;
export const BOT_WEATHER_MAX_COLD_EXPOSURE_MS = 6 * 60 * 60_000;
export const BOT_WEATHER_STORM_DURATION_MS = BOT_WEATHER_MAX_COLD_EXPOSURE_MS;

/** Selects a fixed regional weather boundary from the save seed, region and window. */
export function nextBotWeatherStormAt(seed: string, cold: BotColdRecord, after: number, through: number): number | null {
  if (through <= after || !cold.regionId) return null;
  let window = Math.floor(after / BOT_WEATHER_WINDOW_MS) + 1;
  const lastWindow = Math.floor(through / BOT_WEATHER_WINDOW_MS);
  for (; window <= lastWindow; window += 1) {
    const boundary = window * BOT_WEATHER_WINDOW_MS;
    if (randomIntFromFields([seed, cold.regionId, String(window), BOT_WEATHER_RULE_VERSION, 'storm'], 0, 999).value
      < BOT_WEATHER_STORM_CHANCE_PERMILLE) return boundary;
  }
  return null;
}

function stormOccurs(seed: string, regionId: string, window: number): boolean {
  return randomIntFromFields([seed, regionId, String(window), BOT_WEATHER_RULE_VERSION, 'storm'], 0, 999).value
    < BOT_WEATHER_STORM_CHANCE_PERMILLE;
}

/** Start and end boundaries keep the deterministic hazard continuous across catch-up and reload. */
export function nextBotWeatherBoundaryAt(seed: string, cold: BotColdRecord, after: number, through: number): number | null {
  if (through <= after || !cold.regionId) return null;
  const candidates: number[] = [];
  const firstWindow = Math.max(1, Math.floor(Math.max(0, after - BOT_WEATHER_STORM_DURATION_MS) / BOT_WEATHER_WINDOW_MS));
  const lastWindow = Math.floor(through / BOT_WEATHER_WINDOW_MS);
  for (let window = firstWindow; window <= lastWindow; window += 1) {
    if (!stormOccurs(seed, cold.regionId, window)) continue;
    const start = window * BOT_WEATHER_WINDOW_MS;
    const end = start + BOT_WEATHER_STORM_DURATION_MS;
    if (start > after && start <= through) candidates.push(start);
    if (end > after && end <= through) candidates.push(end);
  }
  return candidates.length ? Math.min(...candidates) : null;
}

export function botWeatherStormActiveAt(seed: string, cold: BotColdRecord, at: number): boolean {
  if (!cold.regionId || at < 0) return false;
  const window = Math.floor(at / BOT_WEATHER_WINDOW_MS);
  const start = window * BOT_WEATHER_WINDOW_MS;
  return start > 0 && at < start + BOT_WEATHER_STORM_DURATION_MS && stormOccurs(seed, cold.regionId, window);
}

export function botWeatherStormStartsAt(seed: string, cold: BotColdRecord, at: number): boolean {
  return at > 0 && at % BOT_WEATHER_WINDOW_MS === 0
    && botWeatherStormActiveAt(seed, cold, at);
}

export function botWeatherFuelDemand(cold: BotColdRecord): number {
  const hearthReady = cold.structures.some(structure => structure.blueprintId === 'BP-BOT-HEARTH' && structure.status === 'active');
  return hearthReady ? BOT_WEATHER_SHELTERED_FUEL_DEMAND_UNITS : BOT_WEATHER_FUEL_DEMAND_UNITS;
}
