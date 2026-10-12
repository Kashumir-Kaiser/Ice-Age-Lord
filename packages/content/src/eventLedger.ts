export type EventSourceLedgerRow = {
  fields: Record<string, string>;
  sourceFieldAlignment: 'verified' | 'unresolved';
  unmappedTrailingFields: readonly string[];
  rawSourceFields: readonly string[];
};

const ADOPTION_STATES = new Set(['RESEARCH_CANDIDATE_NOT_ACTIVE', 'SOURCE_REVIEW_PENDING_GAME_EVENT_PACK', 'RETRACTED_SOURCE_RANGE_ERROR']);
const BOOLEAN_STATES = new Set(['', 'true', 'false']);

/**
 * Read the pinned append-only research CSV while preserving unheaded trailing
 * cells. A row is safe to use for acquisition/shop counts only when its
 * adoption and three verification fields still occupy their declared columns.
 */
export function parseEventSourceLedger(source: string): EventSourceLedgerRow[] {
  const text = source.replace(/^\uFEFF/u, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n' || char === '\r') {
      row.push(field); field = '';
      if (row.some(value => value.length > 0)) rows.push(row);
      row = [];
      if (char === '\r' && text[index + 1] === '\n') index += 1;
    } else field += char;
  }
  row.push(field);
  if (row.some(value => value.length > 0)) rows.push(row);
  if (quoted || rows.length < 2) throw new Error('EVENT_RESEARCH_CSV_INVALID');
  const [header, ...data] = rows;
  if (!header || header[0] !== 'id' || data.some(item => item.length < header.length)) {
    throw new Error('EVENT_RESEARCH_CSV_SHAPE_INVALID');
  }

  const adoptionIndex = header.indexOf('adoption');
  const acquisitionIndex = header.indexOf('acquisition_verified');
  const shopIndex = header.indexOf('shop_offer_verified');
  const chestIndex = header.indexOf('chest_drop_verified');
  if ([adoptionIndex, acquisitionIndex, shopIndex, chestIndex].some(index => index < 0)) {
    throw new Error('EVENT_RESEARCH_CSV_VERIFICATION_COLUMNS_MISSING');
  }
  return data.map(cells => {
    const values = Object.fromEntries(header.map((name, index) => [name!, cells[index] ?? '']));
    const flagsAligned = ADOPTION_STATES.has(cells[adoptionIndex] ?? '')
      && [acquisitionIndex, shopIndex, chestIndex].every(index => BOOLEAN_STATES.has(cells[index] ?? ''));
    return {
      fields: values,
      sourceFieldAlignment: flagsAligned ? 'verified' : 'unresolved',
      unmappedTrailingFields: cells.slice(header.length).filter(value => value.length > 0),
      rawSourceFields: cells,
    };
  });
}
