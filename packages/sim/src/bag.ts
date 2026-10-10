import { canonicalStateHash, hash64, randomIntFromFields } from './hash.ts';

type BagItem = {
  itemId: string;
  templateId: string;
  quantity: number;
  units: number;
  sourceRoll: number | null;
};

const mainChoices = [
  { low: 0, high: 34, templateId: 'CONVENIENCE-RICE-MEAL', units: 1 },
  { low: 35, high: 59, templateId: 'CONVENIENCE-STEAMED-BUNS', units: 1 },
  { low: 60, high: 84, templateId: 'CONVENIENCE-PACKAGED-SANDWICH', units: 1 },
  { low: 85, high: 99, templateId: 'CONVENIENCE-CUP-NOODLES', units: 1 },
] as const;

const snackChoices = [
  { low: 0, high: 29, templateId: 'CONVENIENCE-COOKIES', units: 0.5 },
  { low: 30, high: 54, templateId: 'CONVENIENCE-ROASTED-NUTS', units: 0.5 },
  { low: 55, high: 79, templateId: 'CONVENIENCE-CHOCOLATE-BAR', units: 0.5 },
  { low: 80, high: 99, templateId: 'CONVENIENCE-POTATO-CHIPS', units: 0.5 },
] as const;

const drinkChoices = [
  { low: 0, high: 49, templateId: 'CONVENIENCE-WATER-500ML', units: 0.5 },
  { low: 50, high: 79, templateId: 'CONVENIENCE-UNSWEETENED-TEA-500ML', units: 0.5 },
  { low: 80, high: 99, templateId: 'CONVENIENCE-COFFEE-330ML', units: 0.33 },
] as const;

function choose<T extends { low: number; high: number }>(roll: number, choices: readonly T[]): T {
  const choice = choices.find(candidate => roll >= candidate.low && roll <= candidate.high);
  if (!choice) throw new Error(`BAG_ROLL_OUT_OF_RANGE: ${roll}`);
  return choice;
}

function makeItemId(campaignId: string, soulId: string, suffix: string): string {
  return `ITEM-BAG-${hash64([campaignId, soulId, suffix]).toString(16).padStart(16, '0').toUpperCase()}`;
}

export function seedConvenienceBag(campaignId: string, soulId: string): {
  commitmentSha256: string;
  totalHashDraws: number;
  rolls: { main: number; snack: number; drink: number };
  items: readonly BagItem[];
} {
  const main = randomIntFromFields([campaignId, soulId, 'BAG-MAIN'], 0, 99);
  const snack = randomIntFromFields([campaignId, soulId, 'BAG-SNACK'], 0, 99);
  const drink = randomIntFromFields([campaignId, soulId, 'BAG-DRINK'], 0, 99);
  const mainChoice = choose(main.value, mainChoices);
  const snackChoice = choose(snack.value, snackChoices);
  const drinkChoice = choose(drink.value, drinkChoices);
  const items: BagItem[] = [
    { itemId: makeItemId(campaignId, soulId, 'MAIN'), templateId: mainChoice.templateId, quantity: 1, units: mainChoice.units, sourceRoll: main.value },
    { itemId: makeItemId(campaignId, soulId, 'SNACK'), templateId: snackChoice.templateId, quantity: 1, units: snackChoice.units, sourceRoll: snack.value },
    { itemId: makeItemId(campaignId, soulId, 'DRINK'), templateId: drinkChoice.templateId, quantity: 1, units: drinkChoice.units, sourceRoll: drink.value },
    { itemId: makeItemId(campaignId, soulId, 'UTENSILS'), templateId: 'DISPOSABLE-PAPER-NAPKIN-AND-CHOPSTICKS', quantity: 1, units: 0, sourceRoll: null },
  ];
  const rolls = { main: main.value, snack: snack.value, drink: drink.value };
  return {
    commitmentSha256: canonicalStateHash({ campaignId, soulId, rolls, items }),
    totalHashDraws: main.draws + snack.draws + drink.draws,
    rolls,
    items,
  };
}
