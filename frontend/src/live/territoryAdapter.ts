import type { PlayerView } from '../../../packages/contracts/src/index.ts';
import type { SettlementBuildingView, SettlementView } from '../game/GameClient';

// Only map actual API building identities to registered demo artwork.
// Missing artwork stays an untextured footprint; never depict a forge as a Lord House.
const ART_BY_KIND: Readonly<Record<string, string>> = {
  lord_house: 'lord-house-damaged',
  survival_fire: 'survival-fire-l01',
  tomb: 'tomb-entry',
  polar_farmer_house: 'polar-farmhouse-l01',
  polar_farmhouse: 'polar-farmhouse-l01',
  farmer_house: 'polar-farmhouse-l01',
  simple_heater: 'opening-simple-heater',
  heater: 'opening-simple-heater',
  simple_stove: 'opening-simple-kitchen',
  simple_kitchen: 'opening-simple-kitchen',
  stove: 'opening-simple-kitchen',
  sawmill: 'opening-woodshop',
  woodshop: 'opening-woodshop',
  tailor: 'opening-tailor',
  ore_processor: 'opening-oreworks',
  oreworks: 'opening-oreworks',
  forge: 'opening-forge',
  medical_room: 'opening-medical-station',
  medical_station: 'opening-medical-station',
  small_shelter: 'opening-small-shelter',
  shelter: 'opening-small-shelter',
  fence: 'opening-palisade-wall',
  palisade_wall: 'opening-palisade-wall',
  gate: 'opening-timber-gate',
  timber_gate: 'opening-timber-gate',
};

export function artForLiveBuildingKind(kind: string): string {
  const normalized = kind.trim().toLowerCase().replaceAll('-', '_');
  // Deliberately unresolved: missing art must not impersonate a different structure.
  return ART_BY_KIND[normalized] ?? `unregistered-building:${normalized}`;
}

/**
 * Adapts only player-visible API state to the shared isometric territory scene.
 * Missing footprints use a visual square estimate; it never feeds simulation.
 */
export function territorySceneFromApi(view: PlayerView): SettlementView {
  const origin = { x: view.territory.position.xMm / 1_000, y: view.territory.position.yMm / 1_000 };
  const visibleSitePositions = new Map(view.visibleMap.entities
    .filter(entity => entity.ref.type === 'site' && entity.position)
    .map(entity => [entity.ref.id, entity.position!] as const));
  const footprints = (area: number | null | undefined, fallback = 2) => {
    const side = area !== null && area !== undefined && Number.isFinite(area) && area > 0 ? Math.sqrt(area) : fallback;
    return {
      kind: 'rectangle' as const,
      widthM: side,
      depthM: side,
      provenance: 'frontend-fixture' as const,
      assumptionId: 'LIVE-API-VISUAL-FOOTPRINT-1.0',
      note: 'Rendering estimate only; authoritative area remains in the API view.',
    };
  };
  const buildings: SettlementBuildingView[] = [{
    id: view.territory.survivalFire.ref.id,
    settlementId: view.territory.id,
    ref: { type: 'site', id: view.territory.survivalFire.ref.id },
    definitionId: 'survival_fire',
    name: 'Lửa Sinh Tồn',
    x: 0,
    y: 0,
    orientation: 'north',
    footprint: footprints(4),
    assetId: 'survival-fire-l01',
    level: view.territory.survivalFire.level,
    visualState: view.territory.survivalFire.active ? 'repaired' : 'damaged',
    heightM: null,
    state: view.territory.survivalFire.active ? 'active' : 'inactive',
  }];

  for (const building of view.territory.buildings) {
    if (building.kind === 'survival_fire') continue;
    const coordinate = building.position ?? (building.siteId ? visibleSitePositions.get(building.siteId) : undefined);
    if (!coordinate) continue;
    const refId = building.siteId ?? building.id;
    const visualState = building.status === 'damaged' ? 'damaged' : 'repaired';
    buildings.push({
      id: building.id,
      settlementId: view.territory.id,
      ref: { type: 'site', id: refId },
      definitionId: building.kind,
      name: building.name,
      x: coordinate.xMm / 1_000 - origin.x,
      y: coordinate.yMm / 1_000 - origin.y,
      orientation: 'north',
      footprint: footprints(building.footprintAreaM2),
      assetId: artForLiveBuildingKind(building.kind),
      level: building.level,
      visualState,
      heightM: null,
      state: building.status,
    });
  }

  return {
    id: view.territory.id,
    worldOrigin: origin,
    fireRef: { type: 'site', id: view.territory.survivalFire.ref.id },
    fireLevel: view.territory.survivalFire.level,
    fireActive: view.territory.survivalFire.active,
    heatRadiusM: view.territory.survivalFire.heatRadiusMetres,
    buildings,
    obstacles: [],
    knowledge: 'live-api',
  };
}
