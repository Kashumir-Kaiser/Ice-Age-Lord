import type { ColdEnvironment } from '../../contracts/src/index.ts';

/**
 * Versioned game-design adapter for source fields whose ledger was referenced
 * but absent from the active package. These values are explicit simulation
 * inputs; they are not claims about exact novel or campaign weather.
 */
export const OPENING_ENVIRONMENT_ADAPTER_VERSION = 'LL01-OPENING-ENVIRONMENT-ADAPTER-1.0' as const;
export const OPENING_FIRE_STARTER_FUEL_UNITS = 24;
export const OPENING_WEATHER_RECORD: ColdEnvironment = {
  apparentTemperatureC: 0,
  windKph: 0,
  wetness: 0,
  activityFactor: 1,
  insulation: 1.5,
  shelter: 1.5,
};
export const OPENING_FIRE_EFFECTIVE_TEMPERATURE_C = 12.5;
