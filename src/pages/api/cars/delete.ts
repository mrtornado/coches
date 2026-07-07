import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../../lib/db';
import { isAuthed } from '../../../lib/auth';
import { deleteImage } from '../../../lib/s3';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!isAuthed(cookies)) return redirect('/admin');

  const form = await request.formData();
  const id = Number(form.get('id'));
  if (!Number.isInteger(id) || id <= 0) return redirect('/admin');

  const rows = await db.select().from(schema.cars).where(eq(schema.cars.id, id)).limit(1);
  const car = rows[0];
  if (car) {
    await db.delete(schema.cars).where(eq(schema.cars.id, id));
    await deleteImage(car.imageKey);
  }

  return redirect('/admin');
};
