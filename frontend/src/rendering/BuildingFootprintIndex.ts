export type FootprintBuilding = {
  id: string;
  point: { x: number; y: number };
  orientation: string;
  footprint: { widthM: number; depthM: number };
  draft?: boolean;
  fixture?: boolean;
};

export type PropPoint = { x: number; y: number; size: number };

type Bounds = { minX: number; maxX: number; minY: number; maxY: number; centerX: number; centerY: number; halfWidth: number; halfDepth: number; queryEpoch: number };
const MAX_BUCKETS_PER_FOOTPRINT = 256;
const MAX_QUERY_BUCKETS = 256;

/**
 * Spatial lookup for visual prop clearance around building footprints.
 * This is presentation-only and never changes gameplay occupancy.
 */
export class BuildingFootprintIndex {
  private readonly buckets = new Map<string, Bounds[]>();
  private readonly allFootprints: Bounds[] = [];
  private readonly broadFootprints: Bounds[] = [];
  private readonly cellSize: number;
  private queryEpoch = 0;

  constructor(buildings: readonly FootprintBuilding[], cellSize = 32) {
    if (!(cellSize > 0) || !Number.isFinite(cellSize)) throw new RangeError('cellSize must be finite and positive');
    this.cellSize = cellSize;
    for (const building of buildings) {
      const turned = building.orientation === 'east' || building.orientation === 'west';
      const width = turned ? building.footprint.depthM : building.footprint.widthM;
      const depth = turned ? building.footprint.widthM : building.footprint.depthM;
      if (!Number.isFinite(building.point.x) || !Number.isFinite(building.point.y) ||
          !Number.isFinite(width) || !Number.isFinite(depth) || width <= 0 || depth <= 0) continue;
      const halfWidth = width / 2, halfDepth = depth / 2;
      const bounds = {
        minX: building.point.x - halfWidth,
        maxX: building.point.x + halfWidth,
        minY: building.point.y - halfDepth,
        maxY: building.point.y + halfDepth,
        centerX: building.point.x,
        centerY: building.point.y,
        halfWidth,
        halfDepth,
        queryEpoch: 0,
      };
      this.allFootprints.push(bounds);
      if (![bounds.minX, bounds.maxX, bounds.minY, bounds.maxY].every(Number.isFinite)) {
        this.broadFootprints.push(bounds);
        continue;
      }
      const minCellX = this.cell(bounds.minX), maxCellX = this.cell(bounds.maxX);
      const minCellY = this.cell(bounds.minY), maxCellY = this.cell(bounds.maxY);
      const columns = maxCellX - minCellX + 1, rows = maxCellY - minCellY + 1;
      if (![minCellX, maxCellX, minCellY, maxCellY].every(Number.isSafeInteger) ||
          columns <= 0 || rows <= 0 || columns * rows > MAX_BUCKETS_PER_FOOTPRINT) {
        this.broadFootprints.push(bounds);
        continue;
      }
      for (let y = minCellY; y <= maxCellY; y++) {
        for (let x = minCellX; x <= maxCellX; x++) {
          const key = this.key(x, y);
          const bucket = this.buckets.get(key) ?? [];
          bucket.push(bounds);
          this.buckets.set(key, bucket);
        }
      }
    }
  }

  /** Matches the renderer's strict footprint-plus-prop-size overlap rule. */
  overlaps(prop: PropPoint): boolean {
    if (!Number.isFinite(prop.x) || !Number.isFinite(prop.y) || !Number.isFinite(prop.size) || prop.size < 0) return false;
    const minPropX = prop.x - prop.size, maxPropX = prop.x + prop.size;
    const minPropY = prop.y - prop.size, maxPropY = prop.y + prop.size;
    const minX = this.cell(minPropX), maxX = this.cell(maxPropX);
    const minY = this.cell(minPropY), maxY = this.cell(maxPropY);
    const columns = maxX - minX + 1, rows = maxY - minY + 1;
    if (!Number.isSafeInteger(minX) || !Number.isSafeInteger(maxX) ||
        !Number.isSafeInteger(minY) || !Number.isSafeInteger(maxY) ||
        !Number.isFinite(minPropX) || !Number.isFinite(maxPropX) ||
        !Number.isFinite(minPropY) || !Number.isFinite(maxPropY) ||
        columns <= 0 || rows <= 0 || columns * rows > MAX_QUERY_BUCKETS) {
      return this.allFootprints.some(bounds => this.overlapsBounds(bounds, prop));
    }
    const epoch = this.nextQueryEpoch();
    for (const bounds of this.broadFootprints) {
      if (bounds.queryEpoch === epoch) continue;
      bounds.queryEpoch = epoch;
      if (this.overlapsBounds(bounds, prop)) return true;
    }
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const bucket = this.buckets.get(this.key(x, y));
        if (!bucket) continue;
        for (const bounds of bucket) {
          if (bounds.queryEpoch === epoch) continue;
          bounds.queryEpoch = epoch;
          if (this.overlapsBounds(bounds, prop)) return true;
        }
      }
    }
    return false;
  }

  private nextQueryEpoch(): number {
    if (this.queryEpoch === Number.MAX_SAFE_INTEGER) {
      for (const bounds of this.allFootprints) bounds.queryEpoch = 0;
      this.queryEpoch = 0;
    }
    return ++this.queryEpoch;
  }

  private overlapsBounds(bounds: Bounds, prop: PropPoint): boolean {
    return Math.abs(prop.x - bounds.centerX) < bounds.halfWidth + prop.size &&
      Math.abs(prop.y - bounds.centerY) < bounds.halfDepth + prop.size;
  }
  private cell(coordinate: number): number { return Math.floor(coordinate / this.cellSize); }
  private key(x: number, y: number): string { return `${x}:${y}`; }
}
