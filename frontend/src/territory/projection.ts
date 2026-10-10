export type WorldPoint = { x: number; y: number };
export type TerritoryCamera = WorldPoint & { zoom: number };
export type Viewport = { width: number; height: number };
export type ScreenPoint = WorldPoint;

/** Fixed 2:1 dimetric projection. World coordinates stay in metres (+Y north). */
export function worldToIso(point: WorldPoint): ScreenPoint {
  return { x: 2 * (point.x + point.y), y: point.x - point.y };
}

/** Exact inverse of worldToIso; use this for all ground picking. */
export function isoToWorld(point: ScreenPoint): WorldPoint {
  return { x: point.x / 4 + point.y / 2, y: point.x / 4 - point.y / 2 };
}

export function worldToScreen(point: WorldPoint, camera: TerritoryCamera, viewport: Viewport, pixelsPerWorldUnit = 3): ScreenPoint {
  const p = worldToIso(point), center = worldToIso(camera);
  const scale = pixelsPerWorldUnit * camera.zoom;
  return { x: viewport.width / 2 + (p.x - center.x) * scale, y: viewport.height / 2 + (p.y - center.y) * scale };
}

export function screenToWorld(point: ScreenPoint, camera: TerritoryCamera, viewport: Viewport, pixelsPerWorldUnit = 3): WorldPoint {
  const center = worldToIso(camera), scale = pixelsPerWorldUnit * camera.zoom;
  return isoToWorld({
    x: center.x + (point.x - viewport.width / 2) / scale,
    y: center.y + (point.y - viewport.height / 2) / scale,
  });
}

export function zoomAtScreenPoint(camera: TerritoryCamera, point: ScreenPoint, viewport: Viewport, zoom: number, pixelsPerWorldUnit = 3): TerritoryCamera {
  const nextZoom = Math.max(.002, Math.min(3, zoom));
  const anchor = worldToIso(screenToWorld(point, camera, viewport, pixelsPerWorldUnit));
  return {
    ...isoToWorld({
      x: anchor.x - (point.x - viewport.width / 2) / (pixelsPerWorldUnit * nextZoom),
      y: anchor.y - (point.y - viewport.height / 2) / (pixelsPerWorldUnit * nextZoom),
    }),
    zoom: nextZoom,
  };
}

export function fitWorldBounds(points: readonly WorldPoint[], viewport: Viewport, padding = 76, pixelsPerWorldUnit = 3): TerritoryCamera {
  if (points.length === 0) return { x: 0, y: 0, zoom: 1 };
  const projected = points.map(worldToIso);
  const minX = Math.min(...projected.map(p => p.x)), maxX = Math.max(...projected.map(p => p.x));
  const minY = Math.min(...projected.map(p => p.y)), maxY = Math.max(...projected.map(p => p.y));
  const spanX = Math.max(36, maxX - minX), spanY = Math.max(36, maxY - minY);
  const zoom = Math.min((viewport.width - padding * 2) / (spanX * pixelsPerWorldUnit), (viewport.height - padding * 2) / (spanY * pixelsPerWorldUnit));
  const center = isoToWorld({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 });
  return { ...center, zoom: Math.max(.012, Math.min(2.8, zoom)) };
}
