export type MapMetricSnapshot = { frames:number;renderMs:number[];intervalMs:number[];textureBytes:number;decodedBytes:number;terrainBytes:number;queued:number;pendingTextures:number;drawCalls:number;activeLoops:number;backend:string;errors:string[];visible:number;total:number;quality:'low'|'normal';terrainLevel:number;visibleTerrainChunks:number;prefetchChunks:number };
export class MapMetrics {
  readonly data:MapMetricSnapshot={frames:0,renderMs:[],intervalMs:[],textureBytes:0,decodedBytes:0,terrainBytes:0,queued:0,pendingTextures:0,drawCalls:0,activeLoops:0,backend:'initializing',errors:[],visible:0,total:0,quality:'normal',terrainLevel:0,visibleTerrainChunks:0,prefetchChunks:0};
  private previous=0;
  constructor(readonly enabled:boolean){}
  frame(start:number):void {if(!this.enabled)return;const now=performance.now();this.data.frames++;this.data.renderMs.push(now-start);if(this.previous)this.data.intervalMs.push(start-this.previous);this.previous=start;for(const a of [this.data.renderMs,this.data.intervalMs])if(a.length>12000)a.splice(0,a.length-12000);}
  error(message:string):void {this.data.errors.push(message);if(this.data.errors.length>20)this.data.errors.shift();}
}
