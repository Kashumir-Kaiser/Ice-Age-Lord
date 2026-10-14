/** Presentation-only constants; never read by the simulation. */
export const VISUAL_STYLE_VERSION = 'winter-ink-25d-v1';
export const MAP_PALETTE = Object.freeze({
  snowHighlight: '#DCE5DE', snow: '#A9BDC0', snowShadow: '#607D89',
  shade: '#233D4B', rock: '#53636D', earth: '#62625C', timber: '#665348',
  fire: '#FFD99A', spill: '#D99654',
});
export type Quality = 'low' | 'normal';
export const QUALITY = Object.freeze({
  low: { fps: 30, dpr: 1, terrainBytes: 32 * 1048576, totalBytes: 96 * 1048576, particles: 60, textureSize: 256, queue: 48 },
  normal: { fps: 60, dpr: 1.5, terrainBytes: 64 * 1048576, totalBytes: 192 * 1048576, particles: 180, textureSize: 512, queue: 64 },
});
export type SceneLOD = 'close' | 'district' | 'regional';
export function chooseLOD(span: number, previous?: SceneLOD): SceneLOD {
  if (previous === 'close' && span >= 36 * .85) return previous;
  if (previous === 'district' && span >= 12 * .85 && span <= 36 * 1.15) return previous;
  if (previous === 'regional' && span <= 12 * 1.15) return previous;
  return span >= 36 ? 'close' : span >= 12 ? 'district' : 'regional';
}
/** Hysteresis prevents alternating quality on single slow frames. */
export class AdaptiveQuality {
  quality: Quality = 'normal';
  private overload = 0;
  private headroom = 0;
  resetObservation():void {this.overload=this.headroom=0;}
  update(interval: number, elapsed: number, locked?: Quality): Quality {
    if (locked) { this.quality = locked; this.overload = this.headroom = 0; return locked; }
    if (interval > (this.quality === 'normal' ? 20 : 40)) { this.overload += elapsed; this.headroom = 0; }
    else { this.overload = 0; this.headroom += elapsed; }
    if (this.quality === 'normal' && this.overload >= 3000) { this.quality = 'low'; this.overload = this.headroom = 0; }
    if (this.quality === 'low' && this.headroom >= 15000) { this.quality = 'normal'; this.overload = this.headroom = 0; }
    return this.quality;
  }
}
