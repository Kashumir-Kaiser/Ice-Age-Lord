export type GroundContact={id:string;x:number;y:number;width:number;depth:number};
export type ContactBounds={minX:number;maxX:number;minY:number;maxY:number};
const bounds=(contact:GroundContact):ContactBounds=>({minX:contact.x-contact.width/2-2,maxX:contact.x+contact.width/2+2,minY:contact.y-contact.depth/2-2,maxY:contact.y+contact.depth/2+2});
/** Cosmetic snow compaction sized from existing occupancy; drafts never enter this index. */
export class GroundContacts {
 private contacts=new Map<string,GroundContact>();
 private buckets=new Map<string,GroundContact[]>();
 update(next:readonly GroundContact[]):ContactBounds[]{
  const changed:ContactBounds[]=[],incoming=new Map(next.map(contact=>[contact.id,contact]));
  for(const [id,previous] of this.contacts){const current=incoming.get(id);if(!current||current.x!==previous.x||current.y!==previous.y||current.width!==previous.width||current.depth!==previous.depth)changed.push(bounds(previous));}
  for(const [id,current] of incoming){const previous=this.contacts.get(id);if(!previous||current.x!==previous.x||current.y!==previous.y||current.width!==previous.width||current.depth!==previous.depth)changed.push(bounds(current));}
  if(!changed.length)return changed;
  this.contacts=incoming;this.buckets.clear();
  for(const contact of next){const b=bounds(contact);for(let y=Math.floor(b.minY/32);y<=Math.floor(b.maxY/32);y++)for(let x=Math.floor(b.minX/32);x<=Math.floor(b.maxX/32);x++){const key=x+':'+y,list=this.buckets.get(key)??[];list.push(contact);this.buckets.set(key,list);}}
  return changed;
 }
 scuffAt(x:number,y:number):number {
  let weight=0;
  for(const contact of this.buckets.get(Math.floor(x/32)+':'+Math.floor(y/32))??[]){
   const distance=Math.hypot((x-contact.x)/(contact.width/2+1.8),(y-contact.y)/(contact.depth/2+1.8));
   const edge=Math.max(0,Math.min(1,(1-distance)*2));weight=Math.max(weight,edge*edge*(3-2*edge)*.6);
  }
  return weight;
 }
}
