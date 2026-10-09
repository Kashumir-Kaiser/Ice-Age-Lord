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
      <radialGradient id="rim-ice-ridge">
        <stop stopColor="#192e41" stopOpacity=".65"/><stop offset=".33" stopColor="#466c7b" stopOpacity=".42"/>
        <stop offset=".78" stopColor="#bbd3d4" stopOpacity=".24"/><stop offset="1" stopColor="#e2eeee" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="rim-distant-pines">
        <stop stopColor="#174344" stopOpacity=".68"/><stop offset=".5" stopColor="#3e7273" stopOpacity=".26"/>
        <stop offset="1" stopColor="#789a9d" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="rim-snow">
        <stop stopColor="#f3f7ef" stopOpacity=".47"/><stop offset=".5" stopColor="#a8cfce" stopOpacity=".13"/>
        <stop offset="1" stopColor="#d6e6dc" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="rim-creek" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#1b4157"/><stop offset=".55" stopColor="#88c7d6"/><stop offset="1" stopColor="#2e526b"/>
      </linearGradient>
    </defs>
    {/* Distant modeled belts fill the wide exploration canvas; coordinates are
         deliberately not treated as source-lockable roads or terrain boundaries. */}
    <ellipse cx="-15600" cy="-6300" rx="5800" ry="4700" fill="url(#rim-ice-ridge)" transform="rotate(-19 -15600 -6300)"/>
    <ellipse cx="-11700" cy="9250" rx="5200" ry="6200" fill="url(#rim-ice-ridge)" transform="rotate(21 -11700 9250)"/>
    <ellipse cx="11200" cy="-13300" rx="6500" ry="5700" fill="url(#rim-distant-pines)"/>
    <ellipse cx="-9000" cy="15900" rx="4500" ry="4000" fill="url(#rim-distant-pines)"/>
    <ellipse cx="17000" cy="5200" rx="5300" ry="3600" fill="url(#rim-ice-ridge)"/>
    <path d="M-20400-8400q4200-1600 6500 1100t4400 1800m-9500 900q4200-1600 6500 1100t4400 1800"
      stroke="#d9e7e3" strokeOpacity=".18" strokeWidth="135" fill="none"/>
    <path d="M5200-14500q4500 2700 8500 1400t8200 4100"
      stroke="#d5eae5" strokeOpacity=".17" strokeWidth="230" fill="none"/>
    <path d="M-18400 7900q4000 1500 7100 500t7300 1700"
      stroke="#102a40" strokeOpacity=".19" strokeWidth="380" fill="none"/>
    <path d="M-18400 7740q4000 1500 7100 500t7300 1700"
      stroke="#b1ccd0" strokeOpacity=".19" strokeWidth="70" fill="none"/>
    {/* Open western battlefield, with a trench running through the upwind flank. */}
    <ellipse cx="-930" cy="-130" rx="3100" ry="2450" fill="url(#rim-snow)"/>
    <path d="M-1750-690Q-1330-430-990-765T-335-245Q-186-120-200 48T-330 520"
      fill="none" stroke="#092332" strokeWidth="32" strokeOpacity=".58"/>
    <path d="M-1750-679Q-1350-417-1010-750T-343-235Q-185-125-209 58T-340 532"
      fill="none" stroke="#8daeb3" strokeWidth="12" strokeOpacity=".35"/>
    <path d="m-225-100-27 19 20 18m-10 72-33 13 14 21m-12 84-22 12"
      fill="none" stroke="#d8e6e1" strokeWidth="3" strokeOpacity=".5"/>
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
    {/* The wooded fringe approaches the eastern edge of the opening camera.
         This is modeled terrain infill, not a relocated canonical timber forest. */}
    <ellipse cx="305" cy="75" rx="315" ry="255" fill="url(#rim-forest)" opacity=".48"/>
    <g opacity=".91">
      {[
        [105,-67],[118,-30],[120,25],[130,70],[154,-87],[169,-4],[183,44],
        [201,-38],[214,105],[237,-71],[258,18],[293,54],
      ].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y}) scale(${.8+i%3*.13})`}>
        <ellipse cx="8" cy="8" rx="17" ry="7" fill="#061c29" opacity=".5"/>
        <path d="M0-22-13-2l5-2-12 17 12-3-8 17h32L8 10l12 3L8-4l5 2Z" fill="#173d43" stroke="#91bcbc" strokeWidth="1.3"/>
        <path d="m0-22-6 11 6-2m-13 16 11-6m-11 21 13-6" fill="none" stroke="#e0efea" strokeWidth="2" opacity=".75"/>
      </g>)}
    </g>
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
