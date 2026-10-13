import type { CommandEvent, GameState } from '../../contracts/src/index.ts';
/** Bind lifecycle receipts to the public journal after bounded slices/filtering.
 * Simulation-local event indexes cannot identify the eventual atomic API commit.
 */
export function bindCalendarReceipts(state: GameState, events: readonly CommandEvent[]): GameState {
  const fields = new Map<string, 'openReceiptSequence' | 'lockReceiptSequence' | 'blockedReceiptSequence' | 'resolutionReceiptSequence'>([
    ['opening_protection_started','openReceiptSequence'], ['opening_protection_expired','resolutionReceiptSequence'],
    ['event_calendar_opened','openReceiptSequence'], ['event_calendar_locked','lockReceiptSequence'],
    ['mandatory_event_blocked','blockedReceiptSequence'], ['event_calendar_resolved','resolutionReceiptSequence'],
  ]);
  const updates=new Map<string,Partial<GameState['calendar'][number]>>();
  for(const event of events){
    const field=fields.get(event.type);if(!field)continue;
    const id=event.type.startsWith('opening_protection_')?'EV00-SAFE-FIRE':String(event.payload.eventId);
    const update=updates.get(id)??{};update[field]=event.sequence;updates.set(id,update);
  }
  if(!updates.size)return state;
  const blocker=state.eventProgressionBlocker;
  const blockedSequence=blocker?updates.get(blocker.eventId)?.blockedReceiptSequence:undefined;
  return {...state,calendar:state.calendar.map(row=>updates.has(row.id)?{...row,...updates.get(row.id)}:row),
    eventProgressionBlocker:blocker&&blockedSequence!==undefined&&blockedSequence!==null?{...blocker,receiptSequence:blockedSequence}:blocker};
}
