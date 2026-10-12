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
  /** Present only on the strategic projection's aggregate settlement marker. */
  settlementId?: string;
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
export type DemoForce = { icon: 'shield' | 'sparkles' | 'users'; title: string; text: string; art?: string };
export type UnitGroupView = {
  id: string;
  name: string;
  raceId: string;
  raceLabel: string;
  alive: number;
  available: number;
  role: string;
};
export type FootprintView = {
  kind: 'rectangle';
  widthM: number;
  depthM: number;
  provenance: 'frontend-fixture';
  assumptionId: string;
  note: string;
};
export type SettlementBuildingView = {
  id: string;
  settlementId: string;
  ref: EntityRef;
  definitionId: string;
  name: string;
  /** Local offsets from SettlementView.worldOrigin, in source metres. */
  x: number;
  y: number;
  orientation: 'north' | 'east' | 'south' | 'west';
  footprint: FootprintView;
  assetId: string;
  /** Optional authoritative level for selecting visual-only building art. */
  level?: number;
  /** Authoritative exterior appearance state; does not change building identity or footprint. */
  visualState?: 'damaged' | 'repaired';
  heightM: number | null;
  state: string;
};
export type SettlementView = {
  id: string;
  worldOrigin: { x: number; y: number };
  fireRef: EntityRef;
  fireLevel: number;
  fireActive: boolean;
  heatRadiusM: number;
  buildings: readonly SettlementBuildingView[];
  obstacles: readonly { id: string; x: number; y: number; radiusM: number }[];
  knowledge: 'demo-fixture' | 'live-api';
};
export type SettlementPlacementDefinition = {
  id: string;
  name: string;
  assetId: string;
  footprint: FootprintView;
  orientations: readonly ('north' | 'east' | 'south' | 'west')[];
  status: 'fixture-only';
};
export type LayoutDraft = {
  id: string;
  definitionId: string;
  assetId: string;
  x: number;
  y: number;
  orientation: 'north' | 'east' | 'south' | 'west';
  footprint: FootprintView;
};
export type TerritoryObjective = { id: SiteKind; title: string; detail: string };
export type PlayerView = {
  revision: number;
  demoMode: true;
  player: {
    name: string;
    age: number;
    level: number;
    xp: number;
    title: string;
    grade: 'SSS';
    mana: { current: number; max: number };
    /** Fixture anchor for camera focus; coordinates are world metres. */
    position: { x: number; y: number };
    settlementId: string;
  };
  screens: readonly { id: Screen; name: string; hint: string }[];
  sites: readonly Site[];
  buildings: readonly Site[];
  items: readonly DemoItem[];
  journal: readonly { time: string; category: string; title: string; text: string }[];
  forces: readonly DemoForce[];
  /** Living groups only. Empty in the clean opening demo. */
  units: readonly UnitGroupView[];
  settlement: SettlementView;
  placementDefinitions: readonly SettlementPlacementDefinition[];
  territoryObjectives: readonly TerritoryObjective[];
  visibleMap: VisibleMap;
};

export type CommandRequest =
  | { type: 'harvest'; entity: EntityRef; material: string; amount: number; unitGroupId: string; unitCount: number }
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
