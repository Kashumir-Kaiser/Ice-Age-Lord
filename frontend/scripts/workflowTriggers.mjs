function nextContentLine(lines, from) {
  for (let index = from; index < lines.length; index += 1) {
    const content = lines[index].trim();
    if (content && !content.startsWith('#')) return index;
  }
  return -1;
}

function scalar(value) {
  const text = value.trim();
  if (text.startsWith("'") && text.endsWith("'")) return text.slice(1, -1).replaceAll("''", "'");
  if (text.startsWith('"') && text.endsWith('"')) return JSON.parse(text);
  return text;
}

function parseBlock(lines, start, indent) {
  const first = lines[start].slice(indent);
  const isSequence = first.startsWith('- ');
  const value = isSequence ? [] : {};
  let index = start;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) { index += 1; continue; }
    const currentIndent = line.length - line.trimStart().length;
    if (currentIndent < indent) break;
    if (currentIndent !== indent) throw new Error(`WORKFLOW_TRIGGER_INDENT_INVALID at line ${index + 1}`);

    if (isSequence) {
      if (!trimmed.startsWith('- ')) throw new Error(`WORKFLOW_TRIGGER_SEQUENCE_INVALID at line ${index + 1}`);
      value.push(scalar(trimmed.slice(2)));
      index += 1;
      continue;
    }

    const colon = line.indexOf(':', indent);
    if (colon < 0) throw new Error(`WORKFLOW_TRIGGER_MAPPING_INVALID at line ${index + 1}`);
    const key = scalar(line.slice(indent, colon));
    const inline = line.slice(colon + 1).trim();
    index += 1;
    if (inline) {
      value[key] = scalar(inline);
      continue;
    }

    const child = nextContentLine(lines, index);
    if (child < 0) { value[key] = null; continue; }
    const childIndent = lines[child].length - lines[child].trimStart().length;
    if (childIndent <= indent) { value[key] = null; continue; }
    const parsed = parseBlock(lines, child, childIndent);
    value[key] = parsed.value;
    index = parsed.next;
  }
  return { value, next: index };
}

/** Parse the workflow's YAML event mapping, including nested mappings and branch/path lists. */
export function parseWorkflowTriggers(source) {
  const lines = source.split(/\r?\n/);
  const rootIndex = lines.findIndex(line => {
    const text = line.trim();
    return line.length === line.trimStart().length && (text === 'on:' || text === "'on':" || text === '"on":');
  });
  if (rootIndex < 0) throw new Error('WORKFLOW_ON_MAPPING_MISSING');
  const child = nextContentLine(lines, rootIndex + 1);
  if (child < 0) return {};
  const indent = lines[child].length - lines[child].trimStart().length;
  if (indent === 0) return {};
  const parsed = parseBlock(lines, child, indent).value;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('WORKFLOW_ON_MAPPING_INVALID');
  return parsed;
}
