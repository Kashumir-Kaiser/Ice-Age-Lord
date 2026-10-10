import { createHash } from 'node:crypto';
import { stableStringify, sha256 } from '../../content/src/compiler.ts';

const TWO_TO_64 = 1n << 64n;
const MAX_UINT64 = TWO_TO_64 - 1n;

function canonicalFieldBytes(fields: readonly string[]): Uint8Array {
  const parts: Buffer[] = [];
  for (const field of fields) {
    const bytes = Buffer.from(field.normalize('NFC'), 'utf8');
    if (BigInt(bytes.length) > MAX_UINT64) throw new Error('HASH_FIELD_TOO_LONG');
    const length = Buffer.alloc(8);
    length.writeBigUInt64BE(BigInt(bytes.length));
    parts.push(length, bytes);
  }
  return Buffer.concat(parts);
}

export function hash64(fields: readonly string[]): bigint {
  const digest = createHash('sha256').update(canonicalFieldBytes(fields)).digest();
  return digest.readBigUInt64BE(0);
}

export function randomIntFromFields(seedFields: readonly string[], low: number, high: number): { value: number; draws: number } {
  if (!Number.isSafeInteger(low) || !Number.isSafeInteger(high) || low > high) throw new Error('RANDOM_INT_RANGE_INVALID');
  const width = BigInt(high - low + 1);
  const limit = (TWO_TO_64 / width) * width;
  for (let draw = 0; ; draw++) {
    const value = hash64([...seedFields, 'DRAW', String(draw)]);
    if (value < limit) return { value: low + Number(value % width), draws: draw + 1 };
  }
}

export function canonicalStateHash(value: unknown): string {
  return sha256(stableStringify(value));
}
