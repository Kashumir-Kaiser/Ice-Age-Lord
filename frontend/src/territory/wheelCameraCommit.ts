export type WheelTimerSchedule=(callback:()=>void,delayMs:number)=>number;
export type WheelTimerCancel=(timer:number)=>void;

export class WheelCameraCommit {
  private timer:number|null=null;
  private latestCommit:(()=>void)|null=null;
  private readonly schedule:WheelTimerSchedule;
  private readonly cancelTimer:WheelTimerCancel;
  private readonly delayMs:number;
  active=false;

  constructor(
    schedule:WheelTimerSchedule=(callback,delayMs)=>window.setTimeout(callback,delayMs),
    cancelTimer:WheelTimerCancel=timer=>window.clearTimeout(timer),
    delayMs=120,
  ) {this.schedule=schedule;this.cancelTimer=cancelTimer;this.delayMs=delayMs;}

  scheduleCommit(commit:()=>void):void {
    this.latestCommit=commit;
    this.active=true;
    if(this.timer!==null)this.cancelTimer(this.timer);
    this.timer=this.schedule(()=>{
      this.timer=null;
      this.active=false;
      const latest=this.latestCommit;
      this.latestCommit=null;
      latest?.();
    },this.delayMs);
  }

  cancelPending():void {
    if(this.timer!==null)this.cancelTimer(this.timer);
    this.timer=null;
    this.latestCommit=null;
    this.active=false;
  }
}
