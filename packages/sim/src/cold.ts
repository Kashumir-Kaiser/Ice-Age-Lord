import type { ColdEnvironment } from '../../contracts/src/index.ts';

/** Shared source calculation used by the player and the persistent bot-lord actors. */
export function coldLoadRateMicroPerMinute(environment: ColdEnvironment): number {
  const { apparentTemperatureC, windKph, wetness, activityFactor, insulation, shelter } = environment;
  if (![apparentTemperatureC, windKph, wetness, activityFactor, insulation, shelter].every(Number.isFinite)
    || windKph < 0 || wetness < 0 || wetness > 1 || insulation <= 0 || shelter <= 0
    || ![0.7, 1, 1.3].includes(activityFactor)) throw new Error('COLD_ENVIRONMENT_INVALID');
  const deficit = Math.max(0, 18 - apparentTemperatureC);
  const windWetness = Math.max(1, Math.min(3, 1 + 0.03 * windKph + wetness));
  return Math.round((deficit * windWetness * activityFactor / (insulation * shelter)) * 1_000_000);
}
