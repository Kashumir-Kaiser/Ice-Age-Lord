export const EVENT_LIFECYCLE_VERSION = 'LL01-EVENT-LIFECYCLE-1.0' as const;
import { eventMechanicsFor } from './eventRules.ts';

export type EventRuntimeReadiness = 'executable_lifecycle' | 'calendar_only' | 'settlement_blocked' | 'mandatory_content_blocked';

export function eventRuntimeReadiness(eventId: string): EventRuntimeReadiness {
  if (eventId === 'EV00-SAFE-FIRE') return 'executable_lifecycle';
  if (eventId === 'EV01-OPENING-LEVEL') return 'settlement_blocked';
  if (eventMechanicsFor(eventId)) return 'executable_lifecycle';
  if (/^EV\d\d-/u.test(eventId)) return 'calendar_only';
  return 'mandatory_content_blocked';
}

export function mandatoryEventBlocker(eventId: string) {
  if (eventRuntimeReadiness(eventId) !== 'mandatory_content_blocked') return null;
  return {
    reasonCode: 'EVENT_MECHANICS_NOT_COMPILED',
    playerMessage: 'Tiến trình thế giới đã tạm dừng trước một sự kiện cần luật chưa được triển khai. Lưu game được giữ nguyên.',
  } as const;
}
