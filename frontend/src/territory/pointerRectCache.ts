export type PointerRectPosition={left:number;top:number};
export type ClientPoint={x:number;y:number};

export function pointerLocalPoint(client:ClientPoint,rect:PointerRectPosition):ClientPoint {
  return {x:client.x-rect.left,y:client.y-rect.top};
}

export class PointerRectCache {
  private rect:PointerRectPosition|null=null;

  capture(rect:PointerRectPosition):void {
    this.rect={left:rect.left,top:rect.top};
  }

  invalidate():void {
    this.rect=null;
  }

  release():void {
    this.rect=null;
  }

  resolve(readLiveRect:()=>PointerRectPosition,captured:boolean):PointerRectPosition {
    if(!captured)return readLiveRect();
    if(!this.rect)this.capture(readLiveRect());
    return this.rect!;
  }
}
