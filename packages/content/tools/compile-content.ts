import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compileContent, stableStringify } from '../src/compiler.ts';

const root = process.cwd();
const { manifest, world } = compileContent(root);
const output = resolve(root, 'packages/content/generated');
mkdirSync(output, { recursive: true });
writeFileSync(resolve(output, 'content-manifest.json'), `${stableStringify(manifest)}\n`, 'utf8');
writeFileSync(resolve(output, 'world-package-ll01.json'), `${stableStringify(world)}\n`, 'utf8');
process.stdout.write(`Compiled ${world.sites.length} sites, ${world.fieldChests.length} chests, ${world.lairs.length} lairs, ${world.lairUnits.length} fixed lair units and ${world.eventSchedule.length} scheduled events.\n`);
