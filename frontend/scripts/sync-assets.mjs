import { copyFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = resolve(repo, 'assets/manifest.json');
const publicManifest = resolve(repo, 'frontend/public/assets/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const sourceFolders = ['buildings', 'items', 'terrain', 'units', 'characters'];
for (const folder of sourceFolders) {
  if (!existsSync(resolve(repo, `assets/source/${folder}`))) throw new Error(`Missing authoring folder: assets/source/${folder}`);
}
for (const asset of manifest.assets) {
  const source = resolve(repo, asset.source);
  if (!existsSync(source)) throw new Error(`Missing source master for ${asset.assetId}: ${asset.source}`);
  if (asset.referenceSource && !existsSync(resolve(repo, asset.referenceSource))) {
    throw new Error(`Missing concept reference for ${asset.assetId}: ${asset.referenceSource}`);
  }
  const registeredPaths = [...Object.values(asset.layers), ...Object.values(asset.lodVariants).flatMap(lod => Object.values(lod))];
  for (const layer of new Set(registeredPaths)) {
    if (typeof layer !== 'string') continue;
    const output = resolve(repo, `frontend/public${layer}`);
    if (!existsSync(output)) throw new Error(`Missing runtime export for ${asset.assetId}: ${layer}`);
    const svg = readFileSync(output, 'utf8');
    const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
    if (!viewBox || viewBox.length !== 4 || viewBox[2] !== asset.logicalCanvas.width || viewBox[3] !== asset.logicalCanvas.height) {
      throw new Error(`Runtime layer registration does not match the manifest for ${asset.assetId}: ${layer}`);
    }
    if (/<image\b/.test(svg)) throw new Error(`Raster image embedded in SVG layer for ${asset.assetId}: ${layer}`);
    for (const [, reference] of svg.matchAll(/<use\b[^>]*href="([^"]+)"/g)) {
      const target = reference.split('#', 1)[0];
      if (target && !existsSync(resolve(dirname(output), target))) {
        throw new Error(`Missing linked SVG layer for ${asset.assetId}: ${layer} -> ${reference}`);
      }
    }
  }
}
for (const portrait of manifest.characterArt ?? []) {
  const source = resolve(repo, portrait.source);
  const output = resolve(repo, 'frontend/public' + portrait.src);
  if (!existsSync(source)) throw new Error('Missing character artwork ' + portrait.id);
  if (portrait.referenceSource && !existsSync(resolve(repo, portrait.referenceSource))) {
    throw new Error('Missing character concept reference: ' + portrait.referenceSource);
  }
  const svg = readFileSync(source, 'utf8');
  const box = svg.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
  if (!box || box[2] !== portrait.canvas.width || box[3] !== portrait.canvas.height || /<image\b/.test(svg))
    throw new Error('Invalid SVG portrait art: ' + portrait.id);
  mkdirSync(dirname(output), { recursive: true });
  copyFileSync(source, output);
}
for (const illustration of [...(manifest.itemArt ?? []), ...(manifest.unitArt ?? [])]) {
  const source = resolve(repo, illustration.source);
  const output = resolve(repo, 'frontend/public' + illustration.src);
  if (!existsSync(source)) throw new Error(`Missing illustration master for ${illustration.assetId}: ${illustration.source}`);
  if (illustration.referenceSource && !existsSync(resolve(repo, illustration.referenceSource))) {
    throw new Error(`Missing concept reference for ${illustration.assetId}: ${illustration.referenceSource}`);
  }
  const svg = readFileSync(source, 'utf8');
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
  if (!viewBox || viewBox.length !== 4 || viewBox[2] !== illustration.canvas.width
    || viewBox[3] !== illustration.canvas.height || /<image\b/.test(svg)) {
    throw new Error(`Invalid standalone SVG illustration: ${illustration.assetId}`);
  }
  mkdirSync(dirname(output), { recursive: true });
  copyFileSync(source, output);
}
mkdirSync(dirname(publicManifest), { recursive: true });
copyFileSync(manifestPath, publicManifest);
console.log(`Validated ${manifest.assets.length} structure assets, ${(manifest.itemArt ?? []).length} item illustrations, and ${(manifest.unitArt ?? []).length} unit illustrations.`);
