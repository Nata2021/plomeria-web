/**
 * Convierte el valor de un <input type="datetime-local"> (sin zona) a ISO UTC.
 * Ej: "2025-10-15T14:30" -> "2025-10-15T17:30:00.000Z" (si tu TZ es -03:00)
 */
export function localInputToIsoUtc(localValue?: string): string | undefined {
  if (!localValue) return undefined;
  // El input no trae zona; se interpreta en timezone local del browser
  const local = new Date(localValue);
  if (isNaN(local.getTime())) return undefined;
  // Normalizamos a UTC: sumamos el offset
  const utcMs = local.getTime() - local.getTimezoneOffset() * 60_000;
  return new Date(utcMs).toISOString();
}


/**
 * Convierte una fecha ISO UTC a el string que necesita un <input datetime-local>.
 * Ej: "2025-10-15T17:30:00.000Z" -> "2025-10-15T14:30"
 */
export function isoUtcToLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  // Convertimos a hora local y recortamos a “YYYY-MM-DDTHH:mm”
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
