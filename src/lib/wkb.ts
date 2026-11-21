/**
 * Parses a PostGIS (E)WKB hex POINT, as PostgREST returns geography/geometry columns,
 * into [lon, lat]. Also accepts GeoJSON points. Returns null for anything else.
 */
export function parseWkbPoint(v: unknown): [number, number] | null {
  if (v && typeof v === 'object' && (v as { type?: string }).type === 'Point') {
    const c = (v as { coordinates?: number[] }).coordinates;
    return c && c.length >= 2 ? [c[0], c[1]] : null;
  }
  if (typeof v !== 'string' || v.length < 42 || !/^[0-9a-fA-F]+$/.test(v)) return null;
  const bytes = new Uint8Array(v.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(v.substr(i * 2, 2), 16);
  const dv = new DataView(bytes.buffer);
  const le = bytes[0] === 1;
  const type = dv.getUint32(1, le);
  if ((type & 0xff) !== 1) return null; // not a POINT
  let off = 5;
  if (type & 0x20000000) off += 4; // EWKB SRID
  if (bytes.length < off + 16) return null;
  const x = dv.getFloat64(off, le);
  const y = dv.getFloat64(off + 8, le);
  return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
}
