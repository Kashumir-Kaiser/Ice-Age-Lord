import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type {
  ChestCacheCenter,
  EcologyRecord,
  EventContractDefinition,
  FixedWorldActor,
  FieldChest,
  FixedEventScheduleRow,
  FixedWorldUnit,
  HeroLair,
  LairCohort,
  WorldAnchor,
  WorldDefinition,
  WorldResourceFeature,
  WorldResource,
  WorldSite,
} from '../../contracts/src/index.ts';
import { CONTENT_VERSION, RULESET_VERSION, SOURCE_LOCK, SOURCE_RELEASES, SOURCE_MAIN_COMMIT } from './sourceLock.ts';
import { buildNavigationOverlay } from './navigationOverlay.ts';
import { RESOURCE_ECONOMY_VERSION, RESOURCE_FEATURES, resourceFromFeature, worldFeatureFromSpec } from './resourceBalance.ts';
import { assertChestLootTables } from './chestLoot.ts';
import { assertEventMechanics } from './eventRules.ts';
import { parseEventSourceLedger } from './eventLedger.ts';
import { assertEventContractCoverage, EVENT_CONTRACTS, EVENT_CONTRACT_REGISTRY_VERSION } from './eventContracts.ts';

export type ContentManifest = {
  schemaVersion: 2;
  contentVersion: string;
  rulesetVersion: string;
  sourceMainCommit: string;
  activeWorldPackageId: string;
  timelineVersion: string;
  eventContractRegistryVersion: string;
  eventContractCount: number;
  approvedGameplayModules: readonly string[];
  conversionManifest: readonly { input: string; output: string; decision: string }[];
  sources: readonly {
    path: string;
    releaseId: string;
    sha256: string;
    authorityClass: string;
    runtimeUse: string;
  }[];
  hashes: { worldPackageSha256: string; manifestSha256: string };
};

const EXPECTED_WORLD_HASHES = {
  manifestBody: '58ca95074c2b365937ae6c885c621cf86514a92cbbb69941be289848911e0d86',
  sites: '3de8a5e3d8e30cdf3ff9f27a5db2d04d7a6c8f7ebc301c5d566f573284172c8b',
  chests: 'c90c028d1839001ddb4447a5fbc6b29e1ffcbf3fc1c63af4fd850b0743b07b40',
  anchors: 'a3a29ea57be8d0a9492b7fb3940574aefc3283dcdc791ece57a54cc5f7ae5130',
  lairs: '1a1c1b26cdb04ce2cebc69bdee5a46af34db4eb52cfa311497a12f172b73502f',
} as const;

const MICRO_OFFSETS_MM = [
  { x: 0, y: 0 },
  { x: 6_000, y: 2_000 },
  { x: -4_000, y: 5_000 },
] as const;

const ANCHOR_OFFSETS_KM = [
  [0.40, 0.30], [-0.70, 0.20], [1.10, -0.60], [-1.30, -0.80], [2.00, 0.40],
  [-2.20, 0.60], [0.50, 2.40], [-0.60, -2.50], [1.80, 1.70], [-1.90, 1.60],
  [2.50, -1.10], [-2.40, -1.40], [0.15, -1.85], [1.45, 2.10], [-1.55, 2.20],
] as const;

const GRADE_NAMES = ['Mộc', 'Thanh Đồng', 'Bạch Ngân', 'Hoàng Kim', 'Hạo Nguyệt'] as const;
const COHORT_GRADES = ['Thường', 'Cựu binh', 'Tinh anh', 'Đầu lĩnh', 'Lãnh chúa'] as const;
const ACTOR_GRADES = [...COHORT_GRADES, 'Thần thoại'] as const;

export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

export function assertSourceHashes(contents: Readonly<Record<string, string>>): void {
  for (const [path, expected] of Object.entries(SOURCE_LOCK)) {
    const source = contents[path];
    if (source === undefined) throw new Error(`CONTENT_SOURCE_MISSING: ${path}`);
    const actual = sha256(source);
    if (actual !== expected) {
      throw new Error(`CONTENT_SOURCE_HASH_MISMATCH: ${path}; expected ${expected}; actual ${actual}`);
    }
  }
}

function readSources(root: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const path of Object.keys(SOURCE_LOCK)) result[path] = readFileSync(`${root}/${path}`, 'utf8');
  return result;
}

function cleanCell(value: string): string {
  return value.trim().replace(/`/g, '').replace(/\*\*/g, '').trim();
}

function rowsBetweenMarkers(source: string, name: string): string[][] {
  const start = `<!-- ${name}-BEGIN -->\n`;
  const end = `<!-- ${name}-END -->`;
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  if (from < 0 || to < 0) throw new Error(`CONTENT_MARKER_MISSING: ${name}`);
  return source.slice(from + start.length, to).split('\n')
    .filter(line => line.startsWith('|'))
    .map(line => line.slice(1, line.endsWith('|') ? -1 : undefined).split('|').map(cleanCell))
    .filter(cells => cells.length > 1 && !/^:?-{2,}:?$/.test(cells[0]));
}

function rowsBetweenHeadings(source: string, startPrefix: string, endPrefix: string): string[][] {
  const from = source.indexOf(startPrefix);
  const to = source.indexOf(endPrefix, from + startPrefix.length);
  if (from < 0 || to < 0) throw new Error(`CONTENT_HEADING_RANGE_MISSING: ${startPrefix} -> ${endPrefix}`);
  return source.slice(from + startPrefix.length, to).split('\n')
    .filter(line => line.startsWith('|'))
    .map(line => line.slice(1, line.endsWith('|') ? -1 : undefined).split('|').map(cleanCell))
    .filter(cells => cells.length > 1 && !/^:?-{2,}:?$/.test(cells[0]));
}

function parseSourceDecimal(value: string): number {
  const normalized = value.trim().replace(/\s/g, '').replace(/m$/i, '').replace(/,/g, '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`CONTENT_NUMBER_INVALID: ${value}`);
  return parsed;
}

function kmToMm(value: string | number): number {
  const parsed = typeof value === 'string' ? parseSourceDecimal(value) : value;
  const result = Math.round(parsed * 1_000_000);
  if (!Number.isSafeInteger(result)) throw new Error(`CONTENT_COORDINATE_OUT_OF_RANGE: ${value}`);
  return result;
}

function parseCoordinate3d(text: string): { xMm: number; yMm: number; sourceZMetres: number } {
  const match = text.match(/\(([^)]+)\)/);
  if (!match) throw new Error(`CONTENT_COORDINATE_INVALID: ${text}`);
  const components = match[1].split(';');
  if (components.length !== 3) throw new Error(`CONTENT_COORDINATE_INVALID: ${text}`);
  return {
    xMm: kmToMm(components[0]),
    yMm: kmToMm(components[1]),
    sourceZMetres: parseSourceDecimal(components[2]),
  };
}

function parseCoordinate2d(text: string): { xMm: number; yMm: number } {
  const match = text.match(/\(([^)]+)\)/);
  if (!match) throw new Error(`CONTENT_COORDINATE_INVALID: ${text}`);
  const components = match[1].split(';');
  if (components.length !== 2) throw new Error(`CONTENT_COORDINATE_INVALID: ${text}`);
  return { xMm: kmToMm(components[0]), yMm: kmToMm(components[1]) };
}

function tableRowsHash(source: string, marker: string): string {
  const start = `<!-- ${marker}-BEGIN -->\n`;
  const end = `<!-- ${marker}-END -->`;
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  if (from < 0 || to < 0) throw new Error(`CONTENT_MARKER_MISSING: ${marker}`);
  return sha256(source.slice(from + start.length, to));
}

function verifyWorldTableHashes(file03: string): void {
  const manifestStart = '<!-- LL01-MANIFEST-BEGIN -->\n';
  const manifestEnd = '<!-- LL01-MANIFEST-END -->';
  const manifestFrom = file03.indexOf(manifestStart);
  const manifestTo = file03.indexOf(manifestEnd, manifestFrom + manifestStart.length);
  if (manifestFrom < 0 || manifestTo < 0) throw new Error('CONTENT_MARKER_MISSING: LL01-MANIFEST');
  const rawManifestLines = file03.slice(manifestFrom + manifestStart.length, manifestTo).split('\n');
  const bodyHash = sha256(`${rawManifestLines.filter(line => line.startsWith('|') && !/(manifest_body_sha256|site_registry_sha256|chest_registry_sha256|player_anchor_sha256)/.test(line)).join('\n')}\n`);
  const block = rowsBetweenMarkers(file03, 'LL01-MANIFEST');
  const declared = new Map(block.filter(row => row.length >= 2).map(row => [row[0], row[1]]));
  const actuals: Record<string, string> = {
    manifest_body_sha256: bodyHash,
    site_registry_sha256: tableRowsHash(file03, 'LL01-SITES'),
    chest_registry_sha256: tableRowsHash(file03, 'LL01-CHESTS'),
    player_anchor_sha256: tableRowsHash(file03, 'LL01-ANCHORS'),
  };
  for (const [key, actual] of Object.entries(actuals)) {
    const expected = declared.get(key);
    if (expected !== actual) throw new Error(`WORLD_PACKAGE_HASH_MISMATCH: ${key}; expected ${expected ?? 'missing'}; actual ${actual}`);
  }
  const lairHash = tableRowsHash(file03, 'LL01-HERO-LAIRS');
  if (lairHash !== EXPECTED_WORLD_HASHES.lairs) {
    throw new Error(`HERO_LAIR_PACK_CORRUPT: expected ${EXPECTED_WORLD_HASHES.lairs}; actual ${lairHash}`);
  }
}

function parseSites(file03: string): WorldSite[] {
  return rowsBetweenMarkers(file03, 'LL01-SITES').filter(row => /^SITE-LL01-\d{3}$/.test(row[0])).map(row => ({
    id: row[0],
    name: row[1],
    position: parseCoordinate3d(row[2]),
    form: row[3],
    accessStatement: row[4],
    fixedContent: row[5],
    source: { path: 'references/canonical/LORD-DND-03.md', heading: '3.K.4 Site registry', recordId: row[0] },
  }));
}

function expandGrades(text: string): string[] {
  const tokens = [...text.matchAll(/(Thanh\s+Đồng|Mộc|Bạch\s+Ngân|Hoàng\s+Kim|Hạo\s+Nguyệt)(?:×(\d+))?/g)];
  const grades: string[] = [];
  for (const [, grade, countText] of tokens) {
    const count = countText ? Number(countText) : 1;
    for (let i = 0; i < count; i++) grades.push(grade.replace(/\s+/g, ' '));
  }
  if (grades.length === 0) throw new Error(`CHEST_GRADES_MISSING: ${text}`);
  return grades;
}

function parseChestIds(text: string): string[] {
  const match = text.match(/CH-LL01-(\d{3})(?:\.\.(\d{3}))?/);
  if (!match) throw new Error(`CHEST_ID_RANGE_INVALID: ${text}`);
  const first = Number(match[1]);
  const last = match[2] ? Number(match[2]) : first;
  if (last < first) throw new Error(`CHEST_ID_RANGE_REVERSED: ${text}`);
  return Array.from({ length: last - first + 1 }, (_, index) => `CH-LL01-${String(first + index).padStart(3, '0')}`);
}

function parseFieldChests(file03: string): FieldChest[] {
  const chests: FieldChest[] = [];
  for (const row of rowsBetweenMarkers(file03, 'LL01-CHESTS').filter(cells => /^CACHE-LL01-\d{2}$/.test(cells[0]))) {
    const ids = parseChestIds(row[3]);
    const grades = expandGrades(row[4]);
    if (ids.length !== grades.length) throw new Error(`CHEST_GRADE_COUNT_MISMATCH: ${row[0]}; ${ids.length} IDs, ${grades.length} grades`);
    const center = parseCoordinate2d(row[2]);
    const cacheNumber = Number(row[0].slice(-2));
    for (let ordinal = 0; ordinal < ids.length; ordinal++) {
      const offset = cacheNumber <= 32
        ? MICRO_OFFSETS_MM[ordinal]
        : (() => {
          const km = ANCHOR_OFFSETS_KM[ordinal];
          return km ? { x: kmToMm(km[0]), y: kmToMm(km[1]) } : undefined;
        })();
      if (!offset) throw new Error(`CHEST_OFFSET_MISSING: ${row[0]} ordinal ${ordinal + 1}`);
      const grade = grades[ordinal];
      if (!GRADE_NAMES.includes(grade as typeof GRADE_NAMES[number])) throw new Error(`CHEST_GRADE_INVALID: ${grade}`);
      const id = ids[ordinal];
      chests.push({
        id,
        cacheId: row[0],
        chestType: 'field',
        eventId: null,
        grade: grade as FieldChest['grade'],
        position: { xMm: center.xMm + offset.x, yMm: center.yMm + offset.y },
        ring: row[1],
        accessStatement: row[5],
        lootCommitment: sha256(`WORLD-PACKAGE-LL01-1.0|${id}|CHEST-LOOT-2.1`),
        source: { path: 'references/canonical/LORD-DND-03.md', heading: '3.K.5 Field chest registry', recordId: row[0] },
      });
    }
  }
  return chests;
}

function parseChestCacheCenters(file03: string): ChestCacheCenter[] {
  return rowsBetweenMarkers(file03, 'LL01-CHESTS').filter(row => /^CACHE-LL01-\d{2}$/.test(row[0])).map(row => ({
    id: row[0],
    ring: row[1],
    position: parseCoordinate2d(row[2]),
    chestIds: parseChestIds(row[3]),
    accessStatement: row[5],
    source: { path: 'references/canonical/LORD-DND-03.md', heading: '3.K.5 Cache centers', recordId: row[0] },
  }));
}

function parseAnchors(file03: string): WorldAnchor[] {
  return rowsBetweenMarkers(file03, 'LL01-ANCHORS').filter(row => /^RC-\d{3}$/.test(row[0])).map(row => ({
    id: row[0],
    name: row[1],
    position: parseCoordinate2d(row[2]),
    terrainContext: row[3],
    source: { path: 'references/canonical/LORD-DND-03.md', heading: '3.K.6 Player anchors', recordId: row[0] },
  }));
}

function headingSection(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  if (from < 0 || to < 0) throw new Error(`CONTENT_HEADING_RANGE_MISSING: ${start} -> ${end}`);
  return source.slice(from + start.length, to);
}

function parseLairRows(file03: string): Map<string, Omit<HeroLair, 'memberCount' | 'sourcePopulationRef' | 'sourcePopulationCount' | 'inLairCount' | 'outsidePopulationStatement' | 'cohorts' | 'initialMetrics' | 'successionRule'>> {
  const section = headingSection(file03, '### 3.L.3.', '### 3.L.4.');
  const rows = section.split('\n').filter(line => line.startsWith('|')).map(line => line.slice(1, line.endsWith('|') ? -1 : undefined).split('|').map(cleanCell));
  const lairs = new Map();
  for (const row of rows.filter(cells => /^LAIR-LL01-\d{2}$/.test(cells[0]))) {
    const location = parseCoordinate3d(row[2]);
    const distance = row[2].match(/·\s*([\d,]+)\s*km/);
    const species = row[4].split('/').map(part => part.replace(/`/g, '').trim());
    const hero = row[5].match(/(HERO-LAIR-LL01-\d{2})\s*·\s*(.+)$/);
    const society = row[6].match(/^(.+?)\s*·\s*(\d+)$/);
    if (!distance || !hero || !society || species.length !== 2) throw new Error(`HERO_LAIR_ROW_INVALID: ${row[0]}`);
    const lair = {
      id: row[0],
      name: row[1],
      position: location,
      distanceKm: parseSourceDecimal(distance[1]),
      ring: row[3],
      species: species[0],
      societyCeiling: species[1],
      leaderHeroId: hero[1],
      leaderName: hero[2],
      societyForm: society[1],
      societyStage: Number(society[2]),
      source: { path: 'references/canonical/LORD-DND-03.md', heading: '3.L.3 Hero lair registry', recordId: row[0] },
    };
    lairs.set(row[0], lair);
  }
  return lairs;
}

function parseCohorts(text: string, lairId: string): LairCohort[] {
  const rows = text.split(';').map(token => token.trim()).filter(Boolean);
  return rows.map((description, index) => {
    const countMatch = description.match(/×\s*(\d+)\s*$/);
    const grade = COHORT_GRADES.find(candidate => description.includes(candidate));
    if (!countMatch || !grade) throw new Error(`HERO_LAIR_COHORT_INVALID: ${lairId}; ${description}`);
    const letter = String.fromCharCode(66 + Math.max(0, index - 1));
    return {
      groupId: index === 0 ? `${lairId}:LEADER` : `GRP-${lairId}-${letter}`,
      description: description.slice(0, countMatch.index).trim(),
      grade,
      count: Number(countMatch[1]),
    };
  });
}

function parseLairConservation(file03: string): { lairs: HeroLair[]; units: FixedWorldUnit[] } {
  const rows = rowsBetweenHeadings(file03, '### 3.L.4.', '### 3.L.5.').filter(row => /^\d{2}$/.test(row[0]));
  const locationRows = parseLairRows(file03);
  const lairs: HeroLair[] = [];
  const units: FixedWorldUnit[] = [];
  const populationDebits = new Map<string, { debited: number; sourceCount: number }>();
  for (const row of rows) {
    const fullId = `LAIR-LL01-${row[0]}`;
    const base = locationRows.get(fullId);
    if (!base) throw new Error(`HERO_LAIR_LOCATION_MISSING: ${fullId}`);
    const sourcePopulationMatch = row[1].match(/((?:ECO-LL01-R[0-4]|ECO-LL01-M[1-5]|POP-LL01-M[1-5]):[^=]+)=(\d+)/);
    if (!sourcePopulationMatch) throw new Error(`HERO_LAIR_POPULATION_REF_INVALID: ${fullId}`);
    const cohorts = parseCohorts(row[2], fullId);
    const inLairMatch = row[3].match(/\d+/);
    if (!inLairMatch) throw new Error(`HERO_LAIR_MEMBER_COUNT_INVALID: ${fullId}`);
    const memberCount = Number(inLairMatch[0]);
    const cohortTotal = cohorts.reduce((total, cohort) => total + cohort.count, 0);
    if (memberCount !== cohortTotal) throw new Error(`HERO_LAIR_COHORT_TOTAL_MISMATCH: ${fullId}; expected ${memberCount}; got ${cohortTotal}`);
    if (cohorts[0].count !== 1 || !cohorts[0].description.startsWith('Hero ')) {
      throw new Error(`HERO_LAIR_LEADER_COHORT_INVALID: ${fullId}`);
    }
    const existing = populationDebits.get(sourcePopulationMatch[1]) ?? { debited: 0, sourceCount: Number(sourcePopulationMatch[2]) };
    populationDebits.set(sourcePopulationMatch[1], { debited: existing.debited + memberCount, sourceCount: existing.sourceCount });
    const lair: HeroLair = {
      ...base,
      memberCount,
      sourcePopulationRef: sourcePopulationMatch[1],
      sourcePopulationCount: Number(sourcePopulationMatch[2]),
      inLairCount: memberCount,
      outsidePopulationStatement: row[4],
      cohorts,
      initialMetrics: '',
      successionRule: '',
    };
    lairs.push(lair);
    let ordinal = 1;
    for (let cohortIndex = 0; cohortIndex < cohorts.length; cohortIndex++) {
      const cohort = cohorts[cohortIndex];
      for (let i = 0; i < cohort.count; i++, ordinal++) {
        const isLeader = cohortIndex === 0 && i === 0;
        const id = `UNIT-LAIR-LL01-${row[0]}-${String(ordinal).padStart(3, '0')}`;
        units.push({
          id,
          lairId: fullId,
          ...(isLeader ? { heroId: base.leaderHeroId } : {}),
          ...(cohortIndex > 0 ? { groupId: cohort.groupId } : {}),
          cohortDescription: cohort.description,
          grade: cohort.grade,
          creationRoute: 'PRESEEDED_WORLD_LAIR',
          ownership: 'fixed_world_population',
          playerKnowledge: 'unobserved',
        });
      }
    }
  }

  for (const [sourcePopulationRef, population] of populationDebits) {
    const { debited, sourceCount: expected } = population;
    if (!Number.isFinite(expected) || debited > expected) {
      throw new Error(`HERO_LAIR_POPULATION_OVERDRAW: ${sourcePopulationRef}; in-lair ${debited}; source ${expected}`);
    }
  }

  const metricsRows = rowsBetweenHeadings(file03, '### 3.L.6.', '### 3.L.7.').filter(row => /^\d{2}$/.test(row[0]));
  const metricsById = new Map(metricsRows.map(row => [row[0], { metrics: row[1], succession: row[3] }]));
  for (const lair of lairs) {
    const value = metricsById.get(lair.id.slice(-2));
    if (!value) throw new Error(`HERO_LAIR_METRICS_MISSING: ${lair.id}`);
    lair.initialMetrics = value.metrics;
    lair.successionRule = value.succession;
  }

  const extensionRows = rowsBetweenMarkers(file03, 'LL01-HERO-LAIRS');
  if (extensionRows.length === 0) {
    throw new Error('HERO_LAIR_MEMBER_COUNT_DECLARATION_MISSING');
  }
  return { lairs, units };
}

function parseFixedActors(file04: string, sites: readonly WorldSite[]): FixedWorldActor[] {
  const actors = rowsBetweenMarkers(file04, 'LL01-HEROES').filter(row => /^HERO-LL01-\d{2}$/.test(row[0])).map(row => {
    const name = row[1].split(',')[0]?.trim();
    const tier = row[2].match(/T(\d+)/);
    const grade = ACTOR_GRADES.find(candidate => row[2].includes(candidate));
    const fixedSiteId = row[4].match(/SITE-LL01-\d{3}/)?.[0];
    const lifeStateAtT0 = /stasis/i.test(row[1]) ? 'stasis' : /corpse/i.test(row[1]) ? 'corpse' : /còn sống/i.test(row[1]) ? 'alive' : null;
    if (!name || !tier || !grade || !fixedSiteId || !lifeStateAtT0) throw new Error(`FIXED_ACTOR_ROW_INVALID: ${row[0]}`);
    if (!sites.some(site => site.id === fixedSiteId)) throw new Error(`FIXED_ACTOR_SITE_MISSING: ${row[0]} -> ${fixedSiteId}`);
    return {
      id: row[0],
      name,
      lifeStateAtT0,
      formTier: Number(tier[1]),
      grade,
      roleAndAgency: row[3],
      fixedSiteId,
      fixedStatus: row[1],
      accessRoute: row[5],
      playerKnowledge: 'unobserved' as const,
      source: { path: 'references/canonical/LORD-DND-04.md', heading: '4.N.1 Fixed actor registry', recordId: row[0] },
    };
  });
  if (actors.length !== 13 || new Set(actors.map(actor => actor.id)).size !== 13) {
    throw new Error(`FIXED_ACTOR_COUNT_MISMATCH: expected 13; got ${actors.length}`);
  }
  return actors;
}

function parseTypedWorldRows(file03: string, kind: 'Resource' | 'Route' | 'Ecology'): string[][] {
  const start = file03.indexOf('### 3.K.7.');
  const end = file03.indexOf('### 3.K.8.', start);
  if (start < 0 || end < 0) throw new Error('WORLD_PACKAGE_RUNTIME_ROWS_MISSING');
  return file03.slice(start, end).split('\n').filter(line => line.startsWith('|')).map(line => line.slice(1, line.endsWith('|') ? -1 : undefined).split('|').map(cleanCell)).filter(row => row[0] === kind);
}

function parseResources(file03: string, sites: readonly WorldSite[]): { resources: WorldResource[]; features: WorldResourceFeature[] } {
  const siteByResource: Readonly<Record<string, string>> = {
    'RES-LL01-01': 'SITE-LL01-040',
    'RES-LL01-02': 'SITE-LL01-041',
    'RES-LL01-03': 'SITE-LL01-042',
    'RES-LL01-05': 'SITE-LL01-051',
  };
  const sourceFeatures = RESOURCE_FEATURES.map(feature => {
    const siteId = feature.sourceRecord ? siteByResource[feature.sourceRecord] : undefined;
    const site = sites.find(candidate => candidate.id === siteId);
    return site ? { ...feature, position: site.position } : feature;
  });
  const sourceResources = parseTypedWorldRows(file03, 'Resource').map(row => {
    const id = row[1].match(/RES-LL01-\d{2}/)?.[0];
    if (!id) throw new Error(`WORLD_RESOURCE_ID_INVALID: ${row[1]}`);
    const feature = sourceFeatures.find(candidate => candidate.sourceRecord === id);
    const material = feature?.materials.find(candidate => candidate.resourceId === id);
    if (!feature || !material) throw new Error(`WORLD_RESOURCE_PROFILE_MISSING:${id}`);
    const expectedQuantity = id === 'RES-LL01-01' ? '780' : id === 'RES-LL01-02' ? '1.240' : id === 'RES-LL01-03' ? '20.000' : id === 'RES-LL01-04' ? '430' : '14';
    if (!row[2].includes(expectedQuantity)) throw new Error(`WORLD_RESOURCE_CAPACITY_SOURCE_MISMATCH:${id}`);
    return {
      ...resourceFromFeature(feature, material, row[2]),
      source: { path: 'references/canonical/LORD-DND-03.md', heading: '3.K.7 Resources', recordId: id },
    };
  });
  const sourceIds = new Set(sourceResources.map(resource => resource.id));
  const designedResources = sourceFeatures.flatMap(feature => feature.materials
    .filter(material => !sourceIds.has(material.resourceId))
    .map(material => resourceFromFeature(feature, material)));
  const resources = [...sourceResources, ...designedResources];
  const features = sourceFeatures.map(worldFeatureFromSpec);
  if (new Set(resources.map(resource => resource.id)).size !== resources.length) throw new Error('WORLD_RESOURCE_ID_DUPLICATE');
  if (resources.some(resource => !features.some(feature => feature.id === resource.featureId))) throw new Error('WORLD_RESOURCE_FEATURE_MISSING');
  return { resources, features };
}

function parseEcology(file03: string): EcologyRecord[] {
  return parseTypedWorldRows(file03, 'Ecology').map(row => {
    const counts: Record<string, number> = {};
    const notes: string[] = [];
    for (const clause of row[2].split(';').map(value => value.trim()).filter(Boolean)) {
      const match = clause.match(/^(.+?)\s+(\d[\d,.]*)$/);
      if (!match) {
        notes.push(clause);
        continue;
      }
      const name = match[1].trim().replace(/^population aggregate khóa:\s*/i, '').replace(/\s+/g, '_');
      counts[name] = Number(match[2].replace(/[.,]/g, ''));
    }
    if (Object.keys(counts).length === 0) throw new Error(`WORLD_ECOLOGY_EMPTY: ${row[1]}`);
    return { id: row[1], counts, notes, source: { path: 'references/canonical/LORD-DND-03.md', heading: '3.K.7 Ecology', recordId: row[1] } };
  });
}

function parseRoutes(file03: string): { id: string; description: string; source: { path: string; heading: string; recordId: string } }[] {
  return parseTypedWorldRows(file03, 'Route').map(row => {
    const id = row[1].match(/ROUTE-LL01-\d{2}/)?.[0];
    if (!id) throw new Error(`WORLD_ROUTE_ID_INVALID: ${row[1]}`);
    return { id, description: row[2], source: { path: 'references/canonical/LORD-DND-03.md', heading: '3.K.7 Routes', recordId: id } };
  });
}

function parseDormantQuests(file05: string): string[] {
  const ids = [...new Set(file05.split('\n').filter(line => /^\| `QUEST-LL01-\d{2}`/.test(line))
    .map(line => line.match(/QUEST-LL01-\d{2}/)?.[0]).filter((value): value is string => Boolean(value)))].sort();
  if (ids.length !== 18) throw new Error(`WORLD_QUEST_COUNT_MISMATCH: expected 18 dormant questlines; got ${ids.length}`);
  return ids;
}

function parseHoursFromT0(value: string): number {
  const match = value.match(/^T0\+(\d+)h$/);
  if (!match) throw new Error(`EVENT_SCHEDULE_TIME_INVALID: ${value}`);
  return Number(match[1]) * 60 * 60 * 1000;
}

function parseEventSchedule(timelineText: string, itemLedgerText: string, addendumText: string, catalogText: string): FixedEventScheduleRow[] {
  const timeline = JSON.parse(timelineText) as { release_id?: string; event_schedule?: Record<string, unknown>[] };
  if (timeline.release_id !== SOURCE_RELEASES['data/events/EVENT-TIMELINE-v0.6.json']) {
    throw new Error(`EVENT_TIMELINE_RELEASE_MISMATCH: ${timeline.release_id}`);
  }
  if (!Array.isArray(timeline.event_schedule)) throw new Error('EVENT_TIMELINE_SCHEDULE_MISSING');
  const ledger = parseEventSourceLedger(itemLedgerText);
  const addendum = JSON.parse(addendumText) as { release_id?: string; data_file?: string; cumulative_rows?: number; total_item_ids?: string[] };
  const catalog = JSON.parse(catalogText) as { provenance_conflicts?: { event_id?: string }[] };
  if (addendum.release_id !== SOURCE_RELEASES['data/events/EVENT-SOURCE-CATALOG-v7.25-ADDENDUM.json']
    || addendum.data_file !== 'data/events/EVENT-SOURCE-ITEMS-v7.24.csv'
    || addendum.cumulative_rows !== ledger.length
    || !Array.isArray(addendum.total_item_ids)
    || addendum.total_item_ids.length !== ledger.length
    || new Set(ledger.map(item => item.fields.id)).size !== ledger.length
    || addendum.total_item_ids.some(id => !ledger.some(item => item.fields.id === id))) {
    throw new Error('EVENT_RESEARCH_LEDGER_ADDENDUM_MISMATCH');
  }
  const conflictsByEvent = new Map<string, number>();
  for (const conflict of catalog.provenance_conflicts ?? []) {
    if (conflict.event_id) conflictsByEvent.set(conflict.event_id, (conflictsByEvent.get(conflict.event_id) ?? 0) + 1);
  }
  return timeline.event_schedule.map(row => {
    if (typeof row.event_id !== 'string' || typeof row.event_title_legacy !== 'string'
      || typeof row.opens_at !== 'string' || typeof row.locks_at !== 'string' || typeof row.resolves_at !== 'string') {
      throw new Error(`EVENT_TIMELINE_ROW_INVALID: ${JSON.stringify(row)}`);
    }
    const eventRows = ledger.filter(item => item.fields.event_id === row.event_id
      || (item.sourceFieldAlignment === 'verified' && item.fields.secondary_event_id === row.event_id));
    return {
      id: row.event_id,
      displayName: row.event_title_legacy.replace(/\s*;\s*ch\.?[^;]*$/iu, '').trim(),
      opensAtMs: parseHoursFromT0(row.opens_at),
      locksAtMs: parseHoursFromT0(row.locks_at),
      resolvesAtMs: parseHoursFromT0(row.resolves_at),
      durationHours: Number(row.duration_hours),
      settlementHours: Number(row.settlement_hours),
      basis: String(row.basis),
      researchEvidence: {
        releaseId: 'LL01-WEB-EVENT-SOURCE-ITEMS-7.24',
        sourceRows: eventRows.length,
        researchOnlyRows: eventRows.filter(item => item.rawSourceFields.some(value => value === 'RESEARCH_CANDIDATE_NOT_ACTIVE' || value === 'SOURCE_REVIEW_PENDING_GAME_EVENT_PACK')).length,
        verifiedAcquisitions: eventRows.filter(item => item.sourceFieldAlignment === 'verified' && item.fields.acquisition_verified === 'true').length,
        verifiedShopOffers: eventRows.filter(item => item.sourceFieldAlignment === 'verified' && item.fields.shop_offer_verified === 'true').length,
        observedChestOutcomes: eventRows.filter(item => item.fields.channel.includes('CHEST_OBSERVED') || item.fields.subtype === 'CHEST_OBSERVED').length,
        unresolvedRowShapes: eventRows.filter(item => item.sourceFieldAlignment === 'unresolved').length,
        unresolvedConflicts: conflictsByEvent.get(String(row.event_id)) ?? 0,
        mechanicFlags: Array.isArray(row.mechanic_flags) ? row.mechanic_flags.map(String) : [],
      },
      statusAtT0: 'scheduled',
      source: { path: 'data/events/EVENT-TIMELINE-v0.6.json', heading: 'event_schedule', recordId: row.event_id },
    };
  });
}

function verifyEventAndHeroContracts(file01: string, file04: string, file05: string, calendar: readonly FixedEventScheduleRow[], lairs: readonly HeroLair[], units: readonly FixedWorldUnit[]): void {
  if (calendar.length !== 30 || calendar[0]?.id !== 'EV00-SAFE-FIRE' || calendar[29]?.id !== 'EV29-FINAL-CALAMITY') {
    throw new Error(`EVENT_CALENDAR_COUNT_MISMATCH: expected EV00–EV29, got ${calendar.length}`);
  }
  assertEventContractCoverage(calendar.map(row => row.id));
  if (!file01.includes('CANON-EVENT-LEDGER-4.0') || !file05.includes('EV00–EV29')) {
    throw new Error('EVENT_LEDGER_BINDING_MISSING');
  }
  const leaderIds = lairs.map(lair => lair.leaderHeroId);
  const heroRegistryIds = [...new Set(file04.match(/HERO-LAIR-LL01-\d{2}/g) ?? [])].sort();
  if (leaderIds.length !== 15 || new Set(leaderIds).size !== 15 || heroRegistryIds.length !== 15 || leaderIds.some(id => !heroRegistryIds.includes(id))) {
    throw new Error('HERO_LAIR_PROFILE_REFERENCE_MISMATCH');
  }
  if (lairs.length !== 15 || units.length !== 693 || new Set(units.map(unit => unit.id)).size !== 693) {
    throw new Error(`HERO_LAIR_IDENTITY_COUNT_MISMATCH: ${lairs.length} lairs, ${units.length} unit identities`);
  }
  if (lairs.filter(lair => Math.hypot(lair.position.xMm, lair.position.yMm) <= 96_000_000).length !== 10) {
    throw new Error('HERO_LAIR_LOCAL_MACRO_SPLIT_MISMATCH');
  }
}

function sourceManifest(sources: Readonly<Record<string, string>>) {
  return Object.keys(SOURCE_LOCK).sort().map(path => {
    const isResearch = path.includes('EVENT-SOURCE-CATALOG') || path.includes('EVENT-SOURCE-ITEMS') || path.includes('SOURCE-STRUCTURE-CATALOG');
    let uses: { authorityClass: string; runtimeUse: string };
    if (path.includes('EVENT-TIMELINE')) {
      uses = { authorityClass: 'campaign_fixed', runtimeUse: 'Explicitly selected as the reconciled 30-row new-game schedule.' };
    } else if (isResearch && path.includes('EVENT-SOURCE-ITEMS-v7.24')) {
      uses = { authorityClass: 'unresolved_research', runtimeUse: 'Counted into per-event evidence summaries; never compiled as active items, drops, shops or rewards.' };
    } else if (isResearch) {
      uses = { authorityClass: 'unresolved_research', runtimeUse: 'Evidence only; not compiled as active items, structures, shops, rewards or inventory.' };
    } else if (path.includes('LORD-DND-03')) {
      uses = { authorityClass: 'campaign_fixed', runtimeUse: 'Fixed LL01 world package and pre-seeded world identities.' };
    } else if (path.includes('LORD-DND-06')) {
      uses = { authorityClass: 'campaign_fixed', runtimeUse: 'Lí Lan clean T0 state and source-defined carried assets.' };
    } else if (path.includes('LORD-DND-01') || path.includes('LORD-DND-02') || path.includes('LORD-DND-04') || path.includes('LORD-DND-05')) {
      uses = { authorityClass: 'immutable_source_fact', runtimeUse: 'Shared rules, clean start, command bounds and fixed actor/quest contracts.' };
    } else if (path.includes('CONTENT-DESIGN') || path.includes('RELEASE-LINEAGE')) {
      uses = { authorityClass: 'versioned_game_design', runtimeUse: 'Ruleset/content authority and migration lineage.' };
    } else if (path === 'docs/FRESH_START.md') {
      uses = { authorityClass: 'versioned_game_design', runtimeUse: 'Versioned clean-start constraints and prohibited carryover state.' };
    } else {
      uses = { authorityClass: 'versioned_game_design', runtimeUse: 'Repository scope and fresh-start constraints.' };
    }
    return { path, releaseId: SOURCE_RELEASES[path as keyof typeof SOURCE_LOCK], sha256: sha256(sources[path]), ...uses };
  });
}

export function compileContent(root: string): { manifest: ContentManifest; world: WorldDefinition } {
  const sources = readSources(root);
  assertSourceHashes(sources);
  const file03 = sources['references/canonical/LORD-DND-03.md'];
  const file01 = sources['references/canonical/LORD-DND-01.md'];
  const file04 = sources['references/canonical/LORD-DND-04.md'];
  const file05 = sources['references/canonical/LORD-DND-05.md'];
  const timelineText = sources['data/events/EVENT-TIMELINE-v0.6.json'];
  const eventItemLedger = sources['data/events/EVENT-SOURCE-ITEMS-v7.24.csv'];
  const eventFinalAddendum = sources['data/events/EVENT-SOURCE-CATALOG-v7.25-ADDENDUM.json'];
  const eventResearchCatalog = sources['data/events/EVENT-SOURCE-CATALOG-v4.6.json'];
  verifyWorldTableHashes(file03);

  const sites = parseSites(file03);
  const chestCacheCenters = parseChestCacheCenters(file03);
  const anchors = parseAnchors(file03);
  const fieldChests = parseFieldChests(file03);
  assertChestLootTables(fieldChests);
  const { lairs, units } = parseLairConservation(file03);
  const fixedActors = parseFixedActors(file04, sites);
  const { resources, features: resourceFeatures } = parseResources(file03, sites);
  const ecology = parseEcology(file03);
  const routes = parseRoutes(file03);
  const navigationOverlay = buildNavigationOverlay(routes, sites, { xMm: 0, yMm: 0, sourceZMetres: 0 });
  const dormantQuestIds = parseDormantQuests(file05);
  const eventSchedule = parseEventSchedule(timelineText, eventItemLedger, eventFinalAddendum, eventResearchCatalog);
  assertEventMechanics(eventSchedule);
  verifyEventAndHeroContracts(file01, file04, file05, eventSchedule, lairs, units);

  if (sites.length !== 38 || chestCacheCenters.length !== 41 || anchors.length !== 10 || fieldChests.length !== 192 || lairs.length !== 15) {
    throw new Error(`WORLD_PACKAGE_COUNT_MISMATCH: sites=${sites.length}, cacheCenters=${chestCacheCenters.length}, anchors=${anchors.length}, chests=${fieldChests.length}, lairs=${lairs.length}`);
  }
  for (const cache of chestCacheCenters) {
    for (const chestId of cache.chestIds) {
      if (!fieldChests.some(chest => chest.id === chestId && chest.cacheId === cache.id)) throw new Error(`CACHE_INSTANCE_REFERENCE_MISMATCH: ${cache.id} -> ${chestId}`);
    }
  }
  const expectedGrades = new Map([['Mộc', 139], ['Thanh Đồng', 37], ['Bạch Ngân', 11], ['Hoàng Kim', 4], ['Hạo Nguyệt', 1]]);
  for (const [grade, expected] of expectedGrades) {
    const actual = fieldChests.filter(chest => chest.grade === grade).length;
    if (actual !== expected) throw new Error(`WORLD_CHEST_GRADE_TOTAL_MISMATCH: ${grade}; expected ${expected}; actual ${actual}`);
  }
  const chestIds = fieldChests.map(chest => chest.id).sort();
  if (chestIds[0] !== 'CH-LL01-001' || chestIds.at(-1) !== 'CH-LL01-192' || new Set(chestIds).size !== 192) {
    throw new Error('WORLD_CHEST_ID_RANGE_MISMATCH');
  }
  const openingSiteIds = ['SITE-LL01-000', 'SITE-LL01-001', 'SITE-LL01-002', 'SITE-LL01-003'] as const;
  for (const id of openingSiteIds) if (!sites.some(site => site.id === id)) throw new Error(`OPENING_SITE_MISSING: ${id}`);

  const lockedSourceHashes = Object.fromEntries(Object.keys(SOURCE_LOCK).sort().map(path => [path, sha256(sources[path])]));
  const worldBody = {
    id: 'WORLD-PACKAGE-LL01-1.0' as const,
    contentVersion: CONTENT_VERSION,
    coordinateSystem: 'LL01-LOCAL-KM' as const,
    coordinateEncoding: 'integer millimetres from H0; source z retained in metres' as const,
    activeMapRadiusKm: 96 as const,
    origin: { xMm: 0, yMm: 0, sourceZMetres: 0 },
    openingSiteIds,
    sites,
    chestCacheCenters,
    anchors,
    fieldChests,
    lairs,
    lairUnits: units,
    fixedActors,
    resourceFeatures,
    resources,
    ecology,
    routes,
    navigationOverlay,
    dormantQuestIds,
    eventSchedule,
    eventContractRegistryVersion: EVENT_CONTRACT_REGISTRY_VERSION,
    eventContracts: EVENT_CONTRACTS satisfies readonly EventContractDefinition[],
    lockedSourceHashes,
  };
  const contentSha256 = sha256(stableStringify(worldBody));
  const world = { ...worldBody, contentSha256 } satisfies WorldDefinition;
  const sourcesInManifest = sourceManifest(sources);
  const manifestBody = {
    schemaVersion: 2 as const,
    contentVersion: CONTENT_VERSION,
    rulesetVersion: RULESET_VERSION,
    sourceMainCommit: SOURCE_MAIN_COMMIT,
    activeWorldPackageId: world.id,
    timelineVersion: 'LL01-WEB-EVENT-TIMELINE-RECONCILIATION-0.6-RC1',
    approvedGameplayModules: ['clean-start-initialization', 'known-entity-inspection', 'player-view-projection', 'navigation-overlay-v1', 'spatial-search-v1', 'resource-logistics-v1', 'terrain-linked-resource-economy-v1', 'stage06-construction-inventory-v1', 'stage07-revival-combat-xp-v1', 'stage08-fixed-calendar-q08-market-and-escrow-v1', 'stage10-event-lifecycle-wildlife-chests-and-shared-ui-v1'],
    conversionManifest: [
      {
        input: 'data/events/EVENT-TIMELINE-v0.6.json',
        output: 'GameState.calendar',
        decision: 'Use its 30 rows as the new-game fixed schedule; initialize every row SCHEDULED. Stage 04 alone settles the zero-time EV00 opening transition.',
      },
      {
        input: 'versioned event mechanics overlay LL01-EVENT-MECHANICS-DESIGN-1.0',
        output: 'EV02–EV29 objectives, player score/shop and result claims',
        decision: 'Compile bounded local-save objective rules from committed domain outcomes. Keep source catalog candidates inactive; never accept client-supplied score, winner, prize pool or item result.',
      },
      {
        input: 'versioned finite wildlife and chest pool rules',
        output: 'per-save finite ecology groups, rarity/type loot tables, player projections',
        decision: 'Expand authored regional counts into deterministic finite groups and bound replenishment to renewable herbivores. Resolve chest reward pools from server seed; event chest entries must match the chest event ID.',
      },
      {
        input: 'data/events/EVENT-SOURCE-CATALOG-v4.6.json and data/events/EVENT-SOURCE-ITEMS-v4.6.csv',
        output: 'source-locked-event-evidence and explicit Stage 08 promotions only',
        decision: 'Retain all source adoption states. Runtime promotions are additive, linked to exact source IDs and validated handlers; unresolved offers, rewards, and effects stay pending.',
      },
      {
        input: 'data/structures/SOURCE-STRUCTURE-CATALOG-v1.0.json',
        output: 'research-only',
        decision: 'Do not compile proposed/observed structures as buildable or owned; opening buildings come from locked File 06/File 04 contracts.',
      },
      {
        input: 'references/canonical/LORD-DND-01.md §14.3 and data/events/EVENT-TIMELINE-v0.6.json',
        output: 'GameState.calendar',
        decision: 'v0.6 is selected through this conversion manifest; do not load the legacy File 01 schedule alongside it.',
      },
      {
        input: 'references/canonical/LORD-DND-03.md §§3.K.4, 3.K.7, 26.10–26.12 and references/canonical/LORD-DND-04.md §18.10',
        output: 'WorldDefinition.navigationOverlay',
        decision: 'Keep source route endpoints and distances; derive only a versioned deterministic connecting geometry. Open-field connectors, walk speed, sight, signal and interaction ranges are explicit game-design defaults, never SVG measurements.',
      },
      {
        input: 'references/canonical/LORD-DND-03.md §3.K.7 resource rows',
        output: 'WorldDefinition.resourceFeatures, WorldDefinition.resources, and per-save resource balances',
        decision: `Retain source rows as provenance, while ${RESOURCE_ECONOMY_VERSION} derives effective capacities from terrain footprints, density, and richness; starter/forest features share explicit material channels, biological stock regrows daily, daily quotas reset at midnight, and unimplemented preparation gates stay blocked.`,
      },
    ],
    sources: sourcesInManifest,
  };
  const manifestSha256 = sha256(stableStringify(manifestBody));
  const manifest = { ...manifestBody, hashes: { worldPackageSha256: contentSha256, manifestSha256 } } satisfies ContentManifest;
  return { manifest, world };
}

export function assertCompiledWorld(world: WorldDefinition): void {
  const { contentSha256, ...body } = world;
  const actual = sha256(stableStringify(body));
  if (actual !== contentSha256) throw new Error(`WORLD_PACKAGE_CONTENT_HASH_MISMATCH: expected ${contentSha256}; actual ${actual}`);
  if (world.sites.length !== 38 || world.chestCacheCenters.length !== 41 || world.anchors.length !== 10 || world.fieldChests.length !== 192 || world.lairs.length !== 15 || world.lairUnits.length !== 693 || world.fixedActors.length !== 13) {
    throw new Error('WORLD_PACKAGE_INVARIANT_FAILED: fixed source counts do not match.');
  }
  assertChestLootTables(world.fieldChests);
  assertEventMechanics(world.eventSchedule);
  if (world.resourceFeatures.length !== RESOURCE_FEATURES.length
    || new Set(world.resourceFeatures.map(feature => feature.id)).size !== world.resourceFeatures.length
    || new Set(world.resources.map(resource => resource.id)).size !== world.resources.length
    || world.resources.some(resource => !world.resourceFeatures.some(feature => feature.id === resource.featureId))
    || world.resourceFeatures.some(feature => feature.appearanceChannels.some(channel =>
      !world.resources.some(resource => resource.id === channel.resourceId && resource.featureId === feature.id)))) {
    throw new Error('WORLD_RESOURCE_FEATURE_INVARIANT_FAILED');
  }
  assertEventContractCoverage(world.eventContracts.map(contract => contract.eventId));
  if (world.eventContractRegistryVersion !== EVENT_CONTRACT_REGISTRY_VERSION
    || world.eventContracts.length !== world.eventSchedule.length) throw new Error('WORLD_EVENT_CONTRACT_REGISTRY_INVALID');
  for (let leftIndex = 0; leftIndex < world.resourceFeatures.length; leftIndex++) {
    const left = world.resourceFeatures[leftIndex];
    for (const right of world.resourceFeatures.slice(leftIndex + 1)) {
      if (left.terrainKind !== right.terrainKind) continue;
      const overlapsX = Math.abs(left.position.xMm - right.position.xMm) < (left.footprintMm.widthMm + right.footprintMm.widthMm) / 2;
      const overlapsY = Math.abs(left.position.yMm - right.position.yMm) < (left.footprintMm.depthMm + right.footprintMm.depthMm) / 2;
      if (overlapsX && overlapsY) throw new Error(`WORLD_RESOURCE_FEATURE_OVERLAP: ${left.id} and ${right.id}`);
    }
  }
}
