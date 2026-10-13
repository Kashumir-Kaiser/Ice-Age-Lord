import type { BotArmyMovement, CoordinateMm } from '../../../contracts/src/index.ts';

export function botArmyPosition(movement: BotArmyMovement, atElapsedMs: number): CoordinateMm {
  if (movement.status === 'besieging' || movement.status === 'surveying') return { ...movement.to };
  const duration = movement.arrivesAtElapsedMs - movement.startedAtElapsedMs;
  const progress = duration <= 0 ? 1 : Math.max(0, Math.min(1, (atElapsedMs - movement.startedAtElapsedMs) / duration));
  return {
    xMm: Math.round(movement.from.xMm + (movement.to.xMm - movement.from.xMm) * progress),
    yMm: Math.round(movement.from.yMm + (movement.to.yMm - movement.from.yMm) * progress),
    sourceZMetres: movement.from.sourceZMetres ?? movement.to.sourceZMetres ?? 0,
  };
}

export function botArmyMovementOrder(movement: BotArmyMovement): 'raid' | 'retreat' | 'scout' {
  return movement.unitKind === 'scout' ? 'scout' : movement.status === 'returning' ? 'retreat' : 'raid';
}
