const round=value=>Math.round(value*100)/100;

const frameFor=node=>{
 const callFrame=node?.callFrame??{};
 return {
  functionName:callFrame.functionName||'(anonymous)',
  url:callFrame.url||'',
  lineNumber:Number.isFinite(callFrame.lineNumber)?callFrame.lineNumber:null,
  columnNumber:Number.isFinite(callFrame.columnNumber)?callFrame.columnNumber:null,
 };
};

export function summarizeCpuProfile(profile,{maxFunctions=40,maxStacks=25,maxContexts=3,maxDepth=12}={}){
 const nodes=Array.isArray(profile?.nodes)?profile.nodes:[];
 const byId=new Map(nodes.map(node=>[node.id,node]));
 const parentById=new Map();
 for(const node of nodes)for(const childId of node.children??[])if(!parentById.has(childId))parentById.set(childId,node.id);
 const pathsById=new Map();
 const pathFor=id=>{
  if(pathsById.has(id))return pathsById.get(id);
  const chain=[],seen=new Set();let current=id;
  while(current!==undefined&&byId.has(current)&&!seen.has(current)&&chain.length<maxDepth){
   seen.add(current);const node=byId.get(current);chain.push(frameFor(node));current=parentById.get(current);
  }
  const path=chain.reverse();pathsById.set(id,path);return path;
 };
 const functions=new Map(),stacks=new Map(),samples=Array.isArray(profile?.samples)?profile.samples:[];let validSampleCount=0,sampledMs=0;
 const deltas=Array.isArray(profile?.timeDeltas)?profile.timeDeltas:[];
 for(let index=0;index<samples.length;index++){
  const node=byId.get(samples[index]);if(!node)continue;
  const weightMs=Math.max(0,Number.isFinite(deltas[index])?deltas[index]/1000:0),frame=frameFor(node),path=pathFor(node.id);validSampleCount++;sampledMs+=weightMs;
  const key=JSON.stringify([frame.functionName,frame.url,frame.lineNumber,frame.columnNumber]);
  let fn=functions.get(key);if(!fn){fn={...frame,samples:0,sampledMs:0,contexts:new Map()};functions.set(key,fn);}
  fn.samples++;fn.sampledMs+=weightMs;
  const stackKey=JSON.stringify(path);let context=fn.contexts.get(stackKey);
  if(!context){context={samples:0,sampledMs:0,frames:path};fn.contexts.set(stackKey,context);}
  context.samples++;context.sampledMs+=weightMs;
  let stack=stacks.get(stackKey);if(!stack){stack={samples:0,sampledMs:0,frames:path};stacks.set(stackKey,stack);}
  stack.samples++;stack.sampledMs+=weightMs;
 }
 const ranked=(items,count)=>items.sort((a,b)=>b.sampledMs-a.sampledMs||b.samples-a.samples).slice(0,count).map(item=>({...item,sampledMs:round(item.sampledMs)}));
 const topFunctions=ranked([...functions.values()].map(fn=>({...fn,contexts:ranked([...fn.contexts.values()],maxContexts)})),maxFunctions);
 const topStacks=ranked([...stacks.values()],maxStacks);
 return {sampleCount:validSampleCount,profiledMs:round(sampledMs),topFunctions,topStacks};
}
