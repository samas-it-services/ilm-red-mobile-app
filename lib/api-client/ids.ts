// COPIED from ilm-red-unbound/packages/api-client by scripts/sync-api-client.mjs. Do not edit here.
// Opaque public ids (book_…, user_…): the same encoding as api/dto.ts encodeId, so a screen that
// still holds a database uuid can address the API without the server ever accepting raw uuids.
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PublicIdKind = 'book' | 'user' | 'club' | 'post' | 'rp' | 'note';

/** uuid → public id, e.g. publicId('book', '4c02cd06-…') === 'book_2JQhCiD0cajYhoz3t0Q5bw'. */
export function publicId(kind: PublicIdKind, uuid: string): string {
  if (!UUID_RE.test(uuid)) throw new Error('not a uuid');
  let n = BigInt('0x' + uuid.replace(/-/g, ''));
  let out = '';
  while (n > 0n) { out = ALPHABET[Number(n % 62n)] + out; n /= 62n; }
  return `${kind}_${out || '0'}`;
}

/** public id → uuid (the inverse of publicId). Throws for the wrong kind. */
export function uuidOf(kind: PublicIdKind, id: string): string {
  const prefix = `${kind}_`;
  if (typeof id !== 'string' || !id.startsWith(prefix)) throw new Error('bad id');
  let n = 0n;
  for (const ch of id.slice(prefix.length)) {
    const d = ALPHABET.indexOf(ch);
    if (d < 0) throw new Error('bad id');
    n = n * 62n + BigInt(d);
  }
  const hex = n.toString(16).padStart(32, '0');
  const uuid = [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
  if (!UUID_RE.test(uuid)) throw new Error('bad id');
  return uuid;
}
