import type { DemoItem, Screen, Site, SiteKind } from '../demoData';

export type EntityRef =
  | { type: 'site'; id: string }
  | { type: 'resource'; id: string }
  | { type: 'cache'; id: string }
  | { type: 'item'; id: string }
  | { type: 'unit'; id: string };

export type KnowledgeState = 'current' | 'remembered' | 'unknown';
export type DemoProvenance = 'canonical' | 'modeled' | 'sample';
export type VisibilityDisc = { x: number; y: number; clear: number; fade: number };
export type ResourceBalance = {
  material: string;
  unit: string;
  remaining: number | null;
  capacity: number | null;
  reserved: number | null;
  reachable: boolean | null;
};
export type ActionAvailability = { action: string; enabled: boolean; reason: string };
export type EntityView = {
  ref: EntityRef;
  name: string;
  iconKind: string;
  label: string;
  description: string;
  status: string;
  provenance: DemoProvenance;
  knowledge: KnowledgeState;
  currentSight: boolean;
  lastSeenAt?: string;
  x?: number;
  y?: number;
  resourceBalance?: ResourceBalance;
  actions: readonly ActionAvailability[];
};
export type VisibleMap = {
  revision: number;
  discoveryIds: readonly string[];
  entities: readonly EntityView[];
  developerEntities?: readonly EntityView[];
  sight: readonly VisibilityDisc[];
  explored: readonly VisibilityDisc[];
  terrain: { forest: { x: number; y: number }; stone: { x: number; y: number }; water: { x: number; y: number } };
};
export type PreviewMapSettings = { clockMinutes: number; fireLevel: number; fireActive: boolean; sourceAtlas: boolean };
export type DemoForce = { icon: 'shield' | 'sparkles' | 'users'; title: string; text: string };
export type TerritoryObjective = { id: SiteKind; title: string; detail: string };
export type PlayerView = {
  revision: number;
  demoMode: true;
  screens: readonly { id: Screen; name: string; hint: string }[];
  sites: readonly Site[];
  buildings: readonly Site[];
  items: readonly DemoItem[];
  journal: readonly { time: string; category: string; title: string; text: string }[];
  forces: readonly DemoForce[];
  territoryObjectives: readonly TerritoryObjective[];
  visibleMap: VisibleMap;
};

export type CommandRequest =
  | { type: 'harvest'; entity: EntityRef; material: string; amount: number }
  | { type: 'open-cache'; entity: EntityRef }
  | { type: 'repair'; entity: EntityRef }
  | { type: 'move'; destination: { x: number; y: number } }
  | { type: 'advance-time'; seconds: number };
export type CommandReceipt = { accepted: boolean; revision: number; code: string; message: string };

export interface GameClient {
  getPlayerView(): PlayerView;
  getVisibleMap(settings: PreviewMapSettings): VisibleMap;
  inspectEntity(ref: EntityRef): EntityView | null;
  submitCommand(command: CommandRequest): Promise<CommandReceipt>;
  subscribe(listener: (view: PlayerView) => void): () => void;
}

export const sameEntityRef = (a: EntityRef | null | undefined, b: EntityRef | null | undefined) =>
  Boolean(a && b && a.type === b.type && a.id === b.id);
