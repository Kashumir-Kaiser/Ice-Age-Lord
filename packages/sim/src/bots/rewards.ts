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
export function awardBotOpeningRankRewards(
  input: BotPopulationState,
  rows: readonly RankedBotRewardRow[],
  at: number,
): BotPopulationState {
  if (input.generationProfile !== 'P0_ACTIVE') return input;
  const inAdvance = isBotPopulationAdvanceInProgress(input);
  let population = prepareBotPopulationMutation(input);
  const chunks = population.chunks as BotStateChunk[];
  const changed = new Map<number, { cold: BotColdRecord[]; offsets: Set<number> }>();
  const receipts: BotRewardReceipt[] = [...population.rewardReceipts];
  const knownReceiptIds = new Set(receipts.map(receipt => receipt.id));

  for (const row of rows) {
    const botId = row.playerId;
    if (!botId.startsWith('RC-') && !botId.startsWith('BOT-P0-')) continue;
    const receiptId = `EV01-OPENING-LEVEL:${botId}:REWARD`;
    if (knownReceiptIds.has(receiptId)) continue;
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
      eventId: 'EV01-OPENING-LEVEL',
      rewardReceiptId: receiptId,
      awardedAtElapsedMs: at,
      ruleVersion: BOT_EVENT_REWARD_RULE_VERSION,
    }));
    const cold: BotColdRecord = { ...source, eventInventory: [...source.eventInventory, ...inventory] };
    group.cold[offset] = cold;
    group.offsets.add(offset);
    receipts.push({
      id: receiptId,
      eventId: 'EV01-OPENING-LEVEL',
      botId,
      actionReceiptId: qualification.actionReceiptId,
      rank: row.rank,
      rewardBandId: row.rewardBandId,
      occurredAtElapsedMs: at,
      ruleVersion: BOT_EVENT_REWARD_RULE_VERSION,
      items: awardedItems.map(item => ({
        instanceId: item.instanceId,
        itemTemplateId: item.itemTemplateId,
        quantity: item.quantity,
        foodUnitsApplied: 0,
        inventoryQuantity: item.quantity,
      })),
    });
    knownReceiptIds.add(receiptId);
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
  population = { ...population, rewardReceipts: receipts };
  return inAdvance ? population : finishBotPopulationAdvance(population)!;
}
