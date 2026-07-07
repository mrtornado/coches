import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../../lib/db';
import { bookingFormSchema } from '../../../lib/db/schema';
import { sendBookingEmail } from '../../../lib/mailer';

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

  const lang = form.get('lang') === 'en' ? 'en' : 'es';
  const prefix = lang === 'en' ? '/en' : '';

  if (!parsed.success) {
    const carId = Number(form.get('carId'));
    return redirect(Number.isInteger(carId) ? `${prefix}/car/${carId}?error=1` : `${prefix}/`);
  }
  const data = parsed.data;

  await db.insert(schema.bookings).values({
    carId: data.carId,
    name: data.name,
    phone: data.phone,
    email: data.email,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    message: data.message || null,
  });

  // Notify the business by email (best-effort — never blocks the booking).
  const carRows = await db
    .select({ title: schema.cars.title })
    .from(schema.cars)
    .where(eq(schema.cars.id, data.carId))
    .limit(1);
  await sendBookingEmail({
    carTitle: carRows[0]?.title ?? `#${data.carId}`,
    carId: data.carId,
    name: data.name,
    phone: data.phone,
    email: data.email,
    startDate: data.startDate,
    endDate: data.endDate,
    message: data.message,
  });

  return redirect(`${prefix}/car/${data.carId}?ok=1`);
};
