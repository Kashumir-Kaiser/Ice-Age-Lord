import { copyFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = resolve(repo, 'assets/manifest.json');
const publicManifest = resolve(repo, 'frontend/public/assets/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const sourceFolders = ['buildings', 'items', 'terrain', 'units'];
for (const folder of sourceFolders) {
  if (!existsSync(resolve(repo, `assets/source/${folder}`))) throw new Error(`Missing authoring folder: assets/source/${folder}`);
}
for (const asset of manifest.assets) {
  const source = resolve(repo, asset.source);
  if (!existsSync(source)) throw new Error(`Missing source master for ${asset.assetId}: ${asset.source}`);
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
  }
}
mkdirSync(dirname(publicManifest), { recursive: true });
copyFileSync(manifestPath, publicManifest);
console.log(`Validated ${manifest.assets.length} registered SVG assets.`);
