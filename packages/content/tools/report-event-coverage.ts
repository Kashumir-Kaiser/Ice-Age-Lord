import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ACTIVE_WORLD_PACKAGE } from '../src/index.ts';
import { EVENT_CONTRACT_REGISTRY_VERSION } from '../src/eventContracts.ts';
import { EVENT_LIFECYCLE_VERSION, eventRuntimeReadiness } from '../src/eventReadiness.ts';
import { parseEventSourceLedger } from '../src/eventLedger.ts';
import { SOURCE_LOCK, SOURCE_RELEASES } from '../src/sourceLock.ts';

type Row = Record<string, any>;

const root = process.cwd();
const catalogPath = resolve(root, 'data/events/EVENT-SOURCE-CATALOG-v4.6.json');
const legacyItemsPath = resolve(root, 'data/events/EVENT-SOURCE-ITEMS-v4.6.csv');
const itemsPath = resolve(root, 'data/events/EVENT-SOURCE-ITEMS-v7.24.csv');
const addendumPath = resolve(root, 'data/events/EVENT-SOURCE-CATALOG-v7.25-ADDENDUM.json');
const timelinePath = resolve(root, 'data/events/EVENT-TIMELINE-v0.6.json');
const structuresPath = resolve(root, 'data/structures/SOURCE-STRUCTURE-CATALOG-v1.0.json');
const catalogBytes = readFileSync(catalogPath);
const legacyItemsBytes = readFileSync(legacyItemsPath);
const itemsBytes = readFileSync(itemsPath);
const addendumBytes = readFileSync(addendumPath);
const timelineBytes = readFileSync(timelinePath);
const structuresBytes = readFileSync(structuresPath);
const catalog = JSON.parse(catalogBytes.toString('utf8')) as Row;
const addendum = JSON.parse(addendumBytes.toString('utf8')) as Row;
const timeline = JSON.parse(timelineBytes.toString('utf8')) as Row;
const structuresCatalog = JSON.parse(structuresBytes.toString('utf8')) as Row;
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const cell = (value: unknown) => String(value ?? '—').replaceAll('|', '\\|').replace(/[\r\n]+/gu, ' ').trim() || '—';
const compact = (values: readonly string[]) => values.length ? values.join('; ') : '—';

function parseCsv(source: string): string[][] {
  const text = source.replace(/^\uFEFF/u, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n' || char === '\r') {
      row.push(field); field = '';
      if (row.some(value => value.length > 0)) rows.push(row);
      row = [];
      if (char === '\r' && text[i + 1] === '\n') i += 1;
    } else field += char;
  }
  row.push(field);
  if (row.some(value => value.length > 0)) rows.push(row);
  if (quoted) throw new Error('STAGE08_COVERAGE_CSV_UNCLOSED_QUOTE');
  return rows;
}

const legacyRows = parseCsv(legacyItemsBytes.toString('utf8'));
const [legacyHeader, ...legacyData] = legacyRows;
if (!legacyHeader || legacyHeader[0] !== 'id' || legacyData.some(row => row.length !== legacyHeader.length)) {
  throw new Error('STAGE08_COVERAGE_LEGACY_CSV_SHAPE_MISMATCH');
}
const legacyIdIndex = legacyHeader.indexOf('id');
const legacyById = new Map(legacyData.map(row => [row[legacyIdIndex]!, Object.fromEntries(legacyHeader.map((name, index) => [name, row[index] ?? '']))]));
const csvHeader = parseCsv(itemsBytes.toString('utf8'))[0];
const csvData = parseEventSourceLedger(itemsBytes.toString('utf8'));
if (!csvHeader || csvHeader[0] !== 'id') throw new Error('STAGE08_COVERAGE_CSV_SHAPE_MISMATCH');
const csvById = new Map(csvData.map(item => [item.fields.id!, item.fields]));
const entries: Row[] = csvData.map(item => ({
  ...item.fields,
  sourceFieldAlignment: item.sourceFieldAlignment,
  unmappedTrailingFields: item.unmappedTrailingFields,
  rawSourceFields: item.rawSourceFields,
}));
const conflicts: Row[] = catalog.provenance_conflicts;
const entryIds = entries.map(entry => String(entry.id));
const legacyEntryIds = (catalog.entries as Row[]).map(entry => String(entry.id));
if (new Set(entryIds).size !== entryIds.length || entryIds.length !== addendum.cumulative_rows
  || !Array.isArray(addendum.total_item_ids) || addendum.total_item_ids.length !== entryIds.length
  || entryIds.some(id => !csvById.has(id) || !addendum.total_item_ids.includes(id))
  || [...csvById.keys()].some(id => !addendum.total_item_ids.includes(id))
  || legacyEntryIds.some(id => !legacyById.has(id) || !csvById.has(id))) {
  throw new Error('STAGE08_COVERAGE_JSON_CSV_ID_MISMATCH');
}

const inputs = [
  ['data/events/EVENT-SOURCE-CATALOG-v4.6.json', catalog.release_id, catalogBytes],
  ['data/events/EVENT-SOURCE-ITEMS-v4.6.csv', SOURCE_RELEASES['data/events/EVENT-SOURCE-ITEMS-v4.6.csv'], legacyItemsBytes],
  ['data/events/EVENT-SOURCE-ITEMS-v7.24.csv', SOURCE_RELEASES['data/events/EVENT-SOURCE-ITEMS-v7.24.csv'], itemsBytes],
  ['data/events/EVENT-SOURCE-CATALOG-v7.25-ADDENDUM.json', addendum.release_id, addendumBytes],
  ['data/events/EVENT-TIMELINE-v0.6.json', timeline.release_id, timelineBytes],
  ['data/structures/SOURCE-STRUCTURE-CATALOG-v1.0.json', structuresCatalog.release_id, structuresBytes],
] as const;
for (const [path, release, bytes] of inputs) {
  if (release !== SOURCE_RELEASES[path] || sha256(bytes) !== SOURCE_LOCK[path]) {
    throw new Error(`STAGE08_COVERAGE_SOURCE_RELEASE_MISMATCH:${path}`);
  }
}
if (ACTIVE_WORLD_PACKAGE.eventSchedule.length !== 30 || timeline.event_schedule.length !== 30) {
  throw new Error('STAGE08_COVERAGE_SCHEDULE_COUNT_MISMATCH');
}

const conflictRefs = (row: Row) => {
  const refs = conflicts.flatMap((conflict, index) => {
    const direct = (row.id && conflict.entry_id === row.id)
      || (row.effect_id && conflict.effect_id === row.effect_id)
      || (row.observation_id && conflict.observation_id === row.observation_id)
      || (row.event_id && conflict.event_id === row.event_id);
    if (!direct) return [];
    return [String(conflict.id ?? conflict.conflict_id ?? `provenance_conflicts[${index + 1}]`)];
  });
  return compact([...new Set(refs)]);
};

const missingEntryContract = (entry: Row): string[] => {
  if (entry.sourceFieldAlignment !== 'verified') return ['repair unaligned source row fields before promotion'];
  const csv = csvById.get(String(entry.id)) as Row;
  const missing: string[] = [];
  if (entry.adoption !== 'ACTIVE') missing.push('explicit promotion and versioned runtime contract');
  if (!csv || csv.acquisition_verified !== 'true') missing.push('verified acquisition/claim receipt');
  if (entry.price == null || entry.price === '') missing.push('adopted price or bounded quote contract');
  if (entry.currency == null || entry.currency === '') missing.push('runtime currency identity and unit');
  if (entry.quantity == null || entry.quantity === '') missing.push('normalized delivered quantity/quality');
  if (entry.purchase_limit == null || entry.purchase_limit === '') missing.push('scope for any cap or explicit no-cap rule');
  if (entry.channel && /SHOP|TRADE|AUCTION|MARKET|OFFER|PURCHASE/iu.test(String(entry.channel))) {
    missing.push('seller/access, stock reservation, atomic settlement and renewal/expiry rules');
  } else missing.push('eligibility, actual instance owner, and provenance transition');
  missing.push('validated effect handler or explicit inactive-item rule');
  if (entry.event_exclusive === true || csv.event_exclusive === 'true') missing.push('per-instance event scope, expiry and residue policy');
  return [...new Set(missing)];
};

const sourceActive = entries.filter(entry => entry.sourceFieldAlignment === 'verified' && entry.adoption === 'ACTIVE');
const pendingEntries = entries.filter(entry => entry.adoption !== 'ACTIVE');
const dormantOtherQuests = ACTIVE_WORLD_PACKAGE.dormantQuestIds.filter(id => id !== 'QUEST-LL01-08');
const lines: string[] = [
  '# Stage 08 content coverage matrix',
  '',
  `Generated from ${catalog.release_id} for provenance conflicts, ${SOURCE_RELEASES['data/events/EVENT-SOURCE-ITEMS-v7.24.csv']} for the cumulative item ledger, ${addendum.release_id}, ${timeline.release_id}, and ${structuresCatalog.release_id}. The v4.6 CSV is retained only to validate the older provenance catalog. Source hashes and all v7.24 IDs are checked against the v7.25 addendum before this report is written.`,
  '',
  '| Input | Release | SHA-256 |',
  '|---|---|---|',
  ...inputs.map(([path, release, bytes]) => `| \`${path}\` | \`${cell(release)}\` | \`${sha256(bytes)}\` |`),
  '',
  '## Runtime summary',
  '',
  `- Calendar compiler: \`${EVENT_LIFECYCLE_VERSION}\`; exactly ${ACTIVE_WORLD_PACKAGE.eventSchedule.length} adopted v0.6 records, with lifecycle receipts and no recurrence.`,
  `- Event contract registry: \`${EVENT_CONTRACT_REGISTRY_VERSION}\`; all ${ACTIVE_WORLD_PACKAGE.eventContracts.length} fixed IDs have a published handler-family, participation, objective, scoring, encounter, reward, shop, expiry and settlement contract in the compiled world package and live API projection.`,
  '- EV00 resolves opening protection. EV01 now simulates finite rival actions, settles from committed completion records, freezes reward bands and supports idempotent player claims. EV02–EV29 have compiled research contracts but remain gated until their event-family handlers record real gameplay outcomes.',
  `- Source registry: ${entries.length} item/offer records (${sourceActive.length} source records promoted; ${pendingEntries.length} remain research/pending), ${catalog.source_effect_records.length} effects, ${catalog.source_observations.length} observations, ${catalog.event_mechanic_extractions.length} mechanic extractions, ${conflicts.length} provenance conflicts.`,
  `- v7.24 cumulative CSV: ${csvData.length} rows and ${csvHeader.length} declared columns; every row ID matches the v7.25 cumulative ID ledger. The older v4.6 catalog has ${legacyEntryIds.length} entries and is used only to attach prior conflict evidence.`,
  `- ${csvData.filter(row => row.sourceFieldAlignment === 'unresolved').length} source rows have unaligned adoption/verification fields. Their purchase or acquisition flags are excluded from event evidence counts and their promotion is blocked. ${csvData.filter(row => row.unmappedTrailingFields.length > 0).length} rows also contain unheaded trailing fields, which remain visible and uninterpreted.`,
  `- v7.25 addendum: ${Array.isArray(addendum.chapter_item_ids) ? addendum.chapter_item_ids.length : 0} chapter IDs, ${Array.isArray(addendum.receipt_groups) ? addendum.receipt_groups.length : 0} receipt groups, ${Array.isArray(addendum.confirmed_outcomes) ? addendum.confirmed_outcomes.length : 0} confirmed outcomes, ${Array.isArray(addendum.unresolved_conflicts) ? addendum.unresolved_conflicts.length : 0} unresolved conflicts, ${Array.isArray(addendum.retracted_source_ids) ? addendum.retracted_source_ids.length : 0} retracted IDs.`,
  `- Research-only structure records: ${structuresCatalog.structures.length}; fixed quest identities outside the implemented Q08 path: ${dormantOtherQuests.length}.`,
  '- Three Stage08 runtime additions are explicit game-design contracts, not source-catalog promotions: the one-sack bridge negotiation choice, a posted-price bread offer, and an unfilled six-salt auction lot. They retain a `versioned_game_design`/no-source-entry trail.',
  '',
  '## Fixed calendar lifecycle',
  '',
  '| Event ID | Opens | Locks | Resolves | Readiness | Boundary verification |',
  '|---|---:|---:|---:|---|---|',
];
for (const [index, source] of timeline.event_schedule.entries()) {
  const compiled = ACTIVE_WORLD_PACKAGE.eventSchedule[index];
  if (!compiled || compiled.id !== source.event_id) throw new Error(`STAGE08_COVERAGE_SCHEDULE_ORDER_MISMATCH:${source.event_id}`);
  lines.push(`| \`${source.event_id}\` | ${cell(source.opens_at)} | ${cell(source.locks_at)} | ${cell(source.resolves_at)} | ${eventRuntimeReadiness(source.event_id)} | exact row/order, just-before/at/after, receipt uniqueness and no recurrence |`);
}

lines.push(
  '', '## Playable Stage08 contract', '',
  '| Contract | Evidence and source status | Runtime / settlement |',
  '|---|---|---|',
  '| `QUEST-LL01-08` — Krona caravan ledger | Campaign-fixed / source analogy. `LORD-DND-04.md` § quest registry, actor roster and `LORD-DND-05.md` Q08 state machine. Existing Torven, `CARAVAN-LL01-01`, `QI-LL01-08`, 18 grain sacks, 6 salt, 9 draft animals, departure +120h, bridge distress +122h, deadline +126h. | Distress is shown only at the bridge; accept, negotiate, escort, arrive and claim are distinct server commands with command receipts. Negotiation spends one actual grain sack as an explicit balance choice because source permits negotiation but gives no exact price. No stand-in actors are spawned. |',
  '| `RW-LL01-08` | Canonical reward row in `LORD-DND-04.md`: `HERO_CONTRACT_OFFER-05`, `ROUTE-TRADE-LL01-A`, 60 Krona. Reward conditions in `LORD-DND-05.md` Q08: Torven alive, ledger intact, at least 3 of 9 draft animals arrive. | One idempotent claim receipt credits 60 Krona and exposes the contract/route. The path does not teleport goods; the 21-day, 4-Krona/day plus 5% led-trips contract is an offer, not an automatically signed agreement. |',
  '| Bread shop offer | Versioned game design; `sourceEntryId=null`, so it is not represented as a novel-listed source shop. | Krona Gate posted price 1 Krona, stock 24, lifetime cap 10/save, one BREAD per purchase; commits currency, stock and actual inventory delivery atomically. BREAD uses Stage04 food consumption, not a display-only effect. |',
  '| Caravan salt auction | Versioned game design around the existing six source caravan salt units; no source buyer/liquidity claim. | Bid reserves source lot quantity and Krona escrow. No auto-fill or ownership on an open bid. Cancel and close/expiry release quantity and refund the full escrow. |',
  '| Other quest identities | Remain dormant and hidden; no generic quest or synthetic actor is created. | Q08 is the only currently executable quest identity; the other fixed identities remain outside the public journal until their contracts are compiled. |',
  '',
  '## Transaction and lifecycle coverage', '',
  '| Check | Result |',
  '|---|---|',
  '| Duplicate command/envelope | Same committed receipt is replayed; cargo, stock, currency and claim are not applied twice. |',
  '| Concurrent last unit of stock | First revision commits; competing stale revision is rejected and must refresh/revalidate. |',
  '| Insufficient Krona / full inventory destination | Rejected with stock and currency conserved. |',
  '| Offer locked/expired boundary | Exact `expiresAtElapsedMs` is inclusive for closure; a purchase at/after it is rejected. Fixed-price offer has no variable quote, so quote acceptance/expired-quote handling is not applicable to this active contract. |',
  '| Escrow bid and cancellation | Open bids reserve only available lot quantity and debit escrow; cancel/auction close returns full funds; no salt ownership is granted before seller settlement. |',
  '| Event-exclusive item instances | No research-catalog item with a verified, adopted per-item expiration has been promoted. The selected Q08 bread offer is explicitly permanent (`exclusiveEventId=null`, `expiresAtElapsedMs=null`); the auction lot expires and its open escrow is refunded. Therefore item-expiry propagation through equipment/jobs/other containers is not falsely claimed as covered by an active event-exclusive content contract. |',
  '| Exclusive quest reward claim | Q08 reward key is unique; repeated claim cannot pay a second 60 Krona or reopen the route contract. |',
  '| Save and backup reload | Quest state, inventory purchase/consumption lineage, currency, market stock and receipts survive process restart and backup import. |',
  '| Source-version update | The v7.24 CSV and v7.25 addendum hashes, cumulative count and every source ID are verified; the v4.6 catalog/CSV pair remains a prior-provenance comparison. Research-only changes do not mutate the pinned save’s committed calendar or claims. |',
  '',
  '## Ranking source and settlement', '',
  '- `LORD-DND-01.md` §13.3–13.4 defines `OPENING_LEVEL`: open +48h, close +144h, top 100 actors reaching level 10, level then progress, completion timestamp then stable player ID, three-minute data delay, and fixed `RWD-OPENING-FIXED-2.0` payloads for seven rank bands. A zero-qualifier result is empty and pays nothing.',
  '- `LORD-DND-07.md` §12–13 supplies the frozen ten-actor P0 contender roster and forbids importing test rankings into `SAVE-T0-CLEAN`. The source roster exists. This build does not compile those actors’ committed actions, XP/level outcomes, completion timestamps or eligibility ledger into settlement input.',
  '- At +144h, the runtime emits one immutable blocked snapshot with `P0_FIXED_CONTENDER_RUNTIME_NOT_COMPILED`, zero rows and zero rewards. It never calls Lí Lan rank 1 by default. Implementing the source ranking requires compiling the fixed actors’ versioned progression/event simulation and validating the source XP/progression path first.',
  '',
  '## Specific source row retained as research', '',
  '| ID | Verified source facts | Still unresolved / why not active |',
  '|---|---|---|',
  '| `SX-0274` / `EV06-CONSTRUCTION-WEEK` / Chapter 285 | Source panel explicitly lists 5,000 Krona for 1 Kingdom Honor point; offer verified, acquisition not verified; introduced after the first Construction Week day and tied to Dolon Lake siege; remote view but physical pickup at army camp or Vĩnh Sương main city. | `purchase_limit` absent and `scope=UNKNOWN`; no source-confirmed cap, exchange ceiling, exact opening timestamp, LL01 map binding for either pickup site, or receipt. It remains `RESEARCH_CANDIDATE_NOT_ACTIVE`; no honor point or Krona conversion is invented. |',
  '',
  '## Every source entry', '',
  `All ${entries.length} v7.24 CSV rows and their v7.25 cumulative IDs are shown. The 590-entry v4.6 catalog is a separate provenance/conflict input. Missing fields describe promotion/runtime work, not an assertion that the source passage contains no facts.`,
  '',
  '| Source ID | Event | Channel / subtype | Adoption | Price / currency / limit / quantity | Missing promotion/runtime contract fields | Row alignment | Unmapped trailing fields | Conflicts |',
  '|---|---|---|---|---|---|---|---:|---|',
);
for (const entry of entries) {
  const facts = [entry.price == null || entry.price === '' ? 'price unknown' : `price ${entry.price}`,
    entry.currency == null || entry.currency === '' ? 'currency unknown' : `currency ${entry.currency}`,
    entry.purchase_limit == null || entry.purchase_limit === '' ? `limit unknown${entry.scope ? ` (${entry.scope})` : ''}` : `limit ${entry.purchase_limit} (${entry.scope ?? 'scope unknown'})`,
    entry.quantity == null || entry.quantity === '' ? 'quantity unknown' : `quantity ${entry.quantity}`].join(' / ');
  lines.push(`| \`${cell(entry.id)}\` | ${cell(entry.event_id)} | ${cell(entry.channel)} / ${cell(entry.subtype)} | ${cell(entry.sourceFieldAlignment === 'verified' ? entry.adoption : 'ROW_ALIGNMENT_UNRESOLVED')} | ${cell(facts)} | ${cell(compact(missingEntryContract(entry)))} | ${cell(entry.sourceFieldAlignment)} | ${cell(entry.unmappedTrailingFields.join('; '))} | ${cell(conflictRefs(entry))} |`);
}

lines.push('', '## Source effect records', '', '| Effect ID | Event | Source contract status | Remaining promotion work | Conflicts |', '|---|---|---|---|---|');
for (const effect of catalog.source_effect_records as Row[]) {
  const missing = ['versioned executable handler/schema', 'source-entry and eligible owner/target linkage', 'activation cost, duration, stacking and cancellation', 'expiry/residue and save migration policy', 'invariant and handler tests'];
  if (effect.construction_inputs) missing.push('complete recipe/output/placement prerequisites');
  lines.push(`| \`${cell(effect.effect_id)}\` | ${cell(effect.event_id)} | ${cell(effect.contract_status)} | ${cell(compact(missing))} | ${cell(conflictRefs(effect))} |`);
}

lines.push('', '## Source observations', '', 'The catalog does not assign observation IDs; array locators are report locators only.', '', '| Source locator | Event | Type | Remaining runtime contract work | Conflicts |', '|---|---|---|---|---|');
for (const [index, observation] of (catalog.source_observations as Row[]).entries()) {
  lines.push(`| \`source_observations[${String(index + 1).padStart(3, '0')}]\` | ${cell(observation.event_id)} | ${cell(observation.type)} | eligibility/time; instance owner/provenance; additive/cumulative rule; claim receipt; effect and expiry policy | ${cell(conflictRefs(observation))} |`);
}

lines.push('', '## Mechanic extraction records', '', '| Source locator | Event | Title / type | Source adoption | Remaining contract work | Conflicts |', '|---|---|---|---|---|---|');
for (const [index, extraction] of (catalog.event_mechanic_extractions as Row[]).entries()) {
  lines.push(`| \`event_mechanic_extractions[${String(index + 1).padStart(3, '0')}]\` | ${cell(extraction.event_id)} | ${cell(extraction.title)} / ${cell(extraction.type)} | ${cell(extraction.status ?? extraction.game_adoption)} | access/eligibility; costs and reservations; deterministic outcomes; reward/choice rules; timing/ownership/expiry; handler and invariant tests | ${cell(conflictRefs(extraction))} |`);
}

lines.push('', '## Fixed quests and source structures still pending', '',
  '| Record | Current state | Missing runtime contract |',
  '|---|---|---|');
for (const questId of dormantOtherQuests) {
  lines.push(`| \`${cell(questId)}\` | dormant and hidden | issuer/access; evidence-driven objectives; player choices and failure; actual-instance provenance; reward/effect and claim receipts |`);
}
for (const structure of structuresCatalog.structures as Row[]) {
  const physical = structure.physical_profile ?? {};
  const profile = physical.height_m_approximate ? `; approx. height ${physical.height_m_approximate.min}–${physical.height_m_approximate.max} m` : '';
  lines.push(`| \`${cell(structure.structure_id)}\` ${cell(structure.display_vi ?? structure.name_zh)}${profile} | research only; ${cell(structure.record_type)} | LL01 location/ownership; blueprint and placement; recipe; integrity/repair/production; executable handler and migration |`);
}

lines.push('', '## Provenance conflicts retained', '', '| Catalog ID | Event / record | Source conflict / safe disposition |', '|---|---|---|');
for (const [index, conflict] of conflicts.entries()) {
  const locator = conflict.id ?? conflict.conflict_id ?? `provenance_conflicts[${String(index + 1).padStart(2, '0')}]`;
  const detail = ['local', 'novel', 'source', 'description', 'evidence', 'detail', 'action', 'resolution', 'status', 'adoption']
    .flatMap(key => typeof conflict[key] === 'string' ? [conflict[key]] : [])
    .filter((value, partIndex, values) => values.indexOf(value) === partIndex);
  lines.push(`| \`${cell(locator)}\` | ${cell(conflict.event_id ?? conflict.entry_id ?? 'cross-event / item conflict')} | ${cell(compact(detail.length ? detail : ['retain as unresolved research; do not promote']))} |`);
}

lines.push('', '## Gate disposition', '',
  '- Gate 1 — passed: all 30 adopted rows and exact open/lock/resolve boundaries, no recurrence, plus 5× clock and restart at the EV02 blocker.',
  '- Gate 2 — passed for the implemented Q08 contract: fixed actors/route/deadline/conditions/reward, legitimate site and time eligibility, inventory/effect path, persistence, and reload. The grain-for-passage cost and market/auction terms are versioned design choices because the fixed source contract does not price them.',
  '- Gate 3 — covered for the active fixed-price offer and unfilled auction: stale last-stock request, duplicate receipt, no funds, capacity full, exact offer close, escrow bid/cancel/expiry and no premature salt ownership. Variable-price quotes and auction seller acceptance are not active contracts; no quote or fictional buyer is simulated.',
  '- Gate 4 — partial/applicability-limited: unique reward claim and auction escrow expiry are tested. There is no promoted source event-exclusive item with an adopted per-instance expiry contract; the selected bread is explicitly permanent. Per-item expiry through equipment/jobs/other containers therefore remains unclaimed until an eligible source/design item contract is adopted.',
  '- Gate 5 — safe blocked settlement: source ranking/tie rules and fixed reward bands are recorded; a one-time zero-row blocked snapshot prevents false rank 1 and awards until P0 outcome simulation is compiled.',
  '- Gate 6 — passed as a coverage artifact: all source entries, effects, observations, extractions, structures and conflicts are enumerated with promotion work and provenance. No research row is silently promoted.',
  '',
  '');

const output = resolve(root, 'docs/implementation/STAGE-08-CONTENT-COVERAGE.md');
mkdirSync(resolve(root, 'docs/implementation'), { recursive: true });
while (lines.at(-1) === '') lines.pop();
writeFileSync(output, `${lines.join('\n')}\n`, 'utf8');
process.stdout.write(`Wrote ${output}: ${entries.length} entries, ${catalog.source_effect_records.length} effects, ${catalog.source_observations.length} observations, ${catalog.event_mechanic_extractions.length} extractions, ${structuresCatalog.structures.length} structures, ${conflicts.length} conflicts.\n`);
