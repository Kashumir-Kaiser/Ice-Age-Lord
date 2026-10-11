import type {
  CaravanState, CommandEvent, CurrencyBalance, GameState, Stage08AuctionBidState,
  Stage08AuctionLotState, Stage08MarketOfferState, Stage08RuntimeState, WorldDefinition,
} from '../../contracts/src/index.ts';
import { canonicalStateHash } from './hash.ts';

export const STAGE08_RULE_VERSION = 'LL01-STAGE-08-QUEST-TRADE-1.0';
export const Q08_ID = 'QUEST-LL01-08';
export const Q08_CARAVAN_ID = 'CARAVAN-LL01-01';
export const KRONA_CURRENCY_ID = 'KRONA';
export const Q08_REWARD_CONTRACT = 'RW-LL01-08';
export const Q08_ROUTE_ID = 'ROUTE-TRADE-LL01-A';
export const MARKET_BREAD_OFFER_ID = 'MARKET-LL01-046-BREAD-01';
export const CARAVAN_SALT_AUCTION_ID = 'AUCTION-LL01-08-SALT-01';
export const CARAVAN_SALT_CARGO_ID = 'CARGO-CARAVAN-LL01-01-SALT';

const HOUR_MS = 3_600_000;
const INTERACTION_RANGE_MM = 12_000;
const Q08_DEPARTURE_MS = 120 * HOUR_MS;
const Q08_DISTRESS_MS = 122 * HOUR_MS;
const Q08_DEADLINE_MS = 126 * HOUR_MS;
const CARAVAN_SPEED_MM_PER_HOUR = 3_500_000;
const CARAVAN_AUCTION_DURATION_MS = 12 * HOUR_MS;
const KRONA_CURRENCY = 'KRONA';

export function initialStage08State(): Stage08RuntimeState {
  const caravan: CaravanState = {
    id: Q08_CARAVAN_ID,
    status: 'at_checkpoint',
    locationSiteId: 'SITE-LL01-052',
    departsAtElapsedMs: Q08_DEPARTURE_MS,
    distressAtElapsedMs: Q08_DISTRESS_MS,
    deadlineAtElapsedMs: Q08_DEADLINE_MS,
    arrivalAtElapsedMs: null,
    torvenAlive: true,
    survivingDraftAnimals: 9,
    grainSacks: 18,
    saltUnits: 6,
    waterLitres: 240,
    ledgerIntact: true,
    negotiationReceiptId: null,
    escortReceiptId: null,
    tradeRouteUnlocked: false,
    torvenContractOfferAvailable: false,
  };
  return {
    enabled: true,
    caravan,
    marketOffers: [],
    auctionLots: [],
    auctionBids: [],
    rewardClaimReceipts: [],
    rankSnapshots: [],
  };
}

export type Stage08Mutation = {
  state: GameState;
  events: readonly Omit<CommandEvent, 'sequence'>[];
  code: string | null;
  message: string;
};

function unchanged(state: GameState, code: string, message: string): Stage08Mutation {
  return { state, events: [], code, message };
}

function emit(type: string, at: number, payload: Record<string, unknown>): Omit<CommandEvent, 'sequence'> {
  return { type, occurredAtElapsedMs: at, payload };
}

function sitePosition(world: WorldDefinition, siteId: string) {
  return world.sites.find(site => site.id === siteId)?.position ?? null;
}

function playerAtSite(state: GameState, world: WorldDefinition, siteId: string): boolean {
  const position = sitePosition(world, siteId);
  return !!position && Math.hypot(position.xMm - state.player.position.xMm, position.yMm - state.player.position.yMm) <= INTERACTION_RANGE_MM;
}

function updateQuest(state: GameState, fields: Partial<GameState['quests'][number]>): GameState['quests'] {
  return state.quests.map(quest => quest.questId === Q08_ID ? { ...quest, ...fields } : quest);
}

function adjustCurrency(balances: readonly CurrencyBalance[], currencyId: string, delta: number): CurrencyBalance[] {
  const found = balances.find(balance => balance.currencyId === currencyId);
  if (!found) return delta === 0 ? [...balances] : [...balances, { currencyId, amount: delta }].filter(balance => balance.amount > 0);
  return balances.map(balance => balance.currencyId === currencyId ? { ...balance, amount: balance.amount + delta } : balance).filter(balance => balance.amount > 0);
}

export function acceptQ08(state: GameState, world: WorldDefinition): Stage08Mutation {
  if (state.simElapsedMs < Q08_DISTRESS_MS || state.simElapsedMs >= Q08_DEADLINE_MS || state.stage08.caravan.status !== 'distressed') {
    return unchanged(state, 'QUEST_NOT_OFFERED', 'The fixed caravan distress window is not open.');
  }
  if (!playerAtSite(state, world, 'SITE-LL01-049')) return unchanged(state, 'QUEST_ISSUER_NOT_ACCESSIBLE', 'Reach the old trade-road bridge before accepting Torven’s request.');
  const prior = state.quests.find(quest => quest.questId === Q08_ID);
  if (!prior || prior.state !== 'dormant') return unchanged(state, 'QUEST_ALREADY_ACCEPTED', 'This caravan request has already been resolved or accepted.');
  const next = structuredClone(state);
  next.quests = updateQuest(next, {
    state: 'accepted', acceptedAt: next.simElapsedMs, objectiveId: 'Q08-NEGOTIATE-AND-ESCORT',
    rewardStatus: 'unavailable', failureReason: null,
  });
  next.playerKnowledge = {
    ...next.playerKnowledge,
    knownSiteIds: [...new Set([...next.playerKnowledge.knownSiteIds, 'SITE-LL01-049'])].sort(),
  };
  return {
    state: next,
    events: [emit('quest_accepted', state.simElapsedMs, { questId: Q08_ID, sourceContract: 'QUEST-REGISTRY-LL01-1.0', objectiveId: 'Q08-NEGOTIATE-AND-ESCORT' })],
    code: null,
    message: 'Torven’s fixed caravan distress request is accepted.',
  };
}

export function negotiateQ08(state: GameState, world: WorldDefinition, commandId: string): Stage08Mutation {
  const caravan = state.stage08.caravan;
  const quest = state.quests.find(item => item.questId === Q08_ID);
  if (!quest || quest.state !== 'accepted') return unchanged(state, 'QUEST_NOT_ACCEPTED', 'Accept the visible caravan request first.');
  if (caravan.status !== 'distressed' || state.simElapsedMs >= caravan.deadlineAtElapsedMs) return unchanged(state, 'CARAVAN_DISTRESS_CLOSED', 'The caravan is no longer waiting at the bridge.');
  if (!playerAtSite(state, world, 'SITE-LL01-049')) return unchanged(state, 'CARAVAN_NOT_ACCESSIBLE', 'Reach the caravan at the old trade-road bridge.');
  if (caravan.grainSacks < 1 || !caravan.ledgerIntact) return unchanged(state, 'CARAVAN_NEGOTIATION_INPUT_UNAVAILABLE', 'The caravan ledger must contain one unreserved grain sack.');
  const next = structuredClone(state);
  next.stage08.caravan = {
    ...caravan,
    status: 'negotiated',
    grainSacks: caravan.grainSacks - 1,
    negotiationReceiptId: commandId,
  };
  next.quests = updateQuest(next, { objectiveId: 'Q08-ESCORT-TO-KRONA-GATE' });
  return {
    state: next,
    events: [emit('caravan_safe_passage_negotiated', state.simElapsedMs, {
      questId: Q08_ID, caravanId: caravan.id, consumedCargoId: 'CARGO-CARAVAN-LL01-01-GRAIN', quantity: 1,
      raiderOutcome: 'WITHDREW_AFTER_ONE_RECORDED_GRAIN_SACK', animalsRemaining: caravan.survivingDraftAnimals,
    })],
    code: null,
    message: 'One cargo sack was entered in the ledger for safe passage; the fixed raider group withdrew.',
  };
}

export function escortQ08(state: GameState, world: WorldDefinition, commandId: string): Stage08Mutation {
  const caravan = state.stage08.caravan;
  const quest = state.quests.find(item => item.questId === Q08_ID);
  if (!quest || quest.state !== 'accepted' || caravan.status !== 'negotiated') return unchanged(state, 'CARAVAN_NOT_READY_TO_ESCORT', 'Resolve the bridge negotiation before escorting the caravan.');
  if (!playerAtSite(state, world, 'SITE-LL01-049')) return unchanged(state, 'CARAVAN_NOT_ACCESSIBLE', 'Meet the caravan at the bridge before it departs.');
  const from = sitePosition(world, 'SITE-LL01-049');
  const to = sitePosition(world, 'SITE-LL01-046');
  if (!from || !to) return unchanged(state, 'CARAVAN_ROUTE_UNAVAILABLE', 'The fixed bridge-to-town route is missing from the world package.');
  const distanceMm = Math.ceil(Math.hypot(to.xMm - from.xMm, to.yMm - from.yMm));
  const travelMs = Math.ceil(distanceMm * HOUR_MS / CARAVAN_SPEED_MM_PER_HOUR);
  const arrivalAtElapsedMs = state.simElapsedMs + travelMs;
  if (arrivalAtElapsedMs > caravan.deadlineAtElapsedMs) return unchanged(state, 'CARAVAN_DEADLINE_UNREACHABLE', 'The convoy cannot reach Krona Gate before its source-fixed window closes.');
  const next = structuredClone(state);
  next.stage08.caravan = { ...caravan, status: 'escorting', arrivalAtElapsedMs, escortReceiptId: commandId };
  next.quests = updateQuest(next, { objectiveId: 'Q08-ARRIVE-AT-KRONA-GATE' });
  return {
    state: next,
    events: [emit('caravan_escort_started', state.simElapsedMs, {
      questId: Q08_ID, caravanId: caravan.id, destinationSiteId: 'SITE-LL01-046', arrivalAtElapsedMs,
      speedMmPerHour: CARAVAN_SPEED_MM_PER_HOUR, distanceMm,
    })],
    code: null,
    message: 'The caravan is traveling along the fixed bridge-to-town route.',
  };
}

function createMarketOffer(at: number): Stage08MarketOfferState {
  return {
    id: MARKET_BREAD_OFFER_ID,
    status: 'active',
    sellerId: 'MARKET-LL01-046',
    sourceEntryId: null,
    handlerVersion: STAGE08_RULE_VERSION,
    locationSiteId: 'SITE-LL01-046',
    itemTemplateId: 'BREAD',
    itemUnit: 'item',
    quantityPerPurchase: 1,
    currencyId: KRONA_CURRENCY,
    unitPrice: 1,
    stockRemaining: 24,
    initialStock: 24,
    lifetimePurchaseLimit: 10,
    purchasedQuantity: 0,
    consumedQuantity: 0,
    availableAtElapsedMs: at,
    expiresAtElapsedMs: null,
    exclusiveEventId: null,
    effectContract: 'FOOD-CONSUMPTION-STAGE-04-1.0',
  };
}

function createCaravanSaltLot(at: number): Stage08AuctionLotState {
  return {
    id: CARAVAN_SALT_AUCTION_ID,
    sellerId: 'HERO-LL01-05',
    locationSiteId: 'SITE-LL01-046',
    sourceCargoId: CARAVAN_SALT_CARGO_ID,
    itemTemplateId: 'SALT',
    itemUnit: 'unit',
    quantity: 6,
    reservedQuantity: 0,
    minimumUnitBid: 5,
    currencyId: KRONA_CURRENCY,
    opensAtElapsedMs: at,
    closesAtElapsedMs: at + CARAVAN_AUCTION_DURATION_MS,
    status: 'open',
  };
}

export function claimQ08Reward(state: GameState, world: WorldDefinition, commandId: string): Stage08Mutation {
  const quest = state.quests.find(item => item.questId === Q08_ID);
  const caravan = state.stage08.caravan;
  if (!quest || quest.state !== 'completed' || quest.rewardStatus !== 'pending') return unchanged(state, 'QUEST_REWARD_NOT_CLAIMABLE', 'Complete the caravan route before claiming its fixed reward.');
  if (!playerAtSite(state, world, 'SITE-LL01-046') || caravan.locationSiteId !== 'SITE-LL01-046') return unchanged(state, 'QUEST_REWARD_NOT_ACCESSIBLE', 'Claim the reward where Torven’s caravan reached Krona Gate.');
  if (!caravan.torvenAlive || caravan.survivingDraftAnimals < 3 || !caravan.ledgerIntact) return unchanged(state, 'QUEST_REWARD_CONDITIONS_NOT_MET', 'The fixed Torven, three-draft-animal, and intact-ledger conditions are not all satisfied.');
  const rewardKey = `${Q08_ID}|escort|${Q08_REWARD_CONTRACT}`;
  if (state.stage08.rewardClaimReceipts.includes(rewardKey)) return unchanged(state, 'QUEST_REWARD_ALREADY_CLAIMED', 'This fixed reward contract has already been claimed.');
  const next = structuredClone(state);
  next.currency = adjustCurrency(next.currency, KRONA_CURRENCY, 60);
  next.stage08.rewardClaimReceipts = [...next.stage08.rewardClaimReceipts, rewardKey];
  next.stage08.caravan = { ...caravan, tradeRouteUnlocked: true, torvenContractOfferAvailable: true };
  next.stage08.auctionLots = next.stage08.auctionLots.some(lot => lot.id === CARAVAN_SALT_AUCTION_ID)
    ? next.stage08.auctionLots
    : [...next.stage08.auctionLots, createCaravanSaltLot(state.simElapsedMs)];
  next.quests = updateQuest(next, { rewardReceipt: commandId, rewardStatus: 'claimed' });
  return {
    state: next,
    events: [emit('quest_reward_claimed', state.simElapsedMs, {
      questId: Q08_ID, rewardContract: Q08_REWARD_CONTRACT, rewardKey,
      currencyId: KRONA_CURRENCY, amount: 60, tradeRouteId: Q08_ROUTE_ID, contractOfferId: 'HERO_CONTRACT_OFFER-05',
    })],
    code: null,
    message: 'The fixed 60 Krona reward and Torven’s route and contract offers are recorded once.',
  };
}

function canReceiveBread(state: GameState, world: WorldDefinition, containerId: string): string | null {
  const container = state.inventory.containers.find(item => item.id === containerId);
  if (!container || !container.observed) return 'ITEM_DESTINATION_NOT_ACCESSIBLE';
  const accessible = container.location.kind === 'carried' && container.location.ownerId === state.player.id
    || container.location.kind === 'site' && playerAtSite(state, world, container.location.siteId)
    || container.location.kind === 'building' && state.buildings.some(building => building.id === container.location.buildingId
      && building.position && Math.hypot(building.position.xMm - state.player.position.xMm, building.position.yMm - state.player.position.yMm) <= INTERACTION_RANGE_MM)
    || container.location.kind === 'unit' && state.ownedUnits.some(unit => unit.id === container.location.unitId && unit.position
      && Math.hypot(unit.position.xMm - state.player.position.xMm, unit.position.yMm - state.player.position.yMm) <= INTERACTION_RANGE_MM);
  if (!accessible) return 'ITEM_DESTINATION_NOT_ACCESSIBLE';
  const hasMergeable = container.stacks.some(stack => stack.templateId === 'BREAD' && stack.unit === 'item'
    && stack.provenance === 'versioned_game_design' && !stack.equipped && (stack.reservedQuantity ?? 0) === 0);
  if (!hasMergeable && container.capacitySlots !== null && container.stacks.length >= container.capacitySlots) return 'DESTINATION_CAPACITY_FULL';
  return null;
}

export function purchaseMarketOffer(state: GameState, world: WorldDefinition, offerId: string, destinationContainerId: string, quantity: number, commandId: string): Stage08Mutation {
  const offer = state.stage08.marketOffers.find(item => item.id === offerId);
  if (!offer || offer.status !== 'active') return unchanged(state, 'SHOP_OFFER_NOT_AVAILABLE', 'This seller has no active offer with that ID.');
  if (offer.expiresAtElapsedMs !== null && state.simElapsedMs >= offer.expiresAtElapsedMs) return unchanged(state, 'SHOP_OFFER_EXPIRED', 'This offer has passed its fixed expiry boundary.');
  if (!Number.isSafeInteger(quantity) || quantity < 1) return unchanged(state, 'ITEM_QUANTITY_UNAVAILABLE', 'Purchase a positive whole quantity.');
  if (quantity > offer.stockRemaining) return unchanged(state, 'SHOP_STOCK_UNAVAILABLE', 'The seller does not have enough unreserved stock.');
  if (offer.purchasedQuantity + quantity > offer.lifetimePurchaseLimit) return unchanged(state, 'SHOP_PLAYER_LIMIT_REACHED', 'This save has reached the offer’s lifetime cap.');
  if (!playerAtSite(state, world, offer.locationSiteId)) return unchanged(state, 'SHOP_SELLER_NOT_ACCESSIBLE', 'Travel to the market to collect purchased goods.');
  const capacityCode = canReceiveBread(state, world, destinationContainerId);
  if (capacityCode) return unchanged(state, capacityCode, 'Choose an observed, accessible inventory container with an available slot.');
  const itemQuantity = offer.quantityPerPurchase * quantity;
  if (!Number.isSafeInteger(itemQuantity)) return unchanged(state, 'SHOP_QUANTITY_OVERFLOW', 'The delivered item quantity exceeds the supported whole-number range.');
  const totalPrice = offer.unitPrice * quantity;
  if (!Number.isSafeInteger(totalPrice)) return unchanged(state, 'SHOP_PRICE_OVERFLOW', 'The total price exceeds the supported whole-number range.');
  const balance = state.currency.find(item => item.currencyId === offer.currencyId)?.amount ?? 0;
  if (balance < totalPrice) return unchanged(state, 'INSUFFICIENT_CURRENCY', `This purchase costs ${totalPrice} ${offer.currencyId}.`);

  const next = structuredClone(state);
  const destination = next.inventory.containers.find(item => item.id === destinationContainerId)!;
  const stack = destination.stacks.find(item => item.templateId === 'BREAD' && item.unit === 'item'
    && item.provenance === 'versioned_game_design' && !item.equipped && (item.reservedQuantity ?? 0) === 0);
  if (stack) {
    const nextQuantity = stack.quantity + itemQuantity;
    if (!Number.isSafeInteger(nextQuantity)) return unchanged(state, 'SHOP_QUANTITY_OVERFLOW', 'The delivered stack exceeds the supported whole-number range.');
    destination.stacks = destination.stacks.map(item => item.itemId === stack.itemId ? { ...item, quantity: nextQuantity } : item);
  }
  else destination.stacks = [...destination.stacks, {
    itemId: `ITEM-${commandId}`,
    templateId: 'BREAD',
    quantity: itemQuantity,
    unit: 'item',
    ownerId: state.player.id,
    equipped: false,
    equippedSlotId: null,
    foodUnitsPerItem: 1,
    provenance: 'versioned_game_design',
  }];
  next.currency = adjustCurrency(next.currency, offer.currencyId, -totalPrice);
  next.stage08.marketOffers = next.stage08.marketOffers.map(item => item.id !== offerId ? item : {
    ...item, stockRemaining: item.stockRemaining - quantity, purchasedQuantity: item.purchasedQuantity + quantity,
  });
  return {
    state: next,
    events: [emit('shop_purchase_committed', state.simElapsedMs, {
      offerId, sellerId: offer.sellerId, sourceEntryId: offer.sourceEntryId, quantity,
      unitPrice: offer.unitPrice, totalPrice, currencyId: offer.currencyId, destinationContainerId,
      itemTemplateId: offer.itemTemplateId, itemQuantity, handlerVersion: offer.handlerVersion, itemEffectContract: offer.effectContract,
    })],
    code: null,
    message: `Purchased ${quantity} BREAD for ${totalPrice} ${offer.currencyId}; goods were delivered atomically.`,
  };
}

export function placeAuctionBid(state: GameState, world: WorldDefinition, lotId: string, quantity: number, unitBid: number, commandId: string): Stage08Mutation {
  const lot = state.stage08.auctionLots.find(item => item.id === lotId);
  if (!lot || lot.status !== 'open' || state.simElapsedMs < lot.opensAtElapsedMs || state.simElapsedMs >= lot.closesAtElapsedMs) return unchanged(state, 'AUCTION_LOT_NOT_OPEN', 'This auction lot is not open.');
  if (!state.stage08.caravan.tradeRouteUnlocked || !playerAtSite(state, world, lot.locationSiteId)) return unchanged(state, 'AUCTION_SELLER_NOT_ACCESSIBLE', 'The market lot is visible for bidding only at Krona Gate.');
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > lot.quantity - lot.reservedQuantity) return unchanged(state, 'AUCTION_QUANTITY_UNAVAILABLE', 'The requested lot quantity is not available.');
  if (!Number.isSafeInteger(unitBid) || unitBid < lot.minimumUnitBid) return unchanged(state, 'AUCTION_BID_BELOW_RESERVE', `Each unit requires a bid of at least ${lot.minimumUnitBid} ${lot.currencyId}.`);
  const escrowAmount = quantity * unitBid;
  if (!Number.isSafeInteger(escrowAmount)) return unchanged(state, 'AUCTION_BID_OVERFLOW', 'The escrow amount is outside the supported range.');
  const balance = state.currency.find(item => item.currencyId === lot.currencyId)?.amount ?? 0;
  if (balance < escrowAmount) return unchanged(state, 'INSUFFICIENT_CURRENCY', `This bid requires ${escrowAmount} ${lot.currencyId} in escrow.`);
  const next = structuredClone(state);
  const bid: Stage08AuctionBidState = {
    id: `BID-${commandId}`, lotId, bidderId: state.player.id, quantity, unitBid, escrowAmount,
    createdAtElapsedMs: state.simElapsedMs, status: 'open', receiptId: null,
  };
  next.stage08.auctionBids = [...next.stage08.auctionBids, bid];
  next.stage08.auctionLots = next.stage08.auctionLots.map(item => item.id !== lotId ? item : { ...item, reservedQuantity: item.reservedQuantity + quantity });
  next.currency = adjustCurrency(next.currency, lot.currencyId, -escrowAmount);
  return {
    state: next,
    events: [emit('auction_bid_placed', state.simElapsedMs, {
      bidId: bid.id, lotId, bidderId: state.player.id, quantity, unitBid, escrowAmount, currencyId: lot.currencyId,
      status: 'open', sellerAcceptanceRequired: true,
    })],
    code: null,
    message: `Bid is open with ${escrowAmount} ${lot.currencyId} escrowed; no item ownership changed.`,
  };
}

export function cancelAuctionBid(state: GameState, bidId: string, commandId: string): Stage08Mutation {
  const bid = state.stage08.auctionBids.find(item => item.id === bidId);
  if (!bid || bid.status !== 'open') return unchanged(state, 'AUCTION_BID_NOT_OPEN', 'This bid is no longer open.');
  if (bid.bidderId !== state.player.id) return unchanged(state, 'AUCTION_BID_NOT_OWNED', 'Only the bidder can cancel this escrow.');
  const lot = state.stage08.auctionLots.find(item => item.id === bid.lotId);
  if (!lot) return unchanged(state, 'AUCTION_LOT_NOT_FOUND', 'The source lot is missing; escrow was left unchanged.');
  const next = structuredClone(state);
  next.stage08.auctionBids = next.stage08.auctionBids.map(item => item.id !== bidId ? item : { ...item, status: 'cancelled', receiptId: commandId });
  next.stage08.auctionLots = next.stage08.auctionLots.map(item => item.id !== lot.id ? item : { ...item, reservedQuantity: Math.max(0, item.reservedQuantity - bid.quantity) });
  next.currency = adjustCurrency(next.currency, lot.currencyId, bid.escrowAmount);
  return {
    state: next,
    events: [emit('auction_bid_cancelled', state.simElapsedMs, { bidId, lotId: lot.id, returnedEscrow: bid.escrowAmount, currencyId: lot.currencyId })],
    code: null,
    message: 'The open bid was cancelled and its escrow returned; no seller fill occurred.',
  };
}

export function nextStage08BoundaryAt(state: GameState): number | null {
  if (!state.stage08.enabled) return null;
  const caravan = state.stage08.caravan;
  const candidates: number[] = [];
  if (caravan.status === 'at_checkpoint' && state.simElapsedMs < caravan.departsAtElapsedMs) candidates.push(caravan.departsAtElapsedMs);
  if (caravan.status === 'departed' && state.simElapsedMs < caravan.distressAtElapsedMs) candidates.push(caravan.distressAtElapsedMs);
  if (caravan.status !== 'arrived' && caravan.status !== 'withdrawn' && state.simElapsedMs < caravan.deadlineAtElapsedMs) candidates.push(caravan.deadlineAtElapsedMs);
  if (caravan.status === 'escorting' && caravan.arrivalAtElapsedMs !== null && caravan.arrivalAtElapsedMs > state.simElapsedMs) candidates.push(caravan.arrivalAtElapsedMs);
  for (const lot of state.stage08.auctionLots) if (lot.status === 'open' && lot.closesAtElapsedMs > state.simElapsedMs) candidates.push(lot.closesAtElapsedMs);
  for (const offer of state.stage08.marketOffers) if (offer.status === 'active' && offer.expiresAtElapsedMs !== null && offer.expiresAtElapsedMs > state.simElapsedMs) candidates.push(offer.expiresAtElapsedMs);
  return candidates.length ? Math.min(...candidates) : null;
}

export function settleStage08Boundary(state: GameState, at: number): readonly Omit<CommandEvent, 'sequence'>[] {
  if (!state.stage08.enabled) return [];
  const events: Omit<CommandEvent, 'sequence'>[] = [];
  let caravan = state.stage08.caravan;
  if (caravan.status === 'at_checkpoint' && caravan.departsAtElapsedMs === at) {
    caravan = { ...caravan, status: 'departed' };
    events.push(emit('caravan_departed', at, { caravanId: caravan.id, fromSiteId: 'SITE-LL01-052', destinationSiteId: 'SITE-LL01-049' }));
  }
  if (caravan.status === 'departed' && caravan.distressAtElapsedMs === at) {
    caravan = { ...caravan, status: 'distressed', locationSiteId: 'SITE-LL01-049' };
    events.push(emit('caravan_distress_opened', at, { caravanId: caravan.id, questId: Q08_ID, siteId: caravan.locationSiteId, windowClosesAtElapsedMs: caravan.deadlineAtElapsedMs }));
  }
  if (caravan.status === 'escorting' && caravan.arrivalAtElapsedMs === at) {
    caravan = { ...caravan, status: 'arrived', locationSiteId: 'SITE-LL01-046' };
    state.stage08.marketOffers = [...state.stage08.marketOffers.filter(offer => offer.id !== MARKET_BREAD_OFFER_ID), createMarketOffer(at)];
    state.stage08.auctionLots = [...state.stage08.auctionLots.filter(lot => lot.id !== CARAVAN_SALT_AUCTION_ID), createCaravanSaltLot(at)];
    state.quests = updateQuest(state, { state: 'completed', completedAt: at, objectiveId: null, rewardStatus: 'pending', failureReason: null });
    events.push(emit('caravan_arrived', at, { caravanId: caravan.id, siteId: caravan.locationSiteId, survivingDraftAnimals: caravan.survivingDraftAnimals, ledgerIntact: caravan.ledgerIntact }));
    events.push(emit('quest_completed', at, { questId: Q08_ID, rewardContract: Q08_REWARD_CONTRACT, rewardStatus: 'pending' }));
    events.push(emit('market_opened', at, { locationSiteId: 'SITE-LL01-046', offerId: MARKET_BREAD_OFFER_ID, auctionLotId: CARAVAN_SALT_AUCTION_ID }));
  }
  if (caravan.status !== 'arrived' && caravan.status !== 'withdrawn' && caravan.deadlineAtElapsedMs === at) {
    caravan = { ...caravan, status: 'withdrawn', locationSiteId: 'SITE-LL01-052', arrivalAtElapsedMs: null };
    const quest = state.quests.find(item => item.questId === Q08_ID);
    if (quest && (quest.state === 'accepted' || quest.state === 'open')) {
      state.quests = updateQuest(state, { state: 'expired', objectiveId: null, rewardStatus: 'forfeited', failureReason: 'Q08_FIXED_WINDOW_CLOSED' });
    }
    events.push(emit('caravan_window_closed', at, { caravanId: caravan.id, outcome: 'WITHDRAWN_TO_CHECKPOINT', noQuestReward: true }));
  }
  state.stage08.caravan = caravan;

  for (const lot of state.stage08.auctionLots) {
    if (lot.status !== 'open' || lot.closesAtElapsedMs !== at) continue;
    state.stage08.auctionLots = state.stage08.auctionLots.map(item => item.id === lot.id ? { ...item, status: 'closed' } : item);
    const openBids = state.stage08.auctionBids.filter(bid => bid.lotId === lot.id && bid.status === 'open');
    for (const bid of openBids) {
      state.currency = adjustCurrency(state.currency, lot.currencyId, bid.escrowAmount);
      state.stage08.auctionBids = state.stage08.auctionBids.map(item => item.id === bid.id ? { ...item, status: 'expired', receiptId: `EXPIRE-${lot.id}-${at}` } : item);
      events.push(emit('auction_bid_expired', at, { bidId: bid.id, lotId: lot.id, returnedEscrow: bid.escrowAmount, currencyId: lot.currencyId }));
    }
    state.stage08.auctionLots = state.stage08.auctionLots.map(item => item.id === lot.id ? { ...item, reservedQuantity: 0 } : item);
  }
  for (const offer of state.stage08.marketOffers) {
    if (offer.status !== 'active' || offer.expiresAtElapsedMs !== at) continue;
    state.stage08.marketOffers = state.stage08.marketOffers.map(item => item.id === offer.id ? { ...item, status: 'expired' } : item);
    events.push(emit('shop_offer_expired', at, { offerId: offer.id, exclusiveEventId: offer.exclusiveEventId }));
  }
  return events;
}

export function marketOfferAvailability(state: GameState, world: WorldDefinition, offerId: string, destinationContainerId: string) {
  const offer = state.stage08.marketOffers.find(item => item.id === offerId);
  if (!offer || offer.status !== 'active' || (offer.expiresAtElapsedMs !== null && state.simElapsedMs >= offer.expiresAtElapsedMs)) return { code: 'SHOP_OFFER_NOT_AVAILABLE', message: 'There is no active market offer with that ID.' };
  if (!playerAtSite(state, world, offer.locationSiteId)) return { code: 'SHOP_SELLER_NOT_ACCESSIBLE', message: 'Travel to the market before purchasing.' };
  if (!canReceiveBread(state, world, destinationContainerId)) return { code: null, message: 'The chosen container is accessible and has capacity.' };
  return { code: canReceiveBread(state, world, destinationContainerId), message: 'The chosen container cannot receive this offer.' };
}

export function verifyStage08State(state: GameState): void {
  const { caravan, marketOffers, auctionLots, auctionBids, rewardClaimReceipts } = state.stage08;
  if (typeof state.stage08.enabled !== 'boolean'
    || caravan.id !== Q08_CARAVAN_ID || !['at_checkpoint', 'departed', 'distressed', 'negotiated', 'escorting', 'arrived', 'withdrawn'].includes(caravan.status)
    || !Number.isSafeInteger(caravan.grainSacks) || caravan.grainSacks < 0 || caravan.grainSacks > 18
    || !Number.isSafeInteger(caravan.saltUnits) || caravan.saltUnits < 0 || caravan.saltUnits > 6
    || !Number.isSafeInteger(caravan.waterLitres) || caravan.waterLitres < 0 || caravan.waterLitres > 240
    || !Number.isSafeInteger(caravan.survivingDraftAnimals) || caravan.survivingDraftAnimals < 0 || caravan.survivingDraftAnimals > 9
    || !Number.isSafeInteger(caravan.departsAtElapsedMs) || caravan.departsAtElapsedMs !== Q08_DEPARTURE_MS
    || !Number.isSafeInteger(caravan.distressAtElapsedMs) || caravan.distressAtElapsedMs !== Q08_DISTRESS_MS
    || !Number.isSafeInteger(caravan.deadlineAtElapsedMs) || caravan.deadlineAtElapsedMs !== Q08_DEADLINE_MS
    || !(caravan.arrivalAtElapsedMs === null || (Number.isSafeInteger(caravan.arrivalAtElapsedMs) && caravan.arrivalAtElapsedMs >= Q08_DISTRESS_MS))
    || !Array.isArray(marketOffers) || !Array.isArray(auctionLots) || !Array.isArray(auctionBids)
    || new Set(marketOffers.map(item => item.id)).size !== marketOffers.length
    || new Set(auctionLots.map(item => item.id)).size !== auctionLots.length
    || new Set(auctionBids.map(item => item.id)).size !== auctionBids.length
    || !Array.isArray(rewardClaimReceipts) || new Set(rewardClaimReceipts).size !== rewardClaimReceipts.length
    || state.currency.some(balance => !Number.isSafeInteger(balance.amount) || balance.amount < 0)
    || new Set(state.currency.map(balance => balance.currencyId)).size !== state.currency.length) throw new Error('STAGE08_STATE_INVALID');
  for (const offer of marketOffers) {
    if (offer.id !== MARKET_BREAD_OFFER_ID || offer.sourceEntryId !== null || offer.handlerVersion !== STAGE08_RULE_VERSION
      || offer.locationSiteId !== 'SITE-LL01-046' || offer.itemTemplateId !== 'BREAD' || offer.itemUnit !== 'item'
      || offer.quantityPerPurchase !== 1 || offer.currencyId !== KRONA_CURRENCY || offer.unitPrice !== 1
      || offer.initialStock !== 24 || offer.stockRemaining < 0 || offer.stockRemaining > offer.initialStock
      || offer.lifetimePurchaseLimit !== 10 || offer.purchasedQuantity < 0 || offer.purchasedQuantity > offer.lifetimePurchaseLimit
      || offer.consumedQuantity < 0 || offer.consumedQuantity > offer.purchasedQuantity
      || offer.stockRemaining + offer.purchasedQuantity !== offer.initialStock
      || !Number.isSafeInteger(offer.stockRemaining) || !Number.isSafeInteger(offer.purchasedQuantity) || !Number.isSafeInteger(offer.consumedQuantity)
      || !Number.isSafeInteger(offer.availableAtElapsedMs) || offer.availableAtElapsedMs > state.simElapsedMs
      || !(offer.expiresAtElapsedMs === null || (Number.isSafeInteger(offer.expiresAtElapsedMs) && offer.expiresAtElapsedMs > offer.availableAtElapsedMs))
      || offer.exclusiveEventId !== null || offer.effectContract !== 'FOOD-CONSUMPTION-STAGE-04-1.0'
      || !['active', 'closed', 'expired'].includes(offer.status)) throw new Error('STAGE08_MARKET_OFFER_INVARIANT');
  }
  for (const lot of auctionLots) {
    if (lot.id !== CARAVAN_SALT_AUCTION_ID || lot.sourceCargoId !== CARAVAN_SALT_CARGO_ID || lot.locationSiteId !== 'SITE-LL01-046'
      || lot.itemTemplateId !== 'SALT' || lot.itemUnit !== 'unit' || lot.quantity !== 6 || lot.minimumUnitBid !== 5
      || lot.currencyId !== KRONA_CURRENCY || lot.closesAtElapsedMs <= lot.opensAtElapsedMs
      || !Number.isSafeInteger(lot.reservedQuantity) || lot.reservedQuantity < 0 || lot.reservedQuantity > lot.quantity
      || !['scheduled', 'open', 'closed'].includes(lot.status)) throw new Error('STAGE08_AUCTION_LOT_INVARIANT');
    const activeBids = auctionBids.filter(bid => bid.lotId === lot.id && bid.status === 'open');
    if (activeBids.reduce((sum, bid) => sum + bid.quantity, 0) !== lot.reservedQuantity
      || activeBids.some(bid => !Number.isSafeInteger(bid.escrowAmount) || bid.escrowAmount !== bid.quantity * bid.unitBid
        || !Number.isSafeInteger(bid.quantity) || bid.quantity < 1 || bid.quantity > lot.quantity
        || !Number.isSafeInteger(bid.unitBid) || bid.unitBid < lot.minimumUnitBid || bid.bidderId !== state.player.id)
      || (lot.status === 'closed' && activeBids.length > 0)) {
      throw new Error('STAGE08_AUCTION_ESCROW_INVARIANT');
    }
  }
  if (auctionBids.some(bid => !auctionLots.some(lot => lot.id === bid.lotId) || !['open', 'cancelled', 'expired'].includes(bid.status)
    || !Number.isSafeInteger(bid.createdAtElapsedMs) || bid.createdAtElapsedMs > state.simElapsedMs
    || !Number.isSafeInteger(bid.quantity) || bid.quantity < 1 || bid.quantity > auctionLots.find(lot => lot.id === bid.lotId)!.quantity
    || !Number.isSafeInteger(bid.unitBid) || bid.unitBid < auctionLots.find(lot => lot.id === bid.lotId)!.minimumUnitBid
    || !Number.isSafeInteger(bid.escrowAmount) || bid.escrowAmount !== bid.quantity * bid.unitBid
    || (bid.status === 'open' && bid.receiptId !== null) || (bid.status !== 'open' && !bid.receiptId))) {
    throw new Error('STAGE08_AUCTION_BID_INVARIANT');
  }
  const quest = state.quests.find(item => item.questId === Q08_ID);
  const claimed = rewardClaimReceipts.includes(`${Q08_ID}|escort|${Q08_REWARD_CONTRACT}`);
  if (claimed !== Boolean(quest?.rewardStatus === 'claimed')) throw new Error('STAGE08_QUEST_REWARD_RECEIPT_INVARIANT');
  if (claimed && (quest?.state !== 'completed' || !caravan.tradeRouteUnlocked || !caravan.torvenContractOfferAvailable)) throw new Error('STAGE08_REWARD_UNLOCK_INVARIANT');
  if (state.stage08.enabled && quest?.questId !== Q08_ID) throw new Error('STAGE08_QUEST_IDENTITY_INVARIANT');
  if (state.stage08.enabled) {
    const validProgress = caravan.status === 'arrived'
      ? quest?.state === 'completed' && quest.rewardStatus === (claimed ? 'claimed' : 'pending')
      : caravan.status === 'withdrawn'
        ? (quest?.state === 'expired' || quest?.state === 'dormant')
        : ['at_checkpoint', 'departed'].includes(caravan.status)
          ? quest?.state === 'dormant'
          : caravan.status === 'distressed'
            ? (quest?.state === 'dormant' || quest?.state === 'accepted')
            : quest?.state === 'accepted';
    const marketSpent = marketOffers.reduce((sum, offer) => sum + offer.purchasedQuantity * offer.unitPrice, 0);
    const activeEscrow = auctionBids.filter(bid => bid.status === 'open').reduce((sum, bid) => sum + bid.escrowAmount, 0);
    const expectedCurrency = (claimed ? 60 : 0) - marketSpent - activeEscrow;
    const krona = state.currency.find(balance => balance.currencyId === KRONA_CURRENCY)?.amount ?? 0;
    if (!validProgress || !Number.isSafeInteger(marketSpent) || !Number.isSafeInteger(activeEscrow)
      || !Number.isSafeInteger(expectedCurrency) || expectedCurrency < 0 || krona !== expectedCurrency
      || state.currency.some(balance => balance.currencyId !== KRONA_CURRENCY)) throw new Error('STAGE08_ECONOMY_OR_QUEST_INVARIANT');
  }
}

export function settleOpeningLevelRank(state: GameState, at: number): Omit<CommandEvent, 'sequence'> | null {
  if (state.stage08.rankSnapshots.some(snapshot => snapshot.boardId === 'OPENING_LEVEL')) return null;
  // File 07 supplies the frozen ten-contender P0 roster. Its committed actor
  // outcome simulation, level-completion events, and eligibility ledger are not
  // compiled into runtime state yet. Ranking only the player would falsely make
  // an incomplete population appear to be rank 1 and mint a source-fixed prize.
  const sourceContract = 'OPENING_LEVEL|RWD-OPENING-FIXED-2.0|LORD-DND-01-2.7.0|LORD-DND-07-1.3.0';
  const reasonCode = 'P0_FIXED_CONTENDER_RUNTIME_NOT_COMPILED';
  const rows: Stage08RuntimeState['rankSnapshots'][number]['rows'] = [];
  const snapshot = {
    boardId: 'OPENING_LEVEL',
    status: 'blocked' as const,
    settledAtElapsedMs: at,
    sourceContract,
    reasonCode,
    rows,
    snapshotSha256: canonicalStateHash({ boardId: 'OPENING_LEVEL', sourceContract, settledAtElapsedMs: at, reasonCode, rows }),
  };
  state.stage08.rankSnapshots = [...state.stage08.rankSnapshots, snapshot];
  return emit('event_rank_settlement_blocked', at, {
    boardId: snapshot.boardId, reasonCode, sourceContract, snapshotSha256: snapshot.snapshotSha256,
    resultRows: 0, rewardsMinted: 0,
  });
}
