export const EVENT_LIFECYCLE_VERSION = 'LL01-EVENT-LIFECYCLE-1.0' as const;

export type EventRuntimeReadiness = 'executable_lifecycle' | 'calendar_only' | 'settlement_blocked' | 'mandatory_content_blocked';

const EXECUTABLE_EVENT_IDS = new Set(['EV00-SAFE-FIRE']);
const SETTLEMENT_BLOCKED_EVENT_IDS = new Set(['EV01-OPENING-LEVEL']);

export function eventRuntimeReadiness(eventId: string): EventRuntimeReadiness {
  if (EXECUTABLE_EVENT_IDS.has(eventId)) return 'executable_lifecycle';
  if (SETTLEMENT_BLOCKED_EVENT_IDS.has(eventId)) return 'settlement_blocked';
  return 'mandatory_content_blocked';
}

export function mandatoryEventBlocker(eventId: string) {
  if (eventRuntimeReadiness(eventId) !== 'mandatory_content_blocked') return null;
  return {
    reasonCode: 'EVENT_MECHANICS_NOT_COMPILED',
    playerMessage: 'Tiến trình thế giới đã tạm dừng trước một sự kiện cần luật chưa được triển khai. Lưu game được giữ nguyên.',
  } as const;
}
