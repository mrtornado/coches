import { defineMiddleware } from 'astro:middleware';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './lib/db';

// Run migrations once, lazily, on the first request. Guarded so it only
// runs a single time per process; failures allow a retry on the next request.
let migrationPromise: Promise<void> | null = null;

function ensureMigrations(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = migrate(db, { migrationsFolder: './drizzle' }).catch((err) => {
      migrationPromise = null;
      throw err;
    });
  }
  return migrationPromise;
}

export const onRequest = defineMiddleware(async (_context, next) => {
  await ensureMigrations();
  return next();
});
