/** Non-canonical but geographically constrained illustration.
 * Open frozen battlefield around H0, western trench, eastern transition woodland,
 * south-eastern conifer stands leading towards the fixed canonical timber forest.
 * These shapes are not traversable geometry, LOS obstacles or runtime resource truth.
 */
const decimal=(n:number)=>{const x=Math.sin(n*91.78)*15479.317;return x-Math.floor(x);};
const stands=[
  {x:370,y:390,rx:390,ry:680,n:108},
  {x:980,y:1130,rx:960,ry:1050,n:115},
  {x:4700,y:6800,rx:3500,ry:3600,n:135},
] as const;
const trees=stands.flatMap((g,j)=>Array.from({length:g.n},(_,i)=>{
  const a=decimal(i*3+j*99)*Math.PI*2;
  const r=Math.sqrt(.06+decimal(i*7+79*j+.5)*.94);
  return {x:g.x+Math.cos(a)*g.rx*r,y:g.y+Math.sin(a)*g.ry*r,size:7+decimal(i*5+j*37)*8};
}));
const rocks=Array.from({length:170},(_,i)=>{
  const a=decimal(i*4.8)*Math.PI*2,d=Math.sqrt(decimal(i*3+101));
  return {x:-880+Math.cos(a)*1450*d,y:520+Math.sin(a)*1750*d,size:5+decimal(i*13)*11};
});
export default function TerrainDetails({world}:{world:boolean}){
  return <>
    <defs>
      <radialGradient id="rim-forest">
        <stop stopColor="#112f3a" stopOpacity=".85"/><stop offset=".45" stopColor="#284d58" stopOpacity=".7"/>
        <stop offset="1" stopColor="#7295a0" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="rim-snow">
        <stop stopColor="#f3f7ef" stopOpacity=".47"/><stop offset=".5" stopColor="#a8cfce" stopOpacity=".13"/>
        <stop offset="1" stopColor="#d6e6dc" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="rim-creek" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#1b4157"/><stop offset=".55" stopColor="#88c7d6"/><stop offset="1" stopColor="#2e526b"/>
      </linearGradient>
    </defs>
    {/* Open western battlefield, with a trench running through the upwind flank. */}
    <ellipse cx="-930" cy="-130" rx="3100" ry="2450" fill="url(#rim-snow)"/>
    <path d="M-2300-830Q-1380-450-870-920T-105 25Q190 370-335 780"
      fill="none" stroke="#081e31" strokeWidth="94" strokeOpacity=".52"/>
    <path d="M-2300-830Q-1380-450-870-920T-105 25Q190 370-335 780"
      fill="none" stroke="#7499a3" strokeWidth="53" strokeOpacity=".43"/>
    <path d="M-2300-830Q-1380-450-870-920T-105 25Q190 370-335 780"
      fill="none" stroke="#d4e9e7" strokeWidth="9" strokeDasharray="28 70" strokeOpacity=".36"/>
    <path d="M-1720 660Q-1280 310-610 550T1000 155" fill="none" stroke="#cce1dc"
      strokeWidth="37" strokeOpacity=".16"/>
    {/* A treeline just outside camp; main named forest stays at (+4.7,-6.8 km). */}
    {stands.map((g,i)=><ellipse key={i} cx={g.x} cy={g.y} rx={g.rx*1.1} ry={g.ry*1.12}
      fill="url(#rim-forest)" opacity={i===0?".83":".73"}/>)}
    <path d="M1050 1750q680 80 1200 720t1020 1000q840 500 1410 1100t3400 3500"
      fill="none" stroke="#a5c6c2" strokeWidth="350" strokeOpacity=".13"/>
    {/* Geological marble/cut stone to the west and northeast, not precise polygons. */}
    <path d="M-2200 1800-1700 1020-1380 1450-1020 720-580 1220-290 1090 200 1670"
      fill="none" stroke="#d6e9e7" strokeWidth="95" strokeOpacity=".13"/>
    <path d="M-1900 1900-1550 1130-1360 1420-1030 820-630 1320" fill="none"
      stroke="#122b3c" strokeWidth="47" strokeOpacity=".48"/>
    {/* Frozen drainage channel near the canonical ford, only a cartographic hint. */}
    <path d="M4500 5000q1680 700 2050 2020t1460 1900q1600 300 2160 2100"
      fill="none" stroke="url(#rim-creek)" strokeWidth="530" strokeOpacity=".55"/>
    <path d="M4500 5000q1680 700 2050 2020t1460 1900q1600 300 2160 2100"
      fill="none" stroke="#e0eeeb" strokeWidth="65" strokeDasharray="110 175" strokeOpacity=".39"/>
    {/* Physical battlefield debris near fire, consistent with the opening narration. */}
    <g stroke="#bcd2d4" strokeWidth="1.3" opacity=".85">
      <path d="m-53 15 28-12 7 8 14-5M-51 21l-13 12m40-13-2 18" fill="none"/>
      <path d="m-119-18 22 10m-11-22 13 36" stroke="#253b4a" strokeWidth="7"/>
      <path d="m-119-18 22 10m-11-22 13 36" stroke="#a1b8bb" strokeWidth="1.1"/>
      <path d="m-78 76 29-13 12 10-33 16Z" fill="#375565"/>
      <path d="m87-32 13 12 16-3M96-30l-10 19" fill="none" stroke="#8ebac6" strokeWidth="2"/>
    </g>
    {/* Local tree and stone silhouettes are placed with a stable formula, never random runtime seeding. */}
    {!world && <g>
      {trees.map((t,i)=><g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.size/15})`} opacity=".93">
        <ellipse cx="9" cy="11" rx="22" ry="8" fill="#061725" opacity=".5"/>
        <path d="M0-24-15-1l6-2-14 20 13-2-9 17h38L10 15l13 2L9-3l6 2Z"
          fill="#163a45" stroke="#7ca6ac" strokeWidth="1.5"/>
        <path d="m0-24-7 14 9-3m-17 23 16-9m-18 23 16-6" fill="none"
          stroke="#d2e5e1" strokeWidth="2.3" strokeLinecap="round" opacity=".79"/>
      </g>)}
      {rocks.map((r,i)=><g key={i} transform={`translate(${r.x} ${r.y}) scale(${r.size/9})`}>
        <ellipse cx="3" cy="4" rx="8" ry="3.5" fill="#081e2c" opacity=".51"/>
        <path d="M-7 4-4-7 2-13 7-3 9 4Z" fill="#426271" stroke="#b2d0d1" strokeWidth=".8"/>
        <path d="m2-13 0 11 7 6M-4-7 2-3" fill="none" stroke="#dbeae5" strokeWidth="1.4" opacity=".55"/>
      </g>)}
    </g>}
    {/* Frost needles and raised burial contours around H0 remain visible only under illumination. */}
    <g fill="none" strokeLinecap="round" opacity=".3">
      <path d="M-135-85q80-37 145 0 89 42 173-36" stroke="#def2ed" strokeWidth="3.5"/>
      <path d="M-131-68q80-37 145 0 89 42 173-36" stroke="#10283b" strokeWidth="8"/>
      <path d="M-150 115Q-75 58 5 120t159-10" stroke="#d5e9e2" strokeWidth="4"/>
      <path d="M-146 136Q-71 79 9 141t159-10" stroke="#9bbfbe" strokeWidth="2"/>
    </g>
  </>;
}
