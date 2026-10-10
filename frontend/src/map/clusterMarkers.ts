export type ScreenMarker<T> = { value: T; id: string; kind: string; x: number; y: number; worldX: number; worldY: number };
export type ScreenCluster<T> =
  | { type: 'marker'; id: string; value: T; x: number; y: number; worldX: number; worldY: number }
  | { type: 'cluster'; id: string; memberIds: string[]; count: number; x: number; y: number; worldX: number; worldY: number; bounds: { minX: number; minY: number; maxX: number; maxY: number }; kinds: Record<string, number>; values: T[] };

/** Joins hit areas across neighboring grid cells. Cluster values keep member IDs and bounds;
 * amounts are deliberately not summed, because an unknown or mixed unit has no valid total.
 */
export function clusterMarkers<T>(input: readonly ScreenMarker<T>[], radius = 44): ScreenCluster<T>[] {
  if (input.length < 2) return input.map(item => ({ type: 'marker', id: item.id, value: item.value, x: item.x, y: item.y, worldX: item.worldX, worldY: item.worldY }));
  const parent = input.map((_, i) => i);
  const find = (i: number): number => parent[i] === i ? i : (parent[i] = find(parent[i]));
  const join = (a: number, b: number) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[rb] = ra; };
  const cell = Math.max(1, radius);
  const buckets = new Map<string, number[]>();
  input.forEach((point, i) => {
    const gx = Math.floor(point.x / cell), gy = Math.floor(point.y / cell);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      for (const j of buckets.get(`${gx + dx},${gy + dy}`) ?? []) {
        const other = input[j];
        if ((point.x - other.x) ** 2 + (point.y - other.y) ** 2 < radius ** 2) join(i, j);
      }
    }
    const key = `${gx},${gy}`;
    buckets.set(key, [...(buckets.get(key) ?? []), i]);
  });
  const groups = new Map<number, ScreenMarker<T>[]>();
  input.forEach((point, i) => { const key = find(i); groups.set(key, [...(groups.get(key) ?? []), point]); });
  return [...groups.values()].map(points => {
    if (points.length === 1) {
      const p = points[0];
      return { type: 'marker' as const, id: p.id, value: p.value, x: p.x, y: p.y, worldX: p.worldX, worldY: p.worldY };
    }
    const members = [...points].sort((a, b) => a.id.localeCompare(b.id));
    const memberIds = members.map(p => p.id);
    const kinds: Record<string, number> = {};
    for (const member of members) kinds[member.kind] = (kinds[member.kind] ?? 0) + 1;
    const minX = Math.min(...members.map(p => p.worldX)), maxX = Math.max(...members.map(p => p.worldX));
    const minY = Math.min(...members.map(p => p.worldY)), maxY = Math.max(...members.map(p => p.worldY));
    return {
      type: 'cluster' as const,
      id: `cluster:${memberIds.map(id => encodeURIComponent(id)).join('|')}`,
      memberIds,
      count: members.length,
      x: members.reduce((sum, p) => sum + p.x, 0) / members.length,
      y: members.reduce((sum, p) => sum + p.y, 0) / members.length,
      worldX: (minX + maxX) / 2,
      worldY: (minY + maxY) / 2,
      bounds: { minX, minY, maxX, maxY },
      kinds,
      values: members.map(p => p.value),
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
}

export type LabelCandidate = { id: string; text: string; x: number; y: number; priority: number };
export function collisionFreeLabels(candidates: readonly LabelCandidate[], minWidth = 34): Set<string> {
  const accepted: Array<{ x: number; y: number; width: number }> = [];
  const shown = new Set<string>();
  for (const label of [...candidates].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))) {
    const width = Math.max(minWidth, label.text.length * 6.4);
    const box = { x: label.x - width / 2, y: label.y - 8, width, height: 16 };
    const collides = accepted.some(other => box.x < other.x + other.width + 3 && box.x + box.width + 3 > other.x && box.y < other.y + 18 && box.y + box.height + 3 > other.y - 2);
    if (!collides) { accepted.push(box); shown.add(label.id); }
  }
  return shown;
}
