import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../../lib/db';
import { isAuthed } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!isAuthed(cookies)) return redirect('/admin');

  const form = await request.formData();
  const id = Number(form.get('id'));
  if (!Number.isInteger(id) || id <= 0) return redirect('/admin');

  await db.delete(schema.bookings).where(eq(schema.bookings.id, id));

  return redirect('/admin');
};
