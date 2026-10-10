import type { ItemSymbol } from './demoData';

type Props = { symbol: ItemSymbol; size?: number; className?: string; label?: string };

const assetFiles: Record<ItemSymbol, string> = {
  wood: 'wood', stone: 'stone', ore: 'ore', bread: 'bread', cloak: 'cloak', staff: 'staff',
  axe: 'axe', chest: 'chest', scroll: 'scroll', potion: 'potion', sword: 'sword', ring: 'ring',
  'iron-pot': 'iron-pot', 'stone-hammer': 'stone-hammer', 'round-shield': 'round-shield',
  'convenience-bag': 'convenience-bag', herbs: 'herbs', water: 'water', salt: 'salt',
  'supply-coffer': 'supply-coffer', 'chest-moc': 'chest-moc', 'chest-bronze': 'chest-bronze',
  'chest-silver': 'chest-silver', 'chest-gold': 'chest-gold', 'chest-moon': 'chest-moon',
  'main-meal-box': 'main-meal-box', 'two-baozi': 'two-baozi', 'packaged-sandwich': 'packaged-sandwich',
  'cup-noodles': 'cup-noodles', 'cracker-packet': 'cracker-packet', 'roasted-seeds-packet': 'roasted-seeds-packet',
  'chocolate-bar': 'chocolate-bar', 'potato-chip-packet': 'potato-chip-packet', 'bottled-water': 'bottled-water',
  'tea-bottle': 'tea-bottle', 'coffee-can': 'coffee-can', 'napkin-chopsticks': 'napkin-chopsticks',
};

export default function ItemArt({ symbol, size = 58, className = '', label }: Props) {
  return <img
    width={size}
    height={size}
    className={className}
    src={`/assets/items/${assetFiles[symbol]}.svg`}
    alt={label ?? symbol}
    draggable={false}
  />;
}
