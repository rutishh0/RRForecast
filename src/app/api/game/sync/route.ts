import { NextRequest, NextResponse } from 'next/server';
import { mutateRoom, normaliseRoomCode, readRoom } from '@/server/store';
import { reduceClientMessage, reduceHostAction } from '@/lib/gameLogic';
import { ClientMessage, HostAction } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10;

const NO_STORE = { 'Cache-Control': 'no-store' };

/**
 * GET  /api/game/sync?room=TRENT           -> { state, serverTime }
 * POST /api/game/sync  { room, role:'host', action }      (host actions; x-host-key if HOST_KEY is set)
 * POST /api/game/sync  { room, type:'JOIN_GAME' | ... }   (player messages)
 */

export async function GET(req: NextRequest) {
  const room = normaliseRoomCode(req.nextUrl.searchParams.get('room'));
  try {
    const state = await readRoom(room);
    return NextResponse.json({ state, serverTime: Date.now() }, { headers: NO_STORE });
  } catch (err) {
    console.error('GET /api/game/sync failed:', err);
    return NextResponse.json({ error: 'Could not load room.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400, headers: NO_STORE });
  }
  const room = normaliseRoomCode(body.room);

  try {
    // Host action ------------------------------------------------------------
    if (body.role === 'host') {
      const key = process.env.HOST_KEY;
      if (key && req.headers.get('x-host-key') !== key) {
        return NextResponse.json({ error: 'Host key required.' }, { status: 401, headers: NO_STORE });
      }
      const action = body.action as HostAction | undefined;
      if (!action || typeof action.type !== 'string') {
        return NextResponse.json({ error: 'Missing action.' }, { status: 400, headers: NO_STORE });
      }
      const state = await mutateRoom(room, (s, now) => {
        reduceHostAction(s, action, now);
      });
      return NextResponse.json({ state, serverTime: Date.now() }, { headers: NO_STORE });
    }

    // Player message ---------------------------------------------------------
    if (typeof body.type !== 'string') {
      return NextResponse.json({ error: 'Missing message type.' }, { status: 400, headers: NO_STORE });
    }
    const msg = body as unknown as ClientMessage;
    let result: { playerId?: string; error?: string } = {};
    const state = await mutateRoom(room, (s, now) => {
      result = reduceClientMessage(s, msg, now);
    });
    return NextResponse.json({ state, serverTime: Date.now(), ...result }, { headers: NO_STORE });
  } catch (err) {
    console.error('POST /api/game/sync failed:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500, headers: NO_STORE });
  }
}
