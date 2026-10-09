import { CANONICAL_CHEST_CACHES, CANONICAL_RESOURCES, CANONICAL_SITES } from './canonicalGeography';
import { fogOpacityAt } from './mapModel';

export type SpotKind = 'wood'|'stone'|'ore'|'water'|'herbs'|'salt'|'chest'|'site';
export type WorldSpot = {
  id:string;kind:SpotKind;x:number;y:number;name:string;label:string;
  amount:number|null;unit:string;detail:string;provenance:'canonical'|'modeled';
  hidden?:boolean;
};
/** Deterministic cartographic infill. Does not append to the canonical resource registry.
 * H0 lies in open ancient battlefield. Transitional conifers are modeled southeast,
 * toward the fixed timber forest at (+4700,-6800); western half stays open/trenched.
 * Spot quantities are visual initial reserves, NOT player inventory or source truth.
 */
const seeded=(i:number,salt:number)=> {
  const v=Math.sin(i*127.19+salt*81.37)*43758.5453;
  return v-Math.floor(v);
};
const configurations=[
  {kind:'wood',name:'Thông phủ tuyết',unit:'Gỗ',count:90,cx:950,cy:-1250,rx:1250,ry:1450,base:35},
  {kind:'wood',name:'Rừng thông ven chiến địa',unit:'Gỗ',count:70,cx:4600,cy:-6500,rx:4400,ry:5200,base:60},
  {kind:'stone',name:'Mỏm đá lộ băng',unit:'Đá',count:72,cx:-1000,cy:-1100,rx:2600,ry:2800,base:42},
  {kind:'ore',name:'Đá quặng thô',unit:'Quặng',count:35,cx:-3600,cy:1800,rx:4500,ry:4300,base:20},
  {kind:'herbs',name:'Cỏ tuyết',unit:'Bó',count:75,cx:300,cy:-400,rx:1700,ry:1950,base:12},
  {kind:'water',name:'Băng nước sạch',unit:'Lít',count:25,cx:6000,cy:-7600,rx:5600,ry:3500,base:45},
] as const;
/** Resource anchors are deliberately not snapped to a grid or scattered over the
 * 30,000-year-old battlefield's central open memorial plain. */
export const MODELED_RESOURCES:readonly WorldSpot[]=[
  {id:'MODELED-SALVAGE-01',kind:'wood',x:4,y:8,name:'Mảnh gỗ đen',label:'Gỗ vụn',amount:18,unit:'Gỗ',detail:'Mảnh gỗ đen lộ ở phía bắc đống lửa (vị trí/khối lượng diễn họa).',provenance:'modeled'},
  {id:'MODELED-STONE-01',kind:'stone',x:-31,y:-52,name:'Đá nhô khỏi băng',label:'Đá',amount:26,unit:'Đá',detail:'Đá mặt lộ thiên, bổ sung minh họa bên rìa đồng bằng.',provenance:'modeled'},
  ...configurations.flatMap((c,g)=>Array.from({length:c.count},(_,i)=>{
    const angle=seeded(i+1,g*3+1)*Math.PI*2;
    const dist=Math.sqrt(.07+seeded(i+3,g*7+2)*.93);
    let x=Math.round(c.cx+Math.cos(angle)*c.rx*dist);
    let y=Math.round(c.cy+Math.sin(angle)*c.ry*dist);
    if(Math.hypot(x,y)<110){x+=150;y-=160;}
    return {id:`MODELED-${String(g+1).padStart(2,'0')}-${String(i+1).padStart(3,'0')}`,
      kind:c.kind,name:c.name,label:c.kind==='wood'?'Gỗ':c.kind==='stone'?'Đá':c.kind==='ore'?'Quặng':c.kind==='herbs'?'Thảo dược':'Băng nước',
      x,y,amount:c.base+Math.floor(seeded(i+6,g+24)*c.base*2.5),unit:c.unit,
      detail:'Điểm thu thập mô phỏng, được tạo có quy luật để lấp khoảng trống chưa khóa trong địa hình.',provenance:'modeled' as const};
  })),
];
const labelForSite=(name:string):string=>{
  if(name.includes('Rừng'))return 'Rừng';
  if(name.includes('Mỏ'))return 'Mỏ đá';
  if(name.includes('Bến')||name.includes('Suối'))return 'Nguồn nước';
  if(name.includes('Xóm')||name.includes('Làng')||name.includes('Thị Trấn')||name.includes('Thành'))return 'Khu cư trú';
  return 'Công trình';
};
export const CANONICAL_SURFACE_SPOTS:readonly WorldSpot[]=[
  ...CANONICAL_RESOURCES.map(r=>({
    id:r.id,kind:r.kind as SpotKind,x:r.x,y:r.y,
    name:r.name,label:r.kind==='wood'?'Gỗ':r.kind==='stone'?'Đá':r.kind==='ore'?'Than':r.kind==='salt'?'Muối':'Nước',
    amount:r.capacity,unit:r.unit,detail:r.renewal,provenance:'canonical' as const,
  })),
  ...CANONICAL_CHEST_CACHES.map(c=>({
    id:c.id,kind:'chest' as const,x:c.x,y:c.y,
    name:'Dấu vết rương · '+c.id,label:'Dấu rương',amount:null,unit:'',
    detail:'Cache trong registry. Có thể nằm dưới băng, bị khóa hoặc thuộc chủ quyền khác. Ánh sáng không tự mở hoặc xác minh bên trong.',
    provenance:'canonical' as const,hidden:/hầm|dưới|khóa|seal|owner|quest|kho vòm|cache hậu|hốc đá/i.test(c.hazard),
  })),
  ...CANONICAL_SITES.filter(s=>!['SITE-LL01-000','SITE-LL01-001','SITE-LL01-002','SITE-LL01-003','SITE-LL01-040','SITE-LL01-041','SITE-LL01-042','SITE-LL01-051'].includes(s.id))
    .map(s=>({id:s.id,kind:'site' as const,x:s.x,y:s.y,
      name:s.name,label:labelForSite(s.name),amount:null,unit:'',detail:s.description+' · '+s.access,
      provenance:'canonical' as const,hidden:s.z< -5 })),
];
export const ALL_MAP_SPOTS:readonly WorldSpot[]=[...CANONICAL_SURFACE_SPOTS,...MODELED_RESOURCES];
/** Light reveals visible geometry; underground caches need scouting beyond illumination.
 * Known scene marker selection is separate from game-world discovery and access.
 */
export function visibleMapSpots(minutes:number,level:number,debug=false):WorldSpot[]{
  return ALL_MAP_SPOTS.filter(s=>
    (debug||!s.hidden)&&
    fogOpacityAt(s.x,s.y,debug,minutes,level)<.12
  );
}
export function visibleMapViewport(spots:readonly WorldSpot[],cx:number,cy:number,width:number,height:number){
  const margin=Math.max(width,height)*.06;
  return spots.filter(s=>s.x>=cx-width/2-margin&&s.x<=cx+width/2+margin&&
    -s.y>=cy-height/2-margin&&-s.y<=cy+height/2+margin);
}
