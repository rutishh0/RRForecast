export const DEFAULT_ROOM = 'TRENT';
const ROOM_RE = /^[A-Z0-9]{2,10}$/;

/** Room codes are short, upper-case alphanumerics; anything else falls back to the default room. */
export function normaliseRoomCode(raw: unknown): string {
  const code = String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);
  return ROOM_RE.test(code) ? code : DEFAULT_ROOM;
}
