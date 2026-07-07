import type { APIRoute } from 'astro';
import { db, schema } from '../../../lib/db';
import { bookingFormSchema } from '../../../lib/db/schema';

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const parsed = bookingFormSchema.safeParse({
    carId: form.get('carId'),
    name: form.get('name'),
    phone: form.get('phone'),
    email: form.get('email'),
    startDate: form.get('startDate'),
    endDate: form.get('endDate'),
    message: form.get('message'),
  });

  if (!parsed.success) {
    const carId = Number(form.get('carId'));
    return redirect(Number.isInteger(carId) ? `/car/${carId}?error=1` : '/');
  }
  const data = parsed.data;

  await db.insert(schema.bookings).values({
    carId: data.carId,
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    message: data.message || null,
  });

  return redirect(`/car/${data.carId}?ok=1`);
};
