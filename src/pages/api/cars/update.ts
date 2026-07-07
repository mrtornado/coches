import type { APIRoute } from 'astro';
import { and, asc, eq, inArray } from 'drizzle-orm';
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
    kmUnlimited: form.get('kmUnlimited') || undefined,
    kmPerDay: form.get('kmPerDay') || undefined,
    description: form.get('description'),
  });

  if (!parsed.success) {
    return redirect(`/admin/edit/${id}?error=validation`);
  }
  const data = parsed.data;

  // 1. Delete the photos the admin removed
  const deleteIds = form
    .getAll('deleteImageIds')
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n));
  if (deleteIds.length > 0) {
    const toDelete = await db
      .select()
      .from(schema.carImages)
      .where(and(eq(schema.carImages.carId, id), inArray(schema.carImages.id, deleteIds)));
    for (const img of toDelete) {
      await deleteImage(img.key);
    }
    if (toDelete.length > 0) {
      await db
        .delete(schema.carImages)
        .where(and(eq(schema.carImages.carId, id), inArray(schema.carImages.id, deleteIds)));
    }
  }

  // 2. Upload and append any new photos
  const files = form.getAll('image').filter((f): f is File => f instanceof File && f.size > 0);
  const uploaded: { url: string; key: string }[] = [];
  if (files.length > 0) {
    const current = await db
      .select({ position: schema.carImages.position })
      .from(schema.carImages)
      .where(eq(schema.carImages.carId, id));
    let maxPos = current.reduce((m, r) => Math.max(m, r.position), -1);
    for (const file of files) {
      uploaded.push(await uploadImage(file));
    }
    await db.insert(schema.carImages).values(
      uploaded.map((img, i) => ({
        carId: id,
        url: img.url,
        key: img.key,
        position: maxPos + 1 + i,
      })),
    );
  }

  // 3. Apply the admin's cover choice, then recompute the cover
  const imgRows = await db
    .select()
    .from(schema.carImages)
    .where(eq(schema.carImages.carId, id))
    .orderBy(asc(schema.carImages.position), asc(schema.carImages.id));

  let coverRow = imgRows[0] ?? null;
  const coverImageId = Number(form.get('coverImageId'));
  const coverNewIndex = Number(form.get('coverNewIndex'));
  if (Number.isInteger(coverImageId) && coverImageId > 0) {
    coverRow = imgRows.find((r) => r.id === coverImageId) ?? coverRow;
  } else if (Number.isInteger(coverNewIndex) && coverNewIndex >= 0 && coverNewIndex < uploaded.length) {
    const key = uploaded[coverNewIndex].key;
    coverRow = imgRows.find((r) => r.key === key) ?? coverRow;
  }

  // Reorder so the cover is first (position 0), persisting only changed positions
  if (coverRow) {
    const ordered = [coverRow, ...imgRows.filter((r) => r.id !== coverRow!.id)];
    for (let i = 0; i < ordered.length; i++) {
      if (ordered[i].position !== i) {
        await db.update(schema.carImages).set({ position: i }).where(eq(schema.carImages.id, ordered[i].id));
      }
    }
  }

  const cover = coverRow;

  await db
    .update(schema.cars)
    .set({
      title: data.title,
      brand: data.brand || null,
      pricePerDay: String(data.pricePerDay),
      seats: data.seats ?? null,
      transmission: data.transmission ?? null,
      fuel: data.fuel || null,
      kmUnlimited: data.kmUnlimited,
      kmPerDay: data.kmUnlimited ? null : (data.kmPerDay ?? null),
      description: data.description || null,
      imageUrl: cover?.url ?? null,
      imageKey: cover?.key ?? null,
    })
    .where(eq(schema.cars.id, id));

  return redirect('/admin?ok=1');
};
