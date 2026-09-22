import { Pool } from '@neondatabase/serverless';
import { GameState } from '@/lib/types';
import { applyTimeout, createInitialGameState, timerExpired, withDerived } from '@/lib/gameLogic';
export { normaliseRoomCode, DEFAULT_ROOM } from '@/lib/room';

/**
 * Authoritative game state lives in one Postgres row per room (Neon).
 *
 * Throughput matters more than anything here: 100 phones tap within the same
 * second, and every tap is a read-modify-write of the same row. So:
 *
 *  1. Mutations are queued per room inside this process and applied as ONE
 *     batch per database round-trip. A burst of 100 taps becomes ~1 write.
 *  2. Writes are optimistic — `UPDATE … WHERE version = $expected`. If another
 *     server instance won the race the batch is re-applied on the fresh row.
 *     No row lock is ever held across a network round-trip.
 *  3. Reads are served from a short-lived in-process cache so 100 polling
 *     phones don't turn into 100 SELECTs per second per instance.
 *
 * Without DATABASE_URL (local hacking) everything stays in process memory.
 */

type Mutator = (state: GameState, now: number) => void;

interface Backend {
  read(code: string): Promise<GameState | null>;
  insert(state: GameState): Promise<void>;
  /** Returns false if the row's version no longer matches `expectedVersion`. */
  writeIfVersion(state: GameState, expectedVersion: number): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Backends
// ---------------------------------------------------------------------------

class PgBackend implements Backend {
  private pool: Pool;
  private schema?: Promise<void>;

  constructor(url: string) {
    this.pool = new Pool({ connectionString: url, max: 4 });
  }

  private ensureSchema(): Promise<void> {
    if (!this.schema) {
      this.schema = this.pool
        .query(
          `CREATE TABLE IF NOT EXISTS rooms (
             code TEXT PRIMARY KEY,
             state JSONB NOT NULL,
             version BIGINT NOT NULL DEFAULT 0,
             updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
           )`,
        )
        .then(() => undefined)
        .catch(err => {
          this.schema = undefined;
          throw err;
        });
    }
    return this.schema;
  }

  async read(code: string): Promise<GameState | null> {
    await this.ensureSchema();
    const { rows } = await this.pool.query('SELECT state FROM rooms WHERE code = $1', [code]);
    return rows[0] ? (rows[0].state as GameState) : null;
  }

  async insert(state: GameState): Promise<void> {
    await this.ensureSchema();
    await this.pool.query('INSERT INTO rooms (code, state, version) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING', [
      state.roomCode,
      JSON.stringify(state),
      state.version,
    ]);
  }

  async writeIfVersion(state: GameState, expectedVersion: number): Promise<boolean> {
    await this.ensureSchema();
    const { rowCount } = await this.pool.query(
      'UPDATE rooms SET state = $2, version = $3, updated_at = now() WHERE code = $1 AND version = $4',
      [state.roomCode, JSON.stringify(state), state.version, expectedVersion],
    );
    return (rowCount ?? 0) === 1;
  }
}

class MemoryBackend implements Backend {
  private rooms = new Map<string, GameState>();
  async read(code: string) {
    const s = this.rooms.get(code);
    return s ? structuredClone(s) : null;
  }
  async insert(state: GameState) {
    if (!this.rooms.has(state.roomCode)) this.rooms.set(state.roomCode, structuredClone(state));
  }
  async writeIfVersion(state: GameState, expectedVersion: number) {
    const cur = this.rooms.get(state.roomCode);
    if (!cur || cur.version !== expectedVersion) return false;
    this.rooms.set(state.roomCode, structuredClone(state));
    return true;
  }
}

// ---------------------------------------------------------------------------
// Per-room worker: batching + optimistic concurrency
// ---------------------------------------------------------------------------

const READ_CACHE_MS = 300;
const MAX_RETRIES = 6;

interface Pending {
  mutate: Mutator;
  resolve: (s: GameState) => void;
  reject: (e: unknown) => void;
}

class RoomWorker {
  private cache: GameState | null = null;
  private cachedAt = 0;
  private queue: Pending[] = [];
  private draining = false;

  constructor(
    private code: string,
    private backend: Backend,
  ) {}

  /** Latest known state, refreshed from the backend when the cache is stale. */
  async read(): Promise<GameState> {
    if (this.cache && Date.now() - this.cachedAt < READ_CACHE_MS) return this.cache;
    return this.refresh();
  }

  private async refresh(): Promise<GameState> {
    let state = await this.backend.read(this.code);
    if (!state) {
      state = createInitialGameState(this.code);
      await this.backend.insert(state);
      state = (await this.backend.read(this.code)) ?? state;
    }
    this.cache = state;
    this.cachedAt = Date.now();
    return state;
  }

  mutate(mutate: Mutator): Promise<GameState> {
    return new Promise<GameState>((resolve, reject) => {
      this.queue.push({ mutate, resolve, reject });
      if (!this.draining) void this.drain();
    });
  }

  private async drain() {
    this.draining = true;
    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0);
        try {
          const state = await this.commitBatch(batch);
          for (const p of batch) p.resolve(state); // already-rejected promises ignore this
        } catch (err) {
          for (const p of batch) p.reject(err);
        }
      }
    } finally {
      this.draining = false;
    }
  }

  private async commitBatch(batch: Pending[]): Promise<GameState> {
    let base = this.cache ?? (await this.refresh());
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const state = structuredClone(base);
      const now = Date.now();
      applyTimeout(state, now);
      const failed = new Map<Pending, unknown>();
      for (const p of batch) {
        try {
          p.mutate(state, now);
        } catch (err) {
          failed.set(p, err); // one bad message must not sink everyone else's
        }
      }
      if (state.version === base.version) state.version++;

      if (await this.backend.writeIfVersion(state, base.version)) {
        this.cache = state;
        this.cachedAt = Date.now();
        for (const [p, err] of failed) p.reject(err);
        return state;
      }
      // Someone else (another instance) wrote first: reload and re-apply the batch.
      this.cache = null;
      base = await this.refresh();
    }
    throw new Error(`Room ${this.code}: could not commit after ${MAX_RETRIES} attempts`);
  }
}

// ---------------------------------------------------------------------------
// Module singletons (survive hot reload / warm serverless invocations)
// ---------------------------------------------------------------------------

const g = globalThis as unknown as { __hhBackend?: Backend; __hhWorkers?: Map<string, RoomWorker> };

function backend(): Backend {
  if (!g.__hhBackend) {
    const url = process.env.DATABASE_URL;
    if (url) g.__hhBackend = new PgBackend(url);
    else {
      console.warn('[half-hands] DATABASE_URL not set — using in-memory room store (single process only).');
      g.__hhBackend = new MemoryBackend();
    }
  }
  return g.__hhBackend;
}

function worker(code: string): RoomWorker {
  if (!g.__hhWorkers) g.__hhWorkers = new Map();
  let w = g.__hhWorkers.get(code);
  if (!w) {
    w = new RoomWorker(code, backend());
    g.__hhWorkers.set(code, w);
  }
  return w;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Read a room. If its timer has run out, perform the auto-advance and return the result. */
export async function readRoom(code: string): Promise<GameState> {
  const w = worker(code);
  let state = await w.read();
  if (timerExpired(state, Date.now())) state = await w.mutate(() => {}); // batch runner applies the timeout
  return withDerived(state, Date.now());
}

/** Apply a mutation atomically (batched with any concurrent ones) and return the resulting state. */
export async function mutateRoom(code: string, mutate: Mutator): Promise<GameState> {
  const state = await worker(code).mutate(mutate);
  return withDerived(state, Date.now());
}
