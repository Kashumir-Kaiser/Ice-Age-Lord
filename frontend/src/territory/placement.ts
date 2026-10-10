import type { FootprintView, LayoutDraft, SettlementBuildingView } from '../game/GameClient';
import type { WorldPoint } from './projection';

export type PlacementValidation = { blockers: string[]; warnings: string[]; heat: 'inside' | 'partial' | 'outside' | 'off' };
export type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

export function orientedSize(footprint: FootprintView, orientation: LayoutDraft['orientation']) {
  return orientation === 'east' || orientation === 'west'
    ? { width: footprint.depthM, depth: footprint.widthM }
    : { width: footprint.widthM, depth: footprint.depthM };
}

export function footprintBounds(point: WorldPoint, footprint: FootprintView, orientation: LayoutDraft['orientation']): Bounds {
  const size = orientedSize(footprint, orientation);
  return { minX: point.x - size.width / 2, maxX: point.x + size.width / 2, minY: point.y - size.depth / 2, maxY: point.y + size.depth / 2 };
}

export function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

export function footprintHeatRelation(point: WorldPoint, footprint: FootprintView, orientation: LayoutDraft['orientation'], radiusM: number, active = true): PlacementValidation['heat'] {
  if (!active || radiusM <= 0) return 'off';
  const b = footprintBounds(point, footprint, orientation);
  const dx = Math.max(b.minX, Math.min(0, b.maxX));
  const dy = Math.max(b.minY, Math.min(0, b.maxY));
  const minDistance = Math.hypot(dx, dy);
  const corners = [{x:b.minX,y:b.minY},{x:b.minX,y:b.maxY},{x:b.maxX,y:b.minY},{x:b.maxX,y:b.maxY}];
  const maxDistance = Math.max(...corners.map(c => Math.hypot(c.x, c.y)));
  if (maxDistance <= radiusM) return 'inside';
  if (minDistance <= radiusM) return 'partial';
  return 'outside';
}

export function validatePlacement(args: {
  point: WorldPoint;
  footprint: FootprintView;
  orientation: LayoutDraft['orientation'];
  heatRadiusM: number;
  heatActive: boolean;
  existing: readonly (SettlementBuildingView | LayoutDraft)[];
  ignoreId?: string;
}): PlacementValidation {
  const candidate = footprintBounds(args.point, args.footprint, args.orientation);
  const blockers = args.existing.filter(item => item.id !== args.ignoreId && boundsOverlap(candidate, footprintBounds(item, item.footprint, item.orientation))).map(item => `Chồng lấn với ${'name' in item ? item.name : 'bản nháp'}`);
  const heat = footprintHeatRelation(args.point, args.footprint, args.orientation, args.heatRadiusM, args.heatActive);
  const warnings = ['Điều kiện xây dựng và lối vào chưa có nguồn xác thực.', 'Vật cản chưa được cung cấp trong projection.', 'Mốc lưới 1 m chỉ dùng cho thử bố trí.'];
  if (heat === 'outside') warnings.push('Toàn bộ nền nằm ngoài vùng nhiệt hiện tại; luật cho phép xây dựng chưa được cung cấp.');
  if (heat === 'partial') warnings.push('Nền giao cắt ranh giới vùng nhiệt.');
  if (heat === 'off') warnings.push('Không có vùng nhiệt đang hoạt động.');
  return { blockers, warnings, heat };
}

export function snapPlanningPoint(point: WorldPoint, step = 1): WorldPoint {
  return { x: Math.round(point.x / step) * step, y: Math.round(point.y / step) * step };
}
