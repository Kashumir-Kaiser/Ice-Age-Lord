import type { BotMarketListing } from '../../../contracts/src/index.ts';
import { BOT_BLUEPRINT_BY_ID } from './blueprints.ts';

/** The bot market is a regional barter overlay; values are design decisions, not novel source facts. */
export const BOT_MARKET_RULE_VERSION = 'BOT-REGIONAL-BARTER-MARKET-1.0';
export const BOT_MARKET_ACCESS_RADIUS_MM = 25_000_000;
export const BOT_MARKET_LISTING_DURATION_MS = 48 * 60 * 60_000;
export const BOT_MARKET_REPRICE_INTERVAL_MS = 12 * 60 * 60_000;
export const BOT_MARKET_MAX_REPRICES = 2;
export const BOT_MARKET_MAX_LISTINGS_PER_BOT = 4;
export const BOT_MARKET_FOOD_PRICE_FLOOR = 4;
export const BOT_MARKET_FOOD_PRICE_CEILING = 40;
export const BOT_MARKET_WATER_PRICE_FLOOR_ML = 5_000;
export const BOT_MARKET_WATER_PRICE_CEILING_ML = 60_000;

const PLAYER_BLUEPRINT_ADAPTERS: Readonly<Record<string, string>> = {
  'BP-BOT-WALL': 'BP-OPEN-WALL-01',
};

export function playerBlueprintAdapter(blueprintId: string): string | null {
  return PLAYER_BLUEPRINT_ADAPTERS[blueprintId] ?? null;
}

export function botMarketListingBlocker(listing: Pick<BotMarketListing, 'blueprintId' | 'paymentResource'>): string | null {
  if (!playerBlueprintAdapter(listing.blueprintId)) return 'BOT_BLUEPRINT_HAS_NO_PLAYER_CONSTRUCTION_ADAPTER';
  if (listing.paymentResource === 'water') return 'PLAYER_POTABLE_WATER_MARKET_PAYMENT_NOT_COMPILED';
  return null;
}

function clamp(value: number, floor: number, ceiling: number): number {
  return Math.max(floor, Math.min(ceiling, value));
}

/** Stable floor/ceiling price with a small scarcity premium and bounded expiry reprices. */
export function botMarketAsk(blueprintId: string, paymentResource: 'food' | 'water', activeSameBlueprint: number, repriceCount = 0): number {
  const rule = BOT_BLUEPRINT_BY_ID.get(blueprintId);
  if (!rule) throw new Error(`BOT_MARKET_BLUEPRINT_UNKNOWN:${blueprintId}`);
  const scarcityPermille = activeSameBlueprint === 0 ? 1_250 : activeSameBlueprint === 1 ? 1_000 : 800;
  const repricedPermille = repriceCount === 0 ? 1_000 : repriceCount === 1 ? 850 : 700;
  if (paymentResource === 'food') {
    const base = rule.tier === 1 ? 8 : rule.tier === 2 ? 14 : 22;
    return clamp(Math.ceil(base * scarcityPermille * repricedPermille / 1_000_000), BOT_MARKET_FOOD_PRICE_FLOOR, BOT_MARKET_FOOD_PRICE_CEILING);
  }
  const baseMl = rule.tier === 1 ? 12_000 : rule.tier === 2 ? 24_000 : 36_000;
  return clamp(Math.ceil(baseMl * scarcityPermille * repricedPermille / 1_000_000 / 1_000) * 1_000,
    BOT_MARKET_WATER_PRICE_FLOOR_ML, BOT_MARKET_WATER_PRICE_CEILING_ML);
}

export function compareMarketListings(a: Pick<BotMarketListing, 'paymentResource' | 'askAmount' | 'createdAtElapsedMs' | 'sellerBotId' | 'id'>,
  b: Pick<BotMarketListing, 'paymentResource' | 'askAmount' | 'createdAtElapsedMs' | 'sellerBotId' | 'id'>): number {
  return (a.paymentResource < b.paymentResource ? -1 : a.paymentResource > b.paymentResource ? 1 : 0)
    || a.askAmount - b.askAmount || a.createdAtElapsedMs - b.createdAtElapsedMs
    || (a.sellerBotId < b.sellerBotId ? -1 : a.sellerBotId > b.sellerBotId ? 1 : 0)
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
