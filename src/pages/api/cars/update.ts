import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../../lib/db';
import { isAuthed } from '../../../lib/auth';
import { carFormSchema } from '../../../lib/db/schema';
import { uploadImage, deleteImage } from '../../../lib/s3';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!isAuthed(cookies)) return redirect('/admin');

  const form = await request.formData();
  const id = Number(form.get('id'));
  if (!Number.isInteger(id) || id <= 0) return redirect('/admin');

  const rows = await db.select().from(schema.cars).where(eq(schema.cars.id, id)).limit(1);
  const existing = rows[0];
  if (!existing) return redirect('/admin');

  const parsed = carFormSchema.safeParse({
    title: form.get('title'),
    brand: form.get('brand'),
    pricePerDay: form.get('pricePerDay'),
    seats: form.get('seats') || undefined,
    transmission: form.get('transmission') || undefined,
    fuel: form.get('fuel'),
    description: form.get('description'),
  });

  if (!parsed.success) {
    return redirect(`/admin/edit/${id}?error=validation`);
  }
  const data = parsed.data;

  const values: Partial<typeof schema.cars.$inferInsert> = {
    title: data.title,
    brand: data.brand || null,
    pricePerDay: String(data.pricePerDay),
    seats: data.seats ?? null,
    transmission: data.transmission ?? null,
    fuel: data.fuel || null,
    description: data.description || null,
  };

  const image = form.get('image');
  const removePhoto = form.get('removePhoto') === '1';

  if (image instanceof File && image.size > 0) {
    // New photo replaces the old one.
    const uploaded = await uploadImage(image);
    values.imageUrl = uploaded.url;
    values.imageKey = uploaded.key;
    await deleteImage(existing.imageKey);
  } else if (removePhoto) {
    values.imageUrl = null;
    values.imageKey = null;
    await deleteImage(existing.imageKey);
  }
  // otherwise: leave image columns untouched

  await db.update(schema.cars).set(values).where(eq(schema.cars.id, id));

  return redirect('/admin?ok=1');
};
