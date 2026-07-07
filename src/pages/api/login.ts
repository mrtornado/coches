import type { APIRoute } from 'astro';
import { checkPassword, makeSession, AUTH_COOKIE } from '../../lib/auth';
import { checkLockout, recordFailure, recordSuccess } from '../../lib/rateLimit';

function getIp(ctx: Parameters<APIRoute>[0]): string {
  // Astro derives clientAddress from trusted x-forwarded-* (see security.allowedDomains).
  return (
    ctx.clientAddress ||
    ctx.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export const POST: APIRoute = async (ctx) => {
  const { request, cookies, redirect } = ctx;
  const ip = getIp(ctx);

  // Blocked? Reject before even reading the password.
  const lock = checkLockout(ip);
  if (lock.locked) {
    return redirect(`/admin?locked=${Math.ceil(lock.retryAfterMs / 60000)}`);
  }

  const form = await request.formData();
  const password = String(form.get('password') || '');

  if (!checkPassword(password)) {
    const res = recordFailure(ip);
    if (res.locked) {
      return redirect(`/admin?locked=${Math.ceil(res.retryAfterMs / 60000)}`);
    }
    return redirect('/admin?error=1');
  }

  recordSuccess(ip);
  cookies.set(AUTH_COOKIE, makeSession(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: import.meta.env.PROD,
    maxAge: 60 * 60 * 24 * 7,
  });

  return redirect('/admin');
};
