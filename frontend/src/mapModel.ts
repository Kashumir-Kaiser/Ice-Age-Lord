/** Visual projection helpers. No game-time, acquisition, or state mutations. */
export type DayPhase = 'day' | 'twilight' | 'night';
export const SUNRISE_MINUTES = 7 * 60;
export const SUNSET_MINUTES = 16 * 60 + 30;
export const DARK_MINUTES = 17 * 60;
export const WORLD_HALF_SPAN_M = 96_000; // Source active local map radius, not a viewport limit.
export const DEMO_CAMP = { x: 0, y: 0 } as const;
/** Exact fire-radii from LORD-DND-01 SURVIVAL-FIRE-PROGRESSION-2.0.
 * Source R is radius; source D is DIAMETER and was divided by two, km converted to m.
 * Levels represent read-only previews, never upgrades or reward claims. */
export const FIRE_RADII_M: readonly number[] = [
  10, 20, 40, 80, 160, 200, 300, 350, 400, 450,
  500, 750, 1000, 1500, 2000, 2500, 2500, 2500, 2500, 2500,
  2500, 3000, 3500, 4250, 5000, 7500, 10000, 15000, 20000, 25000,
];
export function heatRadiusM(level: number, fireActive = true): number {
  if (!Number.isInteger(level) || level < 1 || level > 30) throw new RangeError('Fire level must be 1–30');
  return fireActive ? FIRE_RADII_M[level-1] : 0;
}
export function fireForm(level: number): string {
  if (level <= 5) return 'Lửa Trại';
  if (level <= 10) return 'Đại Lửa Trại';
  if (level <= 15) return 'Lò Nung';
  if (level <= 20) return 'Đại Lò Nung';
  if (level <= 25) return 'Tháp Năng Lượng';
  return 'Siêu Trạm Năng Lượng';
}
export function formatDistance(metres: number): string {
  return metres >= 1000 ? `${new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(metres/1000)} km` : `${metres} m`;
}
export function dayPhase(minutes: number): DayPhase {
  if (!Number.isFinite(minutes) || minutes < 0 || minutes >= 1440) throw new RangeError('Clock must be 00:00–23:59');
  if (minutes >= SUNRISE_MINUTES && minutes < SUNSET_MINUTES) return 'day';
  if (minutes >= SUNSET_MINUTES && minutes < DARK_MINUTES) return 'twilight';
  return 'night';
}
export function dayOverlayOpacity(minutes: number): number {
  const phase=dayPhase(minutes);
  if (phase === 'day') return minutes < 450 ? .22 : .07;
  if (phase === 'twilight') return .43;
  return .77;
}
export function formatClock(minutes: number): string {
  const h = Math.floor(minutes/60).toString().padStart(2,'0');
  const m = (minutes%60).toString().padStart(2,'0');
  return `${h}:${m}`;
}
export type FogDisc = {x:number;y:number;clear:number;fade:number};
/** Presentation-only sight distances in metres pending a runtime weather visibility record.
 * Fixed campaign sunrise/sunset and fire radii ARE canonical; visibility metres are NOT.
 * Night: no player-visible terrain outside the live firelight. */
export const PRESENTATION_SIGHT = {
  day:{clear:260,fade:680},
  twilight:{clear:100,fade:240},
  night:{clear:0,fade:0},
} as const;
export const OPENING_OBSERVED: readonly FogDisc[] = [{x:0,y:0,clear:58,fade:108}];
/** Fixed fixture memory. These observations are distinct from the light preview below. */
export const DEMO_EXPLORED: readonly FogDisc[] = [
  ...OPENING_OBSERVED,
  {x:-31,y:52,clear:22,fade:48},
];
export function visibilityDiscs(minutes:number,level:number,fireActive=true):readonly FogDisc[] {
  const phase=dayPhase(minutes),radius=heatRadiusM(level,fireActive);
  const sight=PRESENTATION_SIGHT[phase];
  // The radius is fully visible; atmospheric falloff begins OUTSIDE this edge.
  const heat=radius>0?[{x:0,y:0,clear:radius,fade:radius+Math.min(36,Math.max(2,radius*.008))}]:[];
  // Daylight eyesight is separate from explored-map knowledge.
  const daylight=phase==='night'?[]:[{x:0,y:0,clear:radius+sight.clear,fade:radius+sight.fade}];
  return [...daylight,...heat];
}
function smoothstep(a:number,b:number,value:number):number {
  if(b<=a)return value<=a?0:1;
  const t=Math.max(0,Math.min(1,(value-a)/(b-a)));
  return t*t*(3-2*t);
}
/** 0 visible; 1 fully fogged. Independent visibility sources combine by union. */
export function fogOpacityForDiscs(x:number,y:number,discs:readonly FogDisc[]):number {
  return discs.reduce((opacity,disc)=>{
    const dist=Math.hypot(x-disc.x,y-disc.y);
    return Math.min(opacity,smoothstep(disc.clear,disc.fade,dist));
  },1);
}
/** 0 visible; 1 absolute night/unseen black. */
export function fogOpacityAt(x:number,y:number,minutes=420,level=1,fireActive=true):number {
  return fogOpacityForDiscs(x,y,visibilityDiscs(minutes,level,fireActive));
}
/** A retained observation makes terrain legible in darkness without making it current. */
export function exploredOpacityAt(x:number,y:number):number {
  return DEMO_EXPLORED.reduce((opacity,disc)=>{
    const dist=Math.hypot(x-disc.x,y-disc.y);
    return Math.min(opacity,smoothstep(disc.clear,disc.fade,dist));
  },1);
}
/** Combined fog uses the same minimum-union rule as the numeric sight model. */
export function combinedFogOpacityAt(x:number,y:number,minutes=420,level=1,fireActive=true):number {
  const live=fogOpacityAt(x,y,minutes,level,fireActive);
  const memory=exploredOpacityAt(x,y)*.68;
  return Math.min(live,memory);
}
/** Ordered SVG stop positions. Large fire radii cannot put a dynamic clear stop
 * after a fixed fade stop, which previously made the gradient non-monotonic.
 */
export function fogGradientStops(disc:FogDisc) {
  const fade=disc.fade<=0?1:disc.fade;
  const clear=Math.max(0,Math.min(100,100*disc.clear/fade));
  const transition=Math.max(clear,Math.min(99,87));
  return {clear,transition,edge:100};
}
/** Automatic overview is triggered only by an intentional zoom-OUT gesture.
 * Fitting heat is a different camera action and NEVER invokes this transition.
 * Minimum 12 km span avoids jumping into world mode for the starting 10 m fire.
 */
export function shouldEnterWorldMap(zoom:number,heatRadius:number):boolean{
  const viewHeight=172/zoom;
  return zoom<.02 && viewHeight>=Math.max(12000,heatRadius*2.65);
}
export function shouldReturnToLocalMap(zoom:number):boolean { return zoom>.035; }
export const WORLD_ZOOM = 172/(192000*1.12);
