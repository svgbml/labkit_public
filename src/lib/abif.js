/* Een ABIF-bestand (.ab1, .fsa) van een Applied Biosystems-sequencer lezen (S147).
   Opbouw: "ABIF", een versie (int16) en op byte 6 een directory-ingang van 28 bytes die naar de
   tagdirectory wijst. Elke ingang: naam (4 tekens), nummer (int32), elementtype (int16),
   elementgrootte (int16), aantal elementen (int32), datagrootte (int32), data-offset (int32) en
   een handle. Is de data 4 bytes of minder, dan staat ze in het offsetveld zelf. Alles big-endian.
   Applied Biosystems, "ABIF File Format Specification and Sample File Schema" (2009). */

const td = new TextDecoder('utf-8');
const str = (u8) => td.decode(u8).replace(/\0+$/, '');

/* bytes → {tags, get(name, nr), bytes(name, nr), meta} of een Error met een leesbare reden */
export function readAbif(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  if (u8.length < 34 || str(u8.subarray(0, 4)) !== 'ABIF') throw new Error('Geen ABIF-bestand (.ab1 of .fsa).');
  const n = dv.getInt32(18), dirOff = dv.getInt32(26);
  if (dirOff < 0 || dirOff + n * 28 > u8.length) throw new Error('Het ABIF-bestand is afgebroken.');
  const tags = new Map();
  for (let i = 0; i < n; i++) {
    const o = dirOff + i * 28, size = dv.getInt32(o + 16);
    const t = {name: str(u8.subarray(o, o + 4)), nr: dv.getInt32(o + 4), type: dv.getInt16(o + 8),
      esize: dv.getInt16(o + 10), count: dv.getInt32(o + 12), size,
      off: size <= 4 ? o + 20 : dv.getInt32(o + 20)};
    if (t.off >= 0 && t.off + size <= u8.length) tags.set(t.name + t.nr, t);
  }
  const bytes = (name, nr = 1) => { const t = tags.get(name + nr); return t ? u8.subarray(t.off, t.off + t.size) : null; };
  const get = (name, nr = 1) => {
    const t = tags.get(name + nr);
    if (!t) return null;
    const o = t.off, c = t.count;
    const arr = (w, f) => { const a = []; for (let i = 0; i < c; i++) a.push(f(o + i * w)); return c === 1 ? a[0] : a; };
    switch (t.type) {
      case 2: case 19: return str(u8.subarray(o, o + t.size));         // char, cString
      case 18: return str(u8.subarray(o + 1, o + 1 + u8[o]));          // pString: eerste byte is de lengte
      case 1: return c === 1 ? u8[o] : Array.from(u8.subarray(o, o + c));
      case 3: return arr(2, p => dv.getUint16(p));
      case 4: return arr(2, p => dv.getInt16(p));
      case 5: return arr(4, p => dv.getInt32(p));
      case 7: return arr(4, p => dv.getFloat32(p));
      case 8: return arr(8, p => dv.getFloat64(p));
      case 13: return arr(1, p => !!u8[p]);
      case 10: return `${dv.getInt16(o)}-${String(u8[o + 2]).padStart(2, '0')}-${String(u8[o + 3]).padStart(2, '0')}`;
      case 11: return [0, 1, 2].map(k => String(u8[o + k]).padStart(2, '0')).join(':');
      default: return bytes(name, nr);   // thumb, user types: ruwe bytes
    }
  };
  const run = (k) => { const d = get('RUND', k), tm = get('RUNT', k); return d ? d + (tm ? ' ' + tm : '') : ''; };
  const bases = get('PBAS', 2) || get('PBAS', 1) || '';
  const txt = (k) => String(get(k) || '').trim();
  const meta = {sample: txt('SMPL'), well: txt('TUBE'), start: run(1), end: run(2),
    instrument: txt('MCHN'), model: txt('MODL'), dyeSet: txt('DySN'), readLength: bases.length};
  return {version: dv.getInt16(4), tags, get, bytes, meta};
}
