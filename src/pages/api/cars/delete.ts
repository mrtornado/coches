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
  if (!car) return redirect('/admin');

  // Collect every S3 object for this car (gallery + legacy cover), de-duped
  const images = await db
    .select({ key: schema.carImages.key })
    .from(schema.carImages)
    .where(eq(schema.carImages.carId, id));
  const keys = new Set<string>();
  for (const img of images) if (img.key) keys.add(img.key);
  if (car.imageKey) keys.add(car.imageKey);

  // Delete the car first (cascades car_images rows), then the objects
  await db.delete(schema.cars).where(eq(schema.cars.id, id));
  for (const key of keys) {
    await deleteImage(key);
  }

  return redirect('/admin');
};
