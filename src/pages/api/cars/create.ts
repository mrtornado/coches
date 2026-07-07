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
    kmUnlimited: form.get('kmUnlimited') || undefined,
    kmPerDay: form.get('kmPerDay') || undefined,
    description: form.get('description'),
    descriptionEn: form.get('descriptionEn'),
  });

  if (!parsed.success) {
    return redirect('/admin?error=validation');
  }
  const data = parsed.data;

  // Upload every provided photo
  const files = form.getAll('image').filter((f): f is File => f instanceof File && f.size > 0);
  const uploaded = [];
  for (const file of files) {
    uploaded.push(await uploadImage(file));
  }

  // Which uploaded photo is the cover? (admin can pick; defaults to the first)
  const coverNewIndex = Number(form.get('coverNewIndex'));
  const coverIdx =
    Number.isInteger(coverNewIndex) && coverNewIndex >= 0 && coverNewIndex < uploaded.length
      ? coverNewIndex
      : 0;
  // Order so the chosen cover is first (position 0), keeping the rest in order
  const ordered = uploaded.length > 0 ? [uploaded[coverIdx], ...uploaded.filter((_, i) => i !== coverIdx)] : [];
  const cover = ordered[0] ?? null;

  const [car] = await db
    .insert(schema.cars)
    .values({
      title: data.title,
      brand: data.brand || null,
      pricePerDay: String(data.pricePerDay),
      seats: data.seats ?? null,
      transmission: data.transmission ?? null,
      fuel: data.fuel || null,
      kmUnlimited: data.kmUnlimited,
      kmPerDay: data.kmUnlimited ? null : (data.kmPerDay ?? null),
      description: data.description || null,
      descriptionEn: data.descriptionEn || null,
      imageUrl: cover?.url ?? null,
      imageKey: cover?.key ?? null,
    })
    .returning({ id: schema.cars.id });

  if (ordered.length > 0) {
    await db.insert(schema.carImages).values(
      ordered.map((img, i) => ({
        carId: car.id,
        url: img.url,
        key: img.key,
        position: i,
      })),
    );
  }

  return redirect('/admin?ok=1');
};
