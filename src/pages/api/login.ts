import type { APIRoute } from 'astro';
import { checkPassword, makeSession, AUTH_COOKIE } from '../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const password = String(form.get('password') || '');

  if (!checkPassword(password)) {
    return redirect('/admin?error=1');
  }

  cookies.set(AUTH_COOKIE, makeSession(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: import.meta.env.PROD,
    maxAge: 60 * 60 * 24 * 7,
  });

  return redirect('/admin');
};
