import test from 'node:test';
import assert from 'node:assert/strict';
import {WheelCameraCommit} from '../src/territory/wheelCameraCommit.ts';

function fakeTimers(){
 let now=0,nextId=0;const timers=new Map();
 return {
  schedule(callback,delay){const id=++nextId;timers.set(id,{callback,at:now+delay});return id;},
  cancel(id){timers.delete(id);},
  advance(ms){now+=ms;for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.callback();}},
  pending(){return timers.size;},
 };
}

test('wheel bursts keep transient renderer updates and commit only the latest camera at the debounce boundary',()=>{
 const timers=fakeTimers(),debounce=new WheelCameraCommit(timers.schedule,timers.cancel,120);
 let camera={x:0,y:0,zoom:1};const transforms=[],mapCameraEvents=[],commits=[];
 const present=(next,commit=false)=>{
  camera=next;transforms.push(next);
  mapCameraEvents.push({camera:next,interacting:!commit&&debounce.active});
  if(commit||!debounce.active)commits.push(next);
 };
 const wheel=next=>{debounce.scheduleCommit(()=>present(camera,true));present(next);};
 const first={x:1,y:2,zoom:1.1},second={x:3,y:4,zoom:1.2},latest={x:5,y:6,zoom:1.3};

 wheel(first);wheel(second);wheel(latest);
 assert.deepEqual(transforms,[first,second,latest],'every wheel event immediately publishes its transient transform');
 assert.deepEqual(mapCameraEvents.map(event=>event.interacting),[true,true,true],'renderer receives each update as active interaction');
 assert.deepEqual(commits,[],'React camera state is not committed during the wheel burst');
 assert.equal(timers.pending(),1,'each wheel event replaces the prior trailing timer');
 timers.advance(119);
 assert.deepEqual(commits,[],'the debounce does not commit before 120 ms of inactivity');
 timers.advance(1);
 assert.deepEqual(commits,[latest],'the trailing callback commits exactly the latest camera once');
 assert.deepEqual(transforms,[first,second,latest,latest],'the trailing commit publishes the final camera');
 assert.deepEqual(mapCameraEvents.map(event=>event.interacting),[true,true,true,false]);
 assert.equal(debounce.active,false);
 assert.equal(timers.pending(),0);
});

test('cancelPending clears wheel activity and prevents a stale trailing commit',()=>{
 const timers=fakeTimers(),debounce=new WheelCameraCommit(timers.schedule,timers.cancel,120);let commits=0;
 debounce.scheduleCommit(()=>commits++);
 assert.equal(debounce.active,true);
 debounce.cancelPending();
 timers.advance(500);
 assert.equal(debounce.active,false);
 assert.equal(commits,0);
 assert.equal(timers.pending(),0);
});
