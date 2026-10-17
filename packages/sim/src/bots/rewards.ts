import type { BotColdRecord, BotPopulationState, BotRewardReceipt, BotStateChunk } from '../../../contracts/src/index.ts';
import { BOT_EVENT_REWARD_RULE_VERSION, botChunkHash, botRowHash, finishBotPopulationAdvance, isBotPopulationAdvanceInProgress, markBotPopulationChunkChanged, prepareBotPopulationMutation } from './state.ts';

type CommittedRewardItem = { instanceId: string; itemTemplateId: string; quantity: number; status: 'committed' | 'blocked'; blocker: string | null };
type RankedBotRewardRow = { playerId: string; rank: number; rewardBandId: string; rewardItems: readonly CommittedRewardItem[] };

function ordinalFromId(botId: string): number | null {
  const named = /^RC-(\d{3})$/.exec(botId);
  if (named) {
    const slot = Number(named[1]);
    return slot >= 2 && slot <= 10 ? slot - 1 : null;
  }
  const generated = /^BOT-P0-(\d{4,})$/.exec(botId);
  const ordinal = generated ? Number(generated[1]) : NaN;
  return Number.isSafeInteger(ordinal) && ordinal >= 10 ? ordinal : null;
}

/** Materializes one frozen opening-board entitlement per ranked bot into its durable inventory. */
export function awardBotRankedEventRewards(
  input: BotPopulationState,
  eventId: string,
  rows: readonly RankedBotRewardRow[],
  at: number,
  saveId = input.saveSeed,
): BotPopulationState {
  if (input.generationProfile !== 'P0_ACTIVE') return input;
  const inAdvance = isBotPopulationAdvanceInProgress(input);
  let population = prepareBotPopulationMutation(input);
  const chunks = population.chunks as BotStateChunk[];
  const changed = new Map<number, { cold: BotColdRecord[]; offsets: Set<number> }>();
  const receipts: BotRewardReceipt[] = [...population.rewardReceipts];
  const knownReceiptIds = new Set(receipts.map(receipt => receipt.id));
  let remainsChests = population.remainsChests;

  for (const row of rows) {
    const botId = row.playerId;
    if (!botId.startsWith('RC-') && !botId.startsWith('BOT-P0-')) continue;
    const receiptId = `${saveId}:${eventId}:${botId}:${row.rewardBandId}:REWARD`;
    // Saves created before rewards were scoped to a save used this shorter
    // identity. Treat it as the same entitlement during replay so an upgrade
    // cannot mint a second copy under the new receipt format.
    const legacyReceiptId = `${eventId}:${botId}:REWARD`;
    if (knownReceiptIds.has(receiptId) || knownReceiptIds.has(legacyReceiptId)) continue;
    const ordinal = ordinalFromId(botId);
    if (ordinal === null || ordinal > population.botCount) throw new Error(`BOT_EVENT_REWARD_BOT_UNKNOWN:${botId}`);
    const chunkIndex = Math.floor((ordinal - 1) / population.chunkSize);
    const offset = ordinal - chunks[chunkIndex]!.firstOrdinal;
    let group = changed.get(chunkIndex);
    if (!group) {
      group = { cold: chunks[chunkIndex]!.cold.slice(), offsets: new Set() };
      changed.set(chunkIndex, group);
    }
    const source = group.cold[offset];
    if (!source || source.botId !== botId) throw new Error(`BOT_EVENT_REWARD_ROW_MISMATCH:${botId}`);
    const qualification = population.eventReceipts.filter(receipt => receipt.botId === botId)
      .sort((a, b) => a.occurredAtElapsedMs - b.occurredAtElapsedMs || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
    if (!qualification) throw new Error(`BOT_EVENT_REWARD_QUALIFICATION_MISSING:${botId}`);

    const awardedItems = row.rewardItems.filter(item => item.status === 'committed');
    const inventory = awardedItems.map(item => ({
      instanceId: `${receiptId}:ITEM:${item.instanceId}:STACK`,
      itemTemplateId: item.itemTemplateId,
      quantity: item.quantity,
      appliedQuantity: 0,
      consumedQuantity: 0,
      eventId,
      rewardReceiptId: receiptId,
      awardedAtElapsedMs: at,
      ruleVersion: BOT_EVENT_REWARD_RULE_VERSION,
    }));
    if (source.lord.lifeState === 'dead') {
      const deathEventId = source.lord.deathRecord?.deathEventId;
      const chestIndex = remainsChests.findIndex(chest => chest.botId === botId && chest.deathEventId === deathEventId);
      if (chestIndex < 0) throw new Error(`BOT_EVENT_REWARD_REMAINS_MISSING:${botId}`);
      const chest = remainsChests[chestIndex]!;
      const rewardItems = inventory.map(item => ({
        instanceId: item.instanceId,
        itemTemplateId: item.itemTemplateId,
        quantity: item.quantity,
        rewardReceiptId: item.rewardReceiptId,
        sourceId: null,
      }));
      remainsChests = remainsChests.map((candidate, index) => index !== chestIndex ? candidate : {
        ...chest,
        inventoryItems: [...chest.inventoryItems, ...rewardItems].sort((a, b) => a.instanceId < b.instanceId ? -1 : a.instanceId > b.instanceId ? 1 : 0),
        // A posthumous reward can arrive after the original remains were claimed.
        // Reopen the same cache with only the newly delivered items.
        ...(chest.state === 'claimed' ? { state: 'unclaimed' as const, claimedById: null } : {}),
      });
    } else {
      const cold: BotColdRecord = { ...source, eventInventory: [...source.eventInventory, ...inventory] };
      group.cold[offset] = cold;
      group.offsets.add(offset);
    }
    receipts.push({
      id: receiptId,
      eventId,
      botId,
      actionReceiptId: qualification.actionReceiptId,
      rank: row.rank,
      rewardBandId: row.rewardBandId,
      occurredAtElapsedMs: at,
      ruleVersion: BOT_EVENT_REWARD_RULE_VERSION,
      items: row.rewardItems.map(item => ({
        instanceId: item.instanceId,
        itemTemplateId: item.itemTemplateId,
        quantity: item.quantity,
        status: item.status,
        blocker: item.blocker,
        foodUnitsApplied: 0,
        inventoryQuantity: item.status === 'committed' ? item.quantity : 0,
      })),
    });
    knownReceiptIds.add(receiptId);
    knownReceiptIds.add(legacyReceiptId);
  }

  for (const [chunkIndex, group] of changed) {
    const source = chunks[chunkIndex]!;
    const rowSha256 = source.rowSha256.slice();
    const withoutHash = { ...source, cold: group.cold, rowSha256, chunkSha256: '' } as BotStateChunk;
    for (const offset of group.offsets) rowSha256[offset] = botRowHash(withoutHash, offset);
    const materialized = { ...withoutHash, rowSha256 } as BotStateChunk;
    chunks[chunkIndex] = { ...materialized, chunkSha256: botChunkHash(materialized) };
    markBotPopulationChunkChanged(population);
  }
  population = { ...population, rewardReceipts: receipts, remainsChests };
  return inAdvance ? population : finishBotPopulationAdvance(population)!;
}

/** Opening-level adapter retained for the one currently executable ranked board. */
export function awardBotOpeningRankRewards(
  input: BotPopulationState,
  rows: readonly RankedBotRewardRow[],
  at: number,
  saveId = input.saveSeed,
): BotPopulationState {
  return awardBotRankedEventRewards(input, 'EV01-OPENING-LEVEL', rows, at, saveId);
}
