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
/** Survey preview is a separate developer showcase, NOT discovery in the game. */
export const DEMO_SURVEYED: readonly FogDisc[] = [
  ...OPENING_OBSERVED,
  {x:-75,y:54,clear:68,fade:104},
  {x:122,y:68,clear:66,fade:102},
  {x:68,y:-115,clear:67,fade:100},
  {x:-297,y:98,clear:72,fade:118},
  {x:205,y:-75,clear:63,fade:104},
];
export function visibilityDiscs(minutes:number,level:number,surveyPreview=false,fireActive=true):readonly FogDisc[] {
  const phase=dayPhase(minutes),radius=heatRadiusM(level,fireActive);
  const sight=PRESENTATION_SIGHT[phase];
  // The radius is fully visible; atmospheric falloff begins OUTSIDE this edge.
  const heat=radius>0?[{x:0,y:0,clear:radius,fade:radius+Math.min(36,Math.max(2,radius*.008))}]:[];
  // Daylight eyesight is separate from explored-map knowledge.
  const daylight=phase==='night'?[]:[{x:0,y:0,clear:radius+sight.clear,fade:radius+sight.fade}];
  const preview=surveyPreview && phase!=='night'?DEMO_SURVEYED.slice(1):[];
  return [...daylight,...preview,...heat];
}
function smoothstep(a:number,b:number,value:number):number {
  const t=Math.max(0,Math.min(1,(value-a)/(b-a)));
  return t*t*(3-2*t);
}
/** 0 visible; 1 absolute night/unseen black. */
export function fogOpacityAt(x:number,y:number,surveyPreview=false,minutes=420,level=1):number {
  return visibilityDiscs(minutes,level,surveyPreview).reduce((opacity,disc)=>{
    const dist=Math.hypot(x-disc.x,y-disc.y);
    return Math.min(opacity,smoothstep(disc.clear,disc.fade,dist));
  },1);
}
/** Automatic overview is triggered only by an intentional zoom-OUT gesture.
 * Fitting heat is a different camera action and NEVER invokes this transition.
 * Minimum 12 km span avoids jumping into world mode for the starting 10 m fire.
 */
export function shouldEnterWorldMap(zoom:number,heatRadius:number):boolean{
  const viewHeight=172/zoom;
  return zoom<.02 && viewHeight>=Math.max(12000,heatRadius*2.65);
}
export const WORLD_ZOOM = 172/(192000*1.12);
export type HarvestKind='wood'|'stone'|'ore'|'herbs'|'water';
export type MapResource = {
  id:string; kind:HarvestKind; name:string; x:number;y:number;
  remaining:number; capacity:number; unit:string; description:string;
  /** Fixture numbers intentionally not canonical and are never written to inventory. */
  demoOnly:true;
};
export type MapChest = {
  id:string;kind:'chest';name:string;x:number;y:number;
  opened:false;contentsKnown:false;demoOnly:true;
};
export type ResourceOrChest=MapResource|MapChest;
export const DEMO_MAP_MARKERS: readonly ResourceOrChest[] = [
  {id:'example-wood-01',kind:'wood',name:'Lâm địa phủ tuyết',x:-48,y:55,remaining:480,capacity:620,unit:'Gỗ',description:'Gỗ có thể thu hoạch tại điểm được khảo sát trong kịch bản minh họa.',demoOnly:true},
  {id:'example-stone-01',kind:'stone',name:'Vỉa đá lộ thiên',x:123,y:67,remaining:270,capacity:350,unit:'Đá',description:'Lượng đá khả dụng để minh họa panel kiểm kê mỏ.',demoOnly:true},
  {id:'example-ore-01',kind:'ore',name:'Mạch quặng trong băng',x:-298,y:99,remaining:65,capacity:110,unit:'Quặng Sắt',description:'Một mạch quặng giả lập, không áp vào kho hay world package.',demoOnly:true},
  {id:'example-herbs-01',kind:'herbs',name:'Địa y băng nguyên',x:59,y:-125,remaining:28,capacity:40,unit:'Bó',description:'Điểm thu hái vật phẩm sinh thái minh họa.',demoOnly:true},
  {id:'example-water-01',kind:'water',name:'Băng sạch khai thác',x:79,y:-98,remaining:900,capacity:1200,unit:'Đơn vị băng',description:'Trữ lượng mẫu phục vụ UI. Không phải nước uống được cấp sẵn.',demoOnly:true},
  {id:'example-chest-01',kind:'chest',name:'Rương chưa mở (minh họa)',x:204,y:-76,opened:false,contentsKnown:false,demoOnly:true},
  // Intentionally undisclosed to the renderer until a later observed map projection.
];
/** Application-level visibility gate: unknown or out-of-sight markers NEVER become icons. */
export function visibleDemoMarkers(surveyPreview:boolean):readonly ResourceOrChest[] {
  if(!surveyPreview) return [];
  return DEMO_MAP_MARKERS.filter(marker=>fogOpacityAt(marker.x,marker.y,true)<=.08);
}
export function displayRemaining(marker:ResourceOrChest):string|null {
  return marker.kind==='chest' ? null : `${marker.remaining.toLocaleString('vi-VN')} / ${marker.capacity.toLocaleString('vi-VN')} ${marker.unit}`;
}
