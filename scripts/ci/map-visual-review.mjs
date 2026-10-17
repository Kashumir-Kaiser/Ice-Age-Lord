#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readdir, readFile, mkdir, copyFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(path.resolve('frontend/package.json'));
const sharp = require('sharp');
const [artifactRoot, outputRoot, quality, dprArg, sourceRunArg] = process.argv.slice(2);
const dpr = Number(dprArg);
const sourceRun = Number(sourceRunArg);
if (!artifactRoot || !outputRoot || !['low', 'normal'].includes(quality) || ![1, 2].includes(dpr) || !Number.isInteger(sourceRun)) {
  throw new Error('Usage: node scripts/ci/map-visual-review.mjs <artifacts-dir> <output-dir> <low|normal> <1|2> <source-run-id>');
}

const expectedViewports = [1366, 1920, 390];
const mapScenarios = new Set([
  'dense-520', 'fallback', 'fire-close', 'heat-2500', 'heat-25000', 'heat-off', 'local', 'local-forest', 'local-stone',
  'local-water', 'night', 'opening', 'overlap-depth', 'planning', 'populated-12', 'world', 'world-night',
  'fog-current-day', 'fog-current-night', 'fog-remembered-day', 'fog-remembered-night', 'fog-unknown-day', 'fog-unknown-night'
]);
const posePattern = /^(wall|gate|house|farmhouse|watchtower|elemental)-(north|east|south|west)$/;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(file));
    else out.push(file);
  }
  return out;
}
async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}
async function writeSheet(rows, destination, viewport, group, part) {
  const thumbWidth = 360;
  const labelHeight = 34;
  const columns = viewport === 390 ? 2 : 4;
  const tileHeight = Math.round(thumbWidth * (viewport === 390 ? 844 / 390 : (viewport === 1366 ? 768 / 1366 : 1080 / 1920)));
  const tileWidth = thumbWidth;
  const perPage = viewport === 390 ? 12 : rows.length;
  const pages = [];
  for (let start = 0; start < rows.length; start += perPage) {
    const pageRows = rows.slice(start, start + perPage);
    const pageNo = Math.floor(start / perPage) + 1;
    const count = Math.ceil(pageRows.length / columns);
    const canvas = sharp({ create: { width: columns * tileWidth, height: count * (tileHeight + labelHeight), channels: 3, background: '#20242b' } });
    const composites = [];
    for (let index = 0; index < pageRows.length; index++) {
      const row = pageRows[index];
      const image = await sharp(row.file).resize(tileWidth, tileHeight, { fit: 'fill' }).png().toBuffer();
      const labelSvg = Buffer.from(`<svg width="${tileWidth}" height="${labelHeight}"><rect width="100%" height="100%" fill="#11151b"/><text x="8" y="23" fill="#fff" font-size="14" font-family="sans-serif">${String(row.scenario).replace(/[&<>"']/g, '')}</text></svg>`);
      const x = (index % columns) * tileWidth;
      const y = Math.floor(index / columns) * (tileHeight + labelHeight);
      composites.push({ input: image, left: x, top: y }, { input: labelSvg, left: x, top: y + tileHeight });
    }
    const file = destination.replace(/\.png$/, viewport === 390 ? `-part${pageNo}.png` : '.png');
    await canvas.composite(composites).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(file);
    pages.push(file);
  }
  return pages;
}

const allFiles = await walk(artifactRoot);
const scenarioPath = allFiles.find(file => path.basename(file) === 'scenarios.json');
const manifestPath = allFiles.find(file => path.basename(file) === 'qa-manifest.json');
if (!scenarioPath || !manifestPath) throw new Error('Downloaded artifacts lack scenarios.json or qa-manifest.json');
const scenarios = JSON.parse(await readFile(scenarioPath, 'utf8'));
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.status !== 'captured-pending-visual-review' || manifest.reviewStatus !== 'pending-parent-visual-review') throw new Error('Manifest is not a pending visual-review capture');
if (manifest.quality !== quality || Number(manifest.dpr) !== dpr || manifest.captureRows !== 219 || manifest.expectedRowsPerViewport !== 73) throw new Error('Manifest quality/DPR/row totals do not match the requested source');
const byViewport = new Map(expectedViewports.map(width => [width, []]));
for (const row of scenarios) {
  if (!byViewport.has(row.viewport?.width)) continue;
  if (row.quality !== quality || Number(row.dpr) !== dpr || row.reviewStatus !== 'pending-parent-visual-review') throw new Error(`Unexpected row metadata: ${row.filename}`);
  const expectedPath = row.filename.replaceAll('/', path.sep);
  const exact = allFiles.find(file => file.endsWith(path.sep + expectedPath));
  const matches = exact ? [exact] : allFiles.filter(file => path.basename(file) === path.basename(row.filename));
  if (matches.length !== 1) throw new Error(`Expected exactly one PNG for ${row.filename}, found ${matches.length}`);
  byViewport.get(row.viewport.width).push({ ...row, file: matches[0] });
}
for (const width of expectedViewports) {
  if (byViewport.get(width).length !== 73) throw new Error(`Expected 73 rows for viewport ${width}, got ${byViewport.get(width).length}`);
}

const samples = ['dense-520', 'fallback', 'local-water', 'farmhouse-north'];
for (const width of expectedViewports) {
  const rows = byViewport.get(width);
  const output = path.join(outputRoot, String(width));
  await mkdir(output, { recursive: true });
  const groups = {
    mapsFogGeography: rows.filter(row => mapScenarios.has(row.scenario)),
    poses: rows.filter(row => posePattern.test(row.scenario)),
    architecture: rows.filter(row => !mapScenarios.has(row.scenario) && !posePattern.test(row.scenario))
  };
  if (groups.mapsFogGeography.length !== 23 || groups.poses.length !== 24 || groups.architecture.length !== 26) throw new Error(`Unexpected group sizes at ${width}: ${Object.values(groups).map(group => group.length).join('/')}`);
  const sheets = [];
  for (const [group, entries] of Object.entries(groups)) {
    const created = await writeSheet(entries, path.join(output, `${group}.png`), width, group, 1);
    for (const file of created) sheets.push({ file: path.basename(file), bytes: (await stat(file)).size, group });
  }
  const selected = rows.filter(row => samples.includes(row.scenario));
  if (selected.length !== samples.length) throw new Error(`Missing representative raw frames at ${width}`);
  const checksums = [];
  for (const row of selected) {
    const filename = path.basename(row.filename);
    await copyFile(row.file, path.join(output, filename));
    checksums.push({ scenario: row.scenario, filename, sha256: await sha256(row.file), bytes: (await stat(row.file)).size });
  }
  const metadata = {
    schema: 'map-visual-review-bundle-v1', sourceRun, quality, dpr, viewport: width,
    sourceStatus: manifest.status, sourceReviewStatus: manifest.reviewStatus,
    rows: rows.length, groups: Object.fromEntries(Object.entries(groups).map(([name, entries]) => [name, entries.length])),
    contactSheets: sheets, representativeOriginals: checksums
  };
  await writeFile(path.join(output, 'review-metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  let total = 0;
  for (const file of await walk(output)) total += (await stat(file)).size;
  if (total >= 30 * 1024 * 1024) throw new Error(`Review bundle ${width} is ${total} bytes; exceeds safe 30 MiB ceiling`);
  console.log(`${width}: ${rows.length} rows, ${sheets.length} sheets, ${total} bytes`);
}
