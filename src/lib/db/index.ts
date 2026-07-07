import 'dotenv/config'; // load .env into process.env (no-op in prod where env is injected by the host)
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

// Reuse a single pool across HMR reloads / module re-imports.
const globalForDb = globalThis as unknown as { __pool?: pg.Pool };

export const pool =
  globalForDb.__pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
  });

globalForDb.__pool = pool;

export const db = drizzle(pool, { schema });
export { schema };
