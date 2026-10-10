export type CameraMode = 'local' | 'world';
export type CameraView = { x: number; y: number; zoom: number };
export type SharedMapCamera = { mode: CameraMode; local: CameraView; world: CameraView };
export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type Viewport = Rect;

export const BASE_VIEW_HEIGHT_M = 172;
export const MIN_LOCAL_ZOOM = 0.0001;
export const MAX_ZOOM = 6;
export const WORLD_HALF_SPAN_M = 96_000;

export const INITIAL_CAMERA: SharedMapCamera = {
  mode: 'local',
  local: { x: 0, y: 0, zoom: 1 },
  world: { x: 0, y: 0, zoom: BASE_VIEW_HEIGHT_M / (WORLD_HALF_SPAN_M * 2.24) },
};

/** Geography is stored in metres with +Y north. SVG uses +Y down. */
export function worldToMap(point: Point): Point { return { x: point.x, y: -point.y }; }
export function mapToWorld(point: Point): Point { return { x: point.x, y: -point.y }; }

export function viewSize(view: CameraView, width: number, height: number) {
  const safeHeight = Math.max(1, height);
  const safeWidth = Math.max(1, width);
  const viewHeight = BASE_VIEW_HEIGHT_M / Math.max(MIN_LOCAL_ZOOM, view.zoom);
  return { width: viewHeight * safeWidth / safeHeight, height: viewHeight };
}

export function viewBox(view: CameraView, width: number, height: number): Viewport {
  const size = viewSize(view, width, height);
  return { x: view.x - size.width / 2, y: view.y - size.height / 2, ...size };
}

export function mapToScreen(point: Point, view: CameraView, rect: Rect): Point {
  const box = viewBox(view, rect.width, rect.height);
  return {
    x: rect.x + (point.x - box.x) / box.width * rect.width,
    y: rect.y + (point.y - box.y) / box.height * rect.height,
  };
}

export function screenToMap(point: Point, view: CameraView, rect: Rect): Point {
  const box = viewBox(view, rect.width, rect.height);
  return {
    x: box.x + (point.x - rect.x) / rect.width * box.width,
    y: box.y + (point.y - rect.y) / rect.height * box.height,
  };
}

export function screenToWorld(point: Point, view: CameraView, rect: Rect): Point {
  return mapToWorld(screenToMap(point, view, rect));
}

export function zoomAtScreenPoint(view: CameraView, rect: Rect, point: Point, zoom: number): CameraView {
  const anchored = screenToMap(point, view, rect);
  const nextZoom = Math.max(MIN_LOCAL_ZOOM, Math.min(MAX_ZOOM, zoom));
  const nextSize = viewSize({ ...view, zoom: nextZoom }, rect.width, rect.height);
  const ratioX = (point.x - rect.x) / rect.width;
  const ratioY = (point.y - rect.y) / rect.height;
  return {
    zoom: nextZoom,
    x: anchored.x - (ratioX - .5) * nextSize.width,
    y: anchored.y - (ratioY - .5) * nextSize.height,
  };
}

export function fitBounds(bounds: { minX: number; minY: number; maxX: number; maxY: number }, rect: Rect, padding = 44): CameraView {
  const width = Math.max(1, rect.width - padding * 2);
  const height = Math.max(1, rect.height - padding * 2);
  const spanX = Math.max(1, bounds.maxX - bounds.minX);
  const spanY = Math.max(1, bounds.maxY - bounds.minY);
  const metresPerPixel = Math.max(spanX / width, spanY / height);
  const zoom = BASE_VIEW_HEIGHT_M / (metresPerPixel * rect.height);
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
    zoom: Math.max(MIN_LOCAL_ZOOM, Math.min(MAX_ZOOM, zoom)),
  };
}

export function fitCircle(radius: number, rect: Rect, padding = 44): CameraView {
  const r = Math.max(0, radius);
  const usableWidth = Math.max(1, rect.width - padding * 2);
  const usableHeight = Math.max(1, rect.height - padding * 2);
  const metresPerPixel = Math.max((2 * r) / usableWidth, (2 * r) / usableHeight, 80 / usableHeight);
  const zoom = BASE_VIEW_HEIGHT_M / (metresPerPixel * Math.max(1, rect.height));
  return { x: 0, y: 0, zoom: Math.max(MIN_LOCAL_ZOOM, Math.min(MAX_ZOOM, zoom)) };
}

function niceDistance(maximum: number): number {
  if (!Number.isFinite(maximum) || maximum <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(maximum));
  const normalized = maximum / power;
  const choice = normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1;
  return choice * power;
}

export function scaleBar(metresPerPixel: number, targetPixels = 110) {
  const distance = niceDistance(Math.max(1e-6, metresPerPixel) * targetPixels);
  return { distance, pixels: distance / Math.max(1e-6, metresPerPixel) };
}
