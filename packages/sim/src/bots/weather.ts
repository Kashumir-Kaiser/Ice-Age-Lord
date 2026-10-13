import type { BotColdRecord } from '../../../contracts/src/index.ts';
import { randomIntFromFields } from '../hash.ts';

/** Deliberate simulation overlay: the source package has no regional bot weather API. */
export const BOT_WEATHER_RULE_VERSION = 'BOT-REGIONAL-WINTER-STORM-1.0';
export const BOT_WEATHER_WINDOW_MS = 12 * 60 * 60_000;
export const BOT_WEATHER_STORM_CHANCE_PERMILLE = 120;
export const BOT_WEATHER_FUEL_DEMAND_UNITS = 8;
export const BOT_WEATHER_SHELTERED_FUEL_DEMAND_UNITS = 3;
export const BOT_WEATHER_MAX_COLD_EXPOSURE_MS = 6 * 60 * 60_000;

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

export function botWeatherFuelDemand(cold: BotColdRecord): number {
  const hearthReady = cold.structures.some(structure => structure.blueprintId === 'BP-BOT-HEARTH' && structure.status === 'active');
  return hearthReady ? BOT_WEATHER_SHELTERED_FUEL_DEMAND_UNITS : BOT_WEATHER_FUEL_DEMAND_UNITS;
}
