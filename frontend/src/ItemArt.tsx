
import type { ItemSymbol } from './demoData';

type Props = { symbol: ItemSymbol; size?: number; className?: string };

export default function ItemArt({ symbol, size = 58, className = '' }: Props) {
  const art = (() => {
    switch (symbol) {
      case 'wood': return <g transform="rotate(-24 50 50)">
        <rect x="26" y="18" width="21" height="66" rx="7" fill="#86644c" stroke="#c9a780" strokeWidth="2"/>
        <rect x="50" y="9" width="21" height="72" rx="7" fill="#73503d" stroke="#c19a6e" strokeWidth="2"/>
        <path d="M36 24v52M57 15v58" stroke="#b98b64" strokeWidth="2" opacity=".8"/>
        <ellipse cx="36" cy="18" rx="10" ry="5" fill="#d2b18b" stroke="#6f4e3a" strokeWidth="2"/>
        <ellipse cx="60" cy="9" rx="10" ry="5" fill="#d2b18b" stroke="#6f4e3a" strokeWidth="2"/>
        <path d="M31 18q5-5 10 0M55 9q5-4 9 0" fill="none" stroke="#997452"/>
      </g>;
      case 'stone': return <g>
        <path d="m13 68 11-32 29-9 25 12 11 30-18 17-41 3Z" fill="#8b9fa4" stroke="#d5e0d9" strokeWidth="2"/>
        <path d="m24 36 21 20-15 33M45 56 78 39M45 56l26 30" fill="none" stroke="#576f7a" strokeWidth="3"/>
        <path d="m24 36 29-9 25 12-33 17Z" fill="#c5d1cd" opacity=".45"/>
      </g>;
      case 'ore': return <g>
        <path d="m12 71 18-31 23-19 28 24 11 29-36 17Z" fill="#515968" stroke="#a4b9be" strokeWidth="2"/>
        <path d="m30 40 16 18 7-37 12 34 16-10-13 26-12 20-10-33-34 13Z" fill="#a8c8c9" opacity=".75"/>
        <path d="m46 58 22 13M46 58 30 40" stroke="#dce9e2" strokeWidth="2"/>
        <circle cx="55" cy="47" r="4" fill="#e2bd86"/>
      </g>;
      case 'bread': return <g>
        <path d="M15 64Q9 43 29 29q14-15 37-6t20 34l-14 24H26Z" fill="#bb8150" stroke="#e6bb7a" strokeWidth="3"/>
        <path d="M22 52q1-15 21-23t29 6" fill="none" stroke="#f4d4a1" strokeWidth="4" strokeLinecap="round"/>
        <path d="m36 38 8 12m5-20 8 12m8-13 6 10" stroke="#926241" strokeWidth="3" strokeLinecap="round"/>
      </g>;
      case 'cloak': return <g>
        <path d="M37 16q13-11 27 0l20 62-17 12-16-17-14 17-20-12Z" fill="#567683" stroke="#bad5d1" strokeWidth="2"/>
        <path d="M37 16q-8 22-4 37l18 20 17-22q4-18-4-35" fill="#1c3a4c" stroke="#a7bfbe" strokeWidth="2"/>
        <path d="M37 16q13 11 27 0L54 32H48Z" fill="#c2d8d2" opacity=".9"/>
        <path d="m48 32 3 6 4-6" fill="none" stroke="#c6ae7e" strokeWidth="3"/>
        <path d="m24 74 10-14m47 14L67 60" stroke="#c5e1da" opacity=".5" strokeWidth="3"/>
      </g>;
      case 'staff': return <g transform="rotate(27 50 50)">
        <path d="M49 20v70" stroke="#75513f" strokeWidth="9" strokeLinecap="round"/>
        <path d="M49 18 36 31l-5-16 19-11 18 12-8 18Z" fill="#81bec2" stroke="#d1e7e1" strokeWidth="3"/>
        <path d="M49 18V7M49 18l13-2M49 18 36 31" stroke="#edf6ee" opacity=".7" strokeWidth="2"/>
        <path d="M47 46h9M47 60h9" stroke="#c7a777" strokeWidth="4"/>
      </g>;
      case 'axe': return <g transform="rotate(-25 50 50)">
        <path d="M47 22v65" stroke="#7d533e" strokeWidth="10" strokeLinecap="round"/>
        <path d="M46 16q28-9 40 15Q70 36 52 56l-14-9 10-16Z" fill="#a6b7bd" stroke="#e0e9e6" strokeWidth="3"/>
        <path d="M47 22q18 2 28 11L52 49" fill="none" stroke="#4e6675" strokeWidth="3"/>
        <path d="M44 63h11" stroke="#c8a67f" strokeWidth="3"/>
      </g>;
      case 'chest': return <g>
        <path d="M15 40q0-20 35-20t35 20v43H15Z" fill="#805b44" stroke="#c9a37c" strokeWidth="3"/>
        <path d="M15 44h70v18H15Z" fill="#a77c55" stroke="#dfbd81" strokeWidth="2"/>
        <path d="M18 37q10-19 32-19t32 19Z" fill="#705240" stroke="#c7a27a" strokeWidth="2"/>
        <path d="M25 40v42M75 40v42" stroke="#d1b37d" strokeWidth="8"/>
        <path d="M43 50h14v18H43Z" fill="#d4ad69" stroke="#f5d8a3" strokeWidth="2"/>
        <circle cx="50" cy="58" r="3" fill="#364750"/>
      </g>;
      case 'scroll': return <g transform="rotate(-13 50 50)">
        <path d="M25 15h50v67H25Z" fill="#dec9a4" stroke="#fbebc8" strokeWidth="3"/>
        <ellipse cx="25" cy="16" rx="9" ry="8" fill="#c8ad83" stroke="#f5e4bf" strokeWidth="2"/>
        <ellipse cx="75" cy="82" rx="9" ry="8" fill="#c8ad83" stroke="#f5e4bf" strokeWidth="2"/>
        <path d="M36 31h29M36 40h19M36 52h28M36 62h22" stroke="#8a765f" strokeWidth="3" opacity=".74"/>
        <circle cx="61" cy="69" r="8" fill="#9b5449" stroke="#d99680" strokeWidth="2"/>
      </g>;
      case 'potion': return <g>
        <path d="M43 16h14v25l17 26q1 18-24 19T26 68l17-27Z" fill="#4c92a0" stroke="#c7ecea" strokeWidth="3"/>
        <path d="M33 62h34l5 7q0 16-22 16T28 69Z" fill="#8b58b5" opacity=".9"/>
        <path d="M41 13h18v11H41Z" fill="#a78b66" stroke="#e9cf9a" strokeWidth="2"/>
        <path d="m41 42-7 18" stroke="#e9faf6" strokeWidth="4" strokeLinecap="round" opacity=".75"/>
        <circle cx="47" cy="69" r="3" fill="#e1c8fe"/><circle cx="60" cy="75" r="2.5" fill="#e1c8fe"/>
      </g>;
      case 'sword': return <g transform="rotate(42 50 50)">
        <path d="M45 9h10l5 48-10 13-10-13Z" fill="#a9c3c9" stroke="#e8f1e9" strokeWidth="2"/>
        <path d="M50 14v48" stroke="#edf5f1" strokeWidth="3"/>
        <path d="M28 64h44" stroke="#d3ac70" strokeWidth="8" strokeLinecap="round"/>
        <path d="M50 68v19" stroke="#826047" strokeWidth="9" strokeLinecap="round"/>
        <circle cx="50" cy="90" r="6" fill="#dcba80" stroke="#f4dbab" strokeWidth="2"/>
      </g>;
      case 'ring': return <g>
        <ellipse cx="50" cy="64" rx="27" ry="22" fill="none" stroke="#c8a56b" strokeWidth="11"/>
        <ellipse cx="50" cy="64" rx="27" ry="22" fill="none" stroke="#eed4a1" strokeWidth="3"/>
        <path d="m50 13 17 17-17 20-17-20Z" fill="#4a9d9b" stroke="#d8f3e5" strokeWidth="3"/>
        <path d="m50 13 6 18-6 19-7-19Z" fill="#9be0c7" opacity=".6"/>
      </g>;
    }
  })();
  return <svg width={size} height={size} className={className} viewBox="0 0 100 100" role="img" aria-label={symbol}>
    <defs>
      <radialGradient id="item-glow"><stop stopColor="#779eac" stopOpacity=".36"/><stop offset="1" stopColor="#456477" stopOpacity="0"/></radialGradient>
    </defs>
    <circle cx="50" cy="52" r="44" fill="url(#item-glow)"/>
    {art}
  </svg>;
}
