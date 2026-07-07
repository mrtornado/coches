import type { APIRoute } from 'astro';
import { db, schema } from '../../../lib/db';
import { isAuthed } from '../../../lib/auth';
import { carFormSchema } from '../../../lib/db/schema';
import { uploadImage } from '../../../lib/s3';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!isAuthed(cookies)) return redirect('/admin');

  const form = await request.formData();
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
    return redirect('/admin?error=validation');
  }
  const data = parsed.data;

  let imageUrl: string | null = null;
  let imageKey: string | null = null;
  const image = form.get('image');
  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadImage(image);
    imageUrl = uploaded.url;
    imageKey = uploaded.key;
  }

  await db.insert(schema.cars).values({
    title: data.title,
    brand: data.brand || null,
    pricePerDay: String(data.pricePerDay),
    seats: data.seats ?? null,
    transmission: data.transmission ?? null,
    fuel: data.fuel || null,
    description: data.description || null,
    imageUrl,
    imageKey,
  });

  return redirect('/admin?ok=1');
};
