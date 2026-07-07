import crypto from 'node:crypto';
import type { AstroCookies } from 'astro';

export const AUTH_COOKIE = 'coches_admin';

function secret(): string {
  return process.env.SESSION_SECRET || 'dev-insecure-secret-change-me';
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function sign(value: string): string {
  const mac = crypto.createHmac('sha256', secret()).update(value).digest('hex');
  return `${value}.${mac}`;
}

function verify(signed?: string): boolean {
  if (!signed) return false;
  const idx = signed.lastIndexOf('.');
  if (idx < 0) return false;
  const value = signed.slice(0, idx);
  return timingSafeEqualStr(signed, sign(value));
}

export function checkPassword(pw: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || 'admin';
  return timingSafeEqualStr(pw, expected);
}

export function makeSession(): string {
  return sign(`admin:${Date.now()}`);
}

export function isAuthed(cookies: AstroCookies): boolean {
  return verify(cookies.get(AUTH_COOKIE)?.value);
}
