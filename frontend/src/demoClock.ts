/** Display-clock contract only. Simulation and persistent world state stay frozen. */
export type ClockSpeed='Frozen'|'1x'|'2x'|'5x'|'Custom';
export const INITIAL_CLOCK_SECONDS=7*3600;
export const CUSTOM_MIN=.1;
export const CUSTOM_MAX=3600;
export const DISPLAY_SPEEDS:readonly ClockSpeed[]=['Frozen','1x','2x','5x','Custom'];
export function customMultiplier(value:number):number{
  if(!Number.isFinite(value))return 1;
  return Math.max(CUSTOM_MIN,Math.min(CUSTOM_MAX,value));
}
export function speedMultiplier(speed:ClockSpeed,custom:number):number{
  if(speed==='Frozen')return 0;
  if(speed==='1x')return 1;
  if(speed==='2x')return 2;
  if(speed==='5x')return 5;
  return customMultiplier(custom);
}
export function displayUpdateIntervalMs(speed:number):number{
  if(!Number.isFinite(speed)||speed<=0)throw new RangeError('Clock speed must be finite and positive');
  return Math.max(16,1000/speed);
}
export function advanceDisplayClock(seconds:number,elapsedMs:number,speed:number):number{
  if(!Number.isFinite(seconds)||!Number.isFinite(elapsedMs)||elapsedMs<0||!Number.isFinite(speed)||speed<0)
    throw new RangeError('Clock input must be finite and nonnegative');
  return seconds+elapsedMs/1000*speed;
}
export function displayClock(seconds:number):string{
  const whole=Math.floor(((seconds%86400)+86400)%86400);
  return [Math.floor(whole/3600),Math.floor((whole%3600)/60),whole%60]
    .map(x=>String(x).padStart(2,'0')).join(':');
}
export function displayDay(seconds:number):number{
  return Math.max(1,Math.floor(seconds/86400)+1);
}
