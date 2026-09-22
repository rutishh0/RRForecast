// One-off: create the rooms table in Neon. Safe to re-run.
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const env = readFileSync('.env.local', 'utf8');
const url = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim();
if (!url) throw new Error('DATABASE_URL missing from .env.local');

const sql = neon(url);
await sql`
  CREATE TABLE IF NOT EXISTS rooms (
    code        TEXT PRIMARY KEY,
    state       JSONB NOT NULL,
    version     BIGINT NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
const rows = await sql`SELECT code, version, updated_at FROM rooms ORDER BY updated_at DESC`;
console.log('rooms table ready. existing rooms:', rows);
