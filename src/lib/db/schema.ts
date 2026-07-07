import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const cars = pgTable('cars', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  brand: text('brand'),
  pricePerDay: numeric('price_per_day', { precision: 10, scale: 2 }).notNull(),
  seats: integer('seats'),
  transmission: text('transmission'),
  fuel: text('fuel'),
  kmUnlimited: boolean('km_unlimited').notNull().default(true),
  kmPerDay: integer('km_per_day'),
  description: text('description'),
  descriptionEn: text('description_en'),
  imageUrl: text('image_url'),
  imageKey: text('image_key'),
  available: boolean('available').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const carImages = pgTable('car_images', {
  id: serial('id').primaryKey(),
  carId: integer('car_id')
    .notNull()
    .references(() => cars.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  key: text('key'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  carId: integer('car_id').references(() => cars.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  message: text('message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Car = typeof cars.$inferSelect;
export type CarImage = typeof carImages.$inferSelect;
export type Booking = typeof bookings.$inferSelect;

// --- Validation (drizzle-zod base + form-friendly coercion) ---
const carInsert = createInsertSchema(cars);

export const carFormSchema = carInsert
  .pick({ title: true, brand: true, fuel: true, description: true, descriptionEn: true })
  .extend({
    title: z.string().trim().min(1, 'El título es obligatorio'),
    pricePerDay: z.coerce.number().positive('El precio debe ser mayor que 0'),
    seats: z.coerce.number().int().positive().max(99).optional(),
    transmission: z.enum(['Manual', 'Automático']).optional(),
    kmUnlimited: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),
    kmPerDay: z.coerce.number().int().positive().max(100000).optional(),
  });

export type CarFormInput = z.infer<typeof carFormSchema>;

export const bookingFormSchema = z.object({
  carId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  phone: z.string().trim().min(3, 'El teléfono es obligatorio'),
  email: z.string().email().optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  message: z.string().optional().or(z.literal('')),
});
