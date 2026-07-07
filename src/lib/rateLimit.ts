// Simple in-memory login rate limiter / IP lockout.
// Effective against brute force on a single-instance deployment.
// Config via env: LOGIN_MAX_ATTEMPTS (default 5), LOGIN_LOCK_MINUTES (default 120).

const MAX_ATTEMPTS = Math.max(1, Number(process.env.LOGIN_MAX_ATTEMPTS) || 5);
const LOCK_MS = (Math.max(1, Number(process.env.LOGIN_LOCK_MINUTES) || 120)) * 60_000;
// A failed-attempt counter resets if the IP is quiet for this long.
const WINDOW_MS = LOCK_MS;

interface Entry {
  count: number;
  lockedUntil: number;
  updatedAt: number;
}

const g = globalThis as unknown as { __loginAttempts?: Map<string, Entry> };
const attempts = g.__loginAttempts ?? new Map<string, Entry>();
g.__loginAttempts = attempts;

function prune(now: number): void {
  if (attempts.size < 1000) return;
  for (const [ip, e] of attempts) {
    if (e.lockedUntil < now && now - e.updatedAt > WINDOW_MS) attempts.delete(ip);
  }
}

export interface LockState {
  locked: boolean;
  retryAfterMs: number;
}

/** Is this IP currently locked out? (does not mutate state) */
export function checkLockout(ip: string): LockState {
  const now = Date.now();
  const e = attempts.get(ip);
  if (e && e.lockedUntil > now) {
    return { locked: true, retryAfterMs: e.lockedUntil - now };
  }
  return { locked: false, retryAfterMs: 0 };
}

/** Record a failed attempt; returns whether the IP is now locked. */
export function recordFailure(ip: string): LockState {
  const now = Date.now();
  prune(now);
  let e = attempts.get(ip);
  // Start a fresh window if none, or if the previous one has fully expired.
  if (!e || (e.lockedUntil < now && now - e.updatedAt > WINDOW_MS)) {
    e = { count: 0, lockedUntil: 0, updatedAt: now };
  }
  e.count += 1;
  e.updatedAt = now;
  if (e.count >= MAX_ATTEMPTS) {
    e.lockedUntil = now + LOCK_MS;
  }
  attempts.set(ip, e);
  return { locked: e.lockedUntil > now, retryAfterMs: Math.max(0, e.lockedUntil - now) };
}

/** Successful login — clear the IP's failure record. */
export function recordSuccess(ip: string): void {
  attempts.delete(ip);
}

export const rateLimitConfig = { maxAttempts: MAX_ATTEMPTS, lockMinutes: LOCK_MS / 60_000 };
