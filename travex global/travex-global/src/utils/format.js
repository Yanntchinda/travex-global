import { CURRENCY } from '../config';

// "2026-11-06" -> "06.11.2026"
export function isoToFr(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-');
  return `${d}.${m}.${y}`;
}

// "06.11.2026" (ou 06/11/2026, 6-11-2026) -> "2026-11-06" ; null si invalide
export function frToIso(input) {
  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(String(input || '').trim());
  if (!m) return null;
  const d = m[1].padStart(2, '0');
  const mo = m[2].padStart(2, '0');
  const iso = `${m[3]}-${mo}-${d}`;
  const dt = new Date(`${iso}T00:00:00`);
  if (isNaN(dt.getTime()) || dt.getDate() !== Number(m[1]) || dt.getMonth() + 1 !== Number(m[2])) return null;
  return iso;
}

export function money(value) {
  const n = Number(value) || 0;
  const s = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `${s} ${CURRENCY}`;
}

export function kg(value) {
  const n = Number(value) || 0;
  return Number.isInteger(n) ? `${n}` : n.toFixed(1);
}
