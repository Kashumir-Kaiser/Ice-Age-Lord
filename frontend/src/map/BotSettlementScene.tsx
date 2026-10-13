import { useLayoutEffect, useRef } from 'react';
import type { BotInspectionView } from '../../../packages/contracts/src/index.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
const BOT_SETTLEMENT_POOL_CAPACITY = 256;
const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 360;

type BotStructure = NonNullable<BotInspectionView['structures']>[number];
type BotCohort = NonNullable<BotInspectionView['army']>[number];
type RenderItem = {
  key: string;
  kind: 'structure' | 'cohort';
  label: string;
  detail: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  depthMm: number;
  orientation: number;
  status: string;
};
type RenderSlot = {
  root: SVGGElement;
  rect: SVGRectElement;
  circle: SVGCircleElement;
  label: SVGTextElement;
  title: SVGTitleElement;
  key: string | null;
};
type SettlementPool = { root: SVGGElement; slots: RenderSlot[]; byKey: Map<string, RenderSlot> };

function element<K extends keyof SVGElementTagNameMap>(document: Document, name: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, name);
}

function createPool(root: SVGGElement): SettlementPool {
  return { root, slots: [], byKey: new Map() };
}

function acquireSlot(pool: SettlementPool): RenderSlot {
  const group = element(pool.root.ownerDocument, 'g');
  const rect = element(pool.root.ownerDocument, 'rect');
  const circle = element(pool.root.ownerDocument, 'circle');
  const label = element(pool.root.ownerDocument, 'text');
  const title = element(pool.root.ownerDocument, 'title');
  group.setAttribute('visibility', 'hidden');
  group.setAttribute('aria-hidden', 'true');
  rect.setAttribute('rx', '2');
  rect.setAttribute('vector-effect', 'non-scaling-stroke');
  circle.setAttribute('vector-effect', 'non-scaling-stroke');
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('font-size', '8');
  label.setAttribute('font-weight', '600');
  label.setAttribute('fill', '#e5efea');
  label.setAttribute('stroke', '#0a1d25');
  label.setAttribute('stroke-width', '2.2');
  label.setAttribute('paint-order', 'stroke');
  label.setAttribute('pointer-events', 'none');
  group.append(rect, circle, label, title);
  pool.root.append(group);
  const slot = { root: group, rect, circle, label, title, key: null };
  pool.slots.push(slot);
  return slot;
}

function renderItems(structures: readonly BotStructure[], army: readonly BotCohort[], botId: string): RenderItem[] {
  const buildingItems = structures.map(structure => ({
    key: `${botId}:structure:${structure.id}`,
    kind: 'structure' as const,
    label: structure.blueprintId,
    detail: `${structure.blueprintId} · level ${structure.level} · ${structure.status}`,
    xMm: structure.anchor.xMm,
    yMm: structure.anchor.yMm,
    widthMm: structure.footprintMm.widthMm,
    depthMm: structure.footprintMm.depthMm,
    orientation: structure.orientation,
    status: structure.status,
  }));
  const troopItems = army.filter(cohort => cohort.livingCount > 0).map(cohort => ({
    key: `${botId}:cohort:${cohort.id}`,
    kind: 'cohort' as const,
    label: `${cohort.livingCount} ${cohort.templateId}`,
    detail: `${cohort.livingCount} living · ${cohort.templateId} · level ${cohort.level} · ${cohort.order}`,
    xMm: cohort.location.xMm,
    yMm: cohort.location.yMm,
    widthMm: 0,
    depthMm: 0,
    orientation: 0,
    status: cohort.order,
  }));
  return [...buildingItems, ...troopItems].sort((a, b) => a.key.localeCompare(b.key));
}

function drawSlot(slot: RenderSlot, item: RenderItem, point: { x: number; y: number }, scale: number): void {
  slot.key = item.key;
  slot.root.setAttribute('visibility', 'visible');
  slot.root.removeAttribute('aria-hidden');
  slot.root.setAttribute('data-bot-object-id', item.key);
  slot.root.setAttribute('data-bot-object-kind', item.kind);
  slot.root.setAttribute('transform', `translate(${point.x} ${point.y})`);
  slot.title.textContent = item.detail;
  slot.label.textContent = item.label;
  slot.label.setAttribute('y', item.kind === 'structure' ? '23' : '19');

  if (item.kind === 'structure') {
    const width = Math.max(10, Math.min(72, item.widthMm * scale));
    const height = Math.max(8, Math.min(56, item.depthMm * scale));
    slot.root.setAttribute('class', `bot-settlement-object bot-settlement-object--structure is-${item.status.replaceAll('_', '-')}`);
    slot.root.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${-item.orientation})`);
    slot.rect.setAttribute('visibility', 'visible');
    slot.rect.setAttribute('x', String(-width / 2));
    slot.rect.setAttribute('y', String(-height / 2));
    slot.rect.setAttribute('width', String(width));
    slot.rect.setAttribute('height', String(height));
    slot.rect.setAttribute('fill', item.status === 'destroyed' ? '#303b3d' : item.status === 'under_construction' ? '#816e49' : '#47675b');
    slot.rect.setAttribute('fill-opacity', item.status === 'destroyed' ? '.48' : '.88');
    slot.rect.setAttribute('stroke', item.status === 'damaged' ? '#e19a76' : '#c6d8bd');
    slot.rect.setAttribute('stroke-dasharray', item.status === 'under_construction' ? '3 2' : 'none');
    slot.circle.setAttribute('visibility', 'hidden');
  } else {
    slot.root.setAttribute('class', 'bot-settlement-object bot-settlement-object--cohort');
    slot.rect.setAttribute('visibility', 'hidden');
    slot.circle.setAttribute('visibility', 'visible');
    slot.circle.setAttribute('r', '6');
    slot.circle.setAttribute('fill', item.status === 'retreat' ? '#c38e78' : '#c98d62');
    slot.circle.setAttribute('stroke', '#ffe0b3');
    slot.circle.setAttribute('stroke-width', '1.2');
  }
}

function updatePool(pool: SettlementPool, items: readonly RenderItem[]): number {
  const boundedItems = items.slice(0, BOT_SETTLEMENT_POOL_CAPACITY);
  if (boundedItems.length === 0) {
    for (const slot of pool.slots) resetSlot(slot);
    pool.byKey.clear();
    return items.length;
  }
  while (pool.slots.length < boundedItems.length && pool.slots.length < BOT_SETTLEMENT_POOL_CAPACITY) acquireSlot(pool);
  const minX = Math.min(...boundedItems.map(item => item.xMm));
  const maxX = Math.max(...boundedItems.map(item => item.xMm));
  const minY = Math.min(...boundedItems.map(item => item.yMm));
  const maxY = Math.max(...boundedItems.map(item => item.yMm));
  const spanX = Math.max(150_000, maxX - minX);
  const spanY = Math.max(100_000, maxY - minY);
  const scale = Math.min(500 / spanX, 280 / spanY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const nextByKey = new Map<string, RenderSlot>();
  const used = new Set<RenderSlot>();
  for (const item of boundedItems) {
    const old = pool.byKey.get(item.key);
    if (old) { nextByKey.set(item.key, old); used.add(old); }
  }
  const available = pool.slots.filter(slot => !used.has(slot));
  for (const item of boundedItems) {
    if (nextByKey.has(item.key)) continue;
    const slot = available.shift();
    if (!slot) break;
    nextByKey.set(item.key, slot);
    used.add(slot);
  }
  for (const item of boundedItems) {
    const slot = nextByKey.get(item.key);
    if (!slot) continue;
    drawSlot(slot, item, {
      x: VIEW_WIDTH / 2 + (item.xMm - centerX) * scale,
      y: VIEW_HEIGHT / 2 - (item.yMm - centerY) * scale,
    }, scale);
  }
  for (const slot of pool.slots) if (!used.has(slot)) resetSlot(slot);
  pool.byKey = nextByKey;
  return items.length - boundedItems.length;
}

function resetSlot(slot: RenderSlot): void {
  slot.key = null;
  slot.root.setAttribute('visibility', 'hidden');
  slot.root.setAttribute('aria-hidden', 'true');
  slot.root.removeAttribute('data-bot-object-id');
  slot.root.removeAttribute('data-bot-object-kind');
  slot.root.removeAttribute('class');
  slot.root.removeAttribute('transform');
  slot.rect.removeAttribute('visibility');
  slot.rect.removeAttribute('fill');
  slot.rect.removeAttribute('fill-opacity');
  slot.rect.removeAttribute('stroke');
  slot.rect.removeAttribute('stroke-dasharray');
  slot.circle.removeAttribute('visibility');
  slot.circle.removeAttribute('fill');
  slot.circle.removeAttribute('stroke');
  slot.circle.removeAttribute('stroke-width');
  slot.label.textContent = '';
  slot.title.textContent = '';
}

export function BotSettlementScene({ inspection }: {
  inspection: BotInspectionView | null;
}) {
  const objectRootRef = useRef<SVGGElement>(null);
  const poolRef = useRef<SettlementPool | null>(null);
  const items = inspection ? renderItems(inspection.structures ?? [], inspection.army ?? [], inspection.botId) : [];
  const overflow = Math.max(0, items.length - BOT_SETTLEMENT_POOL_CAPACITY);

  useLayoutEffect(() => {
    const root = objectRootRef.current;
    if (!root) return;
    const pool = createPool(root);
    poolRef.current = pool;
    return () => {
      root.replaceChildren();
      pool.byKey.clear();
      poolRef.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    const pool = poolRef.current;
    if (pool) updatePool(pool, items);
  });

  return <div className="bot-settlement-scene-wrap" data-testid="bot-settlement-scene" hidden={!inspection}>
    <svg className="bot-settlement-scene" viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label="Current settlement buildings and troop locations">
      <rect x="1" y="1" width={VIEW_WIDTH - 2} height={VIEW_HEIGHT - 2} rx="8" className="bot-settlement-ground" />
      <path d="M0 90H600 M0 180H600 M0 270H600 M150 0V360 M300 0V360 M450 0V360" className="bot-settlement-grid" />
      <g ref={objectRootRef} />
    </svg>
    <div className="bot-settlement-legend"><span><i className="bot-settlement-legend-building" /> Buildings · blueprint IDs</span><span><i className="bot-settlement-legend-troops" /> Troop cohorts</span></div>
    {overflow > 0 && <small className="bot-settlement-overflow">Showing {BOT_SETTLEMENT_POOL_CAPACITY} of {items.length} objects; remaining objects stay in the settlement lists.</small>}
  </div>;
}
