import type { EntityView } from '../game/GameClient';

export const SVG_ENTITY_MARKER_POOL_CAPACITY = 256;
const SVG_NS = 'http://www.w3.org/2000/svg';
const ICONS: Readonly<Record<string, string>> = {
  fire: '/assets/buildings/survival-fire-l01/icon.svg',
  house: '/assets/buildings/lord-house-damaged/icon.svg',
  tomb: '/assets/buildings/tomb-entry/icon.svg',
  supply: '/assets/items/supply-coffer.svg', chest: '/assets/items/chest.svg',
  wood: '/assets/items/wood.svg', stone: '/assets/items/stone.svg', ore: '/assets/items/ore.svg',
  salt: '/assets/items/salt.svg', herbs: '/assets/items/herbs.svg', water: '/assets/items/water.svg',
};
const SYMBOLS: Readonly<Record<string, string>> = {
  fire: '♨', house: '⌂', tomb: '†', supply: '▤', chest: '▣', wood: '♣',
  stone: '◆', ore: '⬟', site: '⌂', salt: '❄', herbs: '❧', water: '≈',
};

export type PooledEntityMarker = {
  entity: EntityView;
  worldX: number;
  worldY: number;
  screenX: number;
  screenY: number;
  selected: boolean;
  scale: number;
  labelVisible: boolean;
  label: string;
};

type Slot = {
  root: SVGGElement;
  glyph: SVGGElement;
  base: SVGCircleElement;
  ring: SVGCircleElement;
  image: SVGImageElement;
  symbol: SVGTextElement;
  memoryMark: SVGPathElement;
  hitTarget: SVGCircleElement;
  label: SVGTextElement;
  entityKey: string | null;
};

export type SvgEntityMarkerPool = { root: SVGGElement; slots: Slot[]; byEntityKey: Map<string, Slot> };

function svgElement<K extends keyof SVGElementTagNameMap>(document: Document, name: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, name);
}

export function createSvgEntityMarkerPool(root: SVGGElement, capacity = SVG_ENTITY_MARKER_POOL_CAPACITY): SvgEntityMarkerPool {
  const boundedCapacity = Number.isSafeInteger(capacity)
    ? Math.max(0, Math.min(SVG_ENTITY_MARKER_POOL_CAPACITY, capacity))
    : SVG_ENTITY_MARKER_POOL_CAPACITY;
  const slots: Slot[] = [];
  for (let index = 0; index < boundedCapacity; index += 1) {
    const group = svgElement(root.ownerDocument, 'g');
    const glyph = svgElement(root.ownerDocument, 'g');
    const base = svgElement(root.ownerDocument, 'circle');
    const ring = svgElement(root.ownerDocument, 'circle');
    const image = svgElement(root.ownerDocument, 'image');
    const symbol = svgElement(root.ownerDocument, 'text');
    const memoryMark = svgElement(root.ownerDocument, 'path');
    const hitTarget = svgElement(root.ownerDocument, 'circle');
    const label = svgElement(root.ownerDocument, 'text');
    group.setAttribute('class', 'map-entity-marker');
    group.setAttribute('visibility', 'hidden');
    group.setAttribute('aria-hidden', 'true');
    glyph.setAttribute('class', 'map-entity-marker-glyph');
    base.setAttribute('r', '22');
    ring.setAttribute('r', '26');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', '#b4d9d9');
    ring.setAttribute('stroke-opacity', '.22');
    ring.setAttribute('stroke-dasharray', '2 4');
    image.setAttribute('x', '-16'); image.setAttribute('y', '-16');
    image.setAttribute('width', '32'); image.setAttribute('height', '32');
    image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    image.setAttribute('pointer-events', 'none');
    symbol.setAttribute('text-anchor', 'middle'); symbol.setAttribute('y', '8');
    symbol.setAttribute('font-size', '25'); symbol.setAttribute('font-weight', '700');
    symbol.setAttribute('fill', '#e5efea'); symbol.setAttribute('pointer-events', 'none');
    memoryMark.setAttribute('d', 'M-5-29h10'); memoryMark.setAttribute('stroke', '#bdd3d1');
    memoryMark.setAttribute('stroke-width', '2'); memoryMark.setAttribute('stroke-dasharray', '2 2');
    memoryMark.setAttribute('pointer-events', 'none');
    glyph.append(base, ring, image, symbol, memoryMark);
    hitTarget.setAttribute('fill', 'transparent'); hitTarget.setAttribute('pointer-events', 'all');
    label.setAttribute('text-anchor', 'middle'); label.setAttribute('font-size', '11');
    label.setAttribute('fill', '#e5efea'); label.setAttribute('stroke', '#091d27');
    label.setAttribute('stroke-width', '2.5'); label.setAttribute('paint-order', 'stroke');
    label.setAttribute('pointer-events', 'none');
    group.append(glyph, hitTarget, label);
    root.append(group);
    slots.push({ root: group, glyph, base, ring, image, symbol, memoryMark, hitTarget, label, entityKey: null });
  }
  return { root, slots, byEntityKey: new Map() };
}

function entityKey(entity: EntityView): string { return `${entity.ref.type}:${entity.ref.id}`; }

function visiblePoolEntries(markers: readonly PooledEntityMarker[], selectedKey: string, centerX: number, centerY: number): PooledEntityMarker[] {
  return markers.slice().sort((a, b) => {
    const aSelected = entityKey(a.entity) === selectedKey ? 1 : 0;
    const bSelected = entityKey(b.entity) === selectedKey ? 1 : 0;
    return bSelected - aSelected || Number(Boolean(b.entity.settlementId)) - Number(Boolean(a.entity.settlementId))
      || Math.hypot(a.screenX - centerX, a.screenY - centerY) - Math.hypot(b.screenX - centerX, b.screenY - centerY)
      || entityKey(a.entity).localeCompare(entityKey(b.entity));
  }).slice(0, SVG_ENTITY_MARKER_POOL_CAPACITY);
}

function bindSlot(slot: Slot, marker: PooledEntityMarker): void {
  const entity = marker.entity;
  const key = entityKey(entity);
  const remembered = entity.knowledge === 'remembered' || !entity.currentSight;
  const provenanceStroke = entity.provenance === 'canonical' ? '#f1c991' : entity.provenance === 'modeled' ? '#b4d3c7' : '#b4d3c7';
  const artwork = ICONS[entity.iconKind];
  slot.entityKey = key;
  slot.root.setAttribute('class', 'map-entity-marker' + (marker.selected ? ' is-selected' : '') + (entity.knowledge === 'remembered' ? ' is-remembered' : ''));
  slot.root.setAttribute('transform', `translate(${marker.worldX - (entity.x ?? 0)} ${(entity.y ?? 0) - marker.worldY})`);
  slot.root.setAttribute('role', 'button');
  slot.root.setAttribute('tabindex', '0');
  slot.root.setAttribute('data-entity-id', entity.ref.id);
  slot.root.setAttribute('data-entity-type', entity.ref.type);
  slot.root.setAttribute('data-knowledge', entity.knowledge);
  slot.root.setAttribute('aria-label', remembered ? `Vị trí đã biết lần cuối: ${entity.name}` : `Kiểm tra ${entity.name}`);
  slot.root.removeAttribute('aria-hidden');
  slot.root.setAttribute('visibility', 'visible');
  slot.glyph.setAttribute('transform', `translate(${entity.x ?? 0} ${-(entity.y ?? 0)}) scale(${marker.scale})`);
  slot.glyph.setAttribute('opacity', remembered ? '.64' : '1');
  slot.base.setAttribute('fill', entity.provenance === 'modeled' ? '#203f41' : '#0b2933');
  slot.base.setAttribute('stroke', marker.selected ? '#f0c88b' : provenanceStroke);
  slot.base.setAttribute('stroke-width', marker.selected ? '2.5' : '1.6');
  slot.image.setAttribute('visibility', artwork ? 'visible' : 'hidden');
  if (artwork) slot.image.setAttribute('href', artwork);
  slot.symbol.textContent = artwork ? '' : (SYMBOLS[entity.iconKind] ?? entity.iconKind.slice(0, 1).toUpperCase());
  slot.symbol.setAttribute('visibility', artwork ? 'hidden' : 'visible');
  slot.memoryMark.setAttribute('visibility', remembered ? 'visible' : 'hidden');
  slot.hitTarget.setAttribute('transform', `translate(${entity.x ?? 0} ${-(entity.y ?? 0)})`);
  slot.hitTarget.setAttribute('r', String(24 * marker.scale));
  slot.label.setAttribute('visibility', marker.labelVisible ? 'visible' : 'hidden');
  slot.label.setAttribute('transform', `translate(${entity.x ?? 0} ${-(entity.y ?? 0)}) scale(${marker.scale})`);
  slot.label.setAttribute('y', '38');
  slot.label.textContent = marker.label;
}

export function updateSvgEntityMarkerPool(pool: SvgEntityMarkerPool, markers: readonly PooledEntityMarker[], selectedKey: string, centerX: number, centerY: number): void {
  const visible = visiblePoolEntries(markers, selectedKey, centerX, centerY);
  const nextByKey = new Map<string, Slot>();
  const used = new Set<Slot>();
  for (const marker of visible) {
    const key = entityKey(marker.entity);
    const existing = pool.byEntityKey.get(key);
    if (existing) { nextByKey.set(key, existing); used.add(existing); }
  }
  const available = pool.slots.filter(slot => !used.has(slot));
  for (const marker of visible) {
    const key = entityKey(marker.entity);
    if (nextByKey.has(key)) continue;
    const slot = available.shift();
    if (!slot) break;
    nextByKey.set(key, slot); used.add(slot);
  }
  for (const [key, slot] of nextByKey) {
    const marker = visible.find(item => entityKey(item.entity) === key);
    if (marker) bindSlot(slot, marker);
  }
  for (const slot of pool.slots) if (!used.has(slot)) {
    slot.entityKey = null;
    slot.root.setAttribute('visibility', 'hidden');
    slot.root.setAttribute('aria-hidden', 'true');
    slot.root.removeAttribute('data-entity-id');
    slot.root.removeAttribute('data-entity-type');
    slot.root.removeAttribute('data-knowledge');
    slot.root.removeAttribute('aria-label');
    slot.root.removeAttribute('tabindex');
    slot.root.removeAttribute('role');
    slot.root.setAttribute('class', 'map-entity-marker');
  }
  pool.byEntityKey = nextByKey;
}

export function bindSvgEntityMarkerEvents(root: SVGGElement, onSelect: (entity: EntityView['ref']) => void): () => void {
  const activate = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const marker = target.closest<SVGGElement>('[data-entity-id][data-entity-type]');
    if (!marker || !root.contains(marker)) return;
    if (event.type === 'keydown') {
      const keyboard = event as KeyboardEvent;
      if (keyboard.key !== 'Enter' && keyboard.key !== ' ') return;
      keyboard.preventDefault();
    }
    onSelect({ type: marker.dataset.entityType as EntityView['ref']['type'], id: marker.dataset.entityId! });
  };
  root.addEventListener('click', activate);
  root.addEventListener('keydown', activate);
  return () => { root.removeEventListener('click', activate); root.removeEventListener('keydown', activate); };
}
