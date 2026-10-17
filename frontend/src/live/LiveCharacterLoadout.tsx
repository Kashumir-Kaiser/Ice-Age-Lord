import { Crown, PackageOpen, Shield, Sparkles, Swords } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PlayerView } from '../../../packages/contracts/src/index.ts';
import { CharacterArtwork } from '../shared/PageFrame';
import { playerItemName } from './playerText';

/**
 * Equipment artwork is a presentation of *observed equipped inventory only*.
 * No equipment is inferred, granted, or mutated by this component.
 */
type EquippedItem = PlayerView['inventory']['containers'][number]['items'][number];
const LEFT: readonly [string, string, ReactNode][] = [
  ['MAIN_HAND', 'Vũ khí', <Swords size={20} strokeWidth={1.5} />],
  ['HEAD', 'Đầu', <Crown size={20} strokeWidth={1.5} />],
  ['BODY', 'Thân', <Shield size={20} strokeWidth={1.5} />],
];
const RIGHT: readonly [string, string, ReactNode][] = [
  ['OFF_HAND', 'Tay phụ', <Shield size={20} strokeWidth={1.5} />],
  ['HANDS', 'Tay', <PackageOpen size={20} strokeWidth={1.5} />],
  ['FEET', 'Chân', <PackageOpen size={20} strokeWidth={1.5} />],
];
const ACCESSORIES: readonly [string, string, ReactNode][] = [
  ['NECK', 'Dây chuyền', <Sparkles size={18} strokeWidth={1.5} />],
  ['RING_1', 'Nhẫn', <Sparkles size={18} strokeWidth={1.5} />],
  ['RING_2', 'Nhẫn', <Sparkles size={18} strokeWidth={1.5} />],
];

function EquipmentSocket({ slot, label, icon, item, accessory = false }: {
  slot: string;
  label: string;
  icon: ReactNode;
  item?: EquippedItem;
  accessory?: boolean;
}) {
  return <div className={`equipment-socket${accessory ? ' equipment-socket--accessory' : ''}`}
    role="group" aria-label={`${label}: ${playerItemName(item?.label) ?? 'chưa ghi nhận'}`} data-equipment-slot={slot}>
    <span className="equipment-socket-icon" aria-hidden="true">{icon}</span>
    <span className="equipment-socket-copy"><strong>{label}</strong>
      <small>{item ? `${playerItemName(item.label)} · ×${item.quantity}` : 'Chưa ghi nhận'}</small>
    </span>
  </div>;
}

export default function LiveCharacterLoadout({ view }: { view: PlayerView }) {
  const equipped = view.inventory.containers
    .flatMap(container => container.items)
    .filter(item => item.equipped && item.ownerId === view.player.id);
  const inSlot = (slot: string) => equipped.find(item => item.equippedSlotId === slot);
  const listed = new Set([...LEFT, ...RIGHT, ...ACCESSORIES].map(row => row[0]));
  const other = equipped.filter(item => !item.equippedSlotId || !listed.has(item.equippedSlotId));
  return <section className="panel character-loadout-panel live-character-loadout" aria-label="Trang bị thực tế của nhân vật">
    <div className="character-section-heading">
      <div><span className="eyebrow">TRANG BỊ NHÂN VẬT</span><h2>Vật phẩm trang bị</h2></div>
      <span className="character-loadout-status">{equipped.length ? `${equipped.length} vật phẩm đã ghi nhận` : 'Không có trang bị được ghi nhận'}</span>
    </div>
    <div className="character-equipment-layout">
      <div className="equipment-socket-column">{LEFT.map(([slot,label,icon])=>
        <EquipmentSocket key={slot} slot={slot} label={label} icon={icon} item={inSlot(slot)}/>)}</div>
      <div className="character-center-column">
        <CharacterArtwork className="character-fullbody-art" name={view.player.name} />
        <section className="character-accessories" aria-label="Phụ kiện nhân vật">
          <h3>Phụ kiện</h3>
          <div className="character-accessory-row">{ACCESSORIES.map(([slot,label,icon])=>
            <EquipmentSocket key={slot} slot={slot} label={label} icon={icon} item={inSlot(slot)} accessory/>)}</div>
        </section>
      </div>
      <div className="equipment-socket-column">{RIGHT.map(([slot,label,icon])=>
        <EquipmentSocket key={slot} slot={slot} label={label} icon={icon} item={inSlot(slot)}/>)}</div>
    </div>
    {other.length > 0 && <div className="live-character-other-equipment"><strong>Trang bị ở vị trí khác</strong>
      {other.map(item => <span key={item.itemId}>{playerItemName(item.label)} · Trang bị bổ sung</span>)}
    </div>}
    <small className="live-character-equipment-note">Trang bị được hiển thị theo hành trang hiện có. Để thay đổi trang bị, hãy mở phần quản lý quân lực.</small>
  </section>;
}
