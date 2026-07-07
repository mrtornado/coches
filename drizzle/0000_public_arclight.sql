CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"car_id" integer,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"start_date" date,
	"end_date" date,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cars" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"brand" text,
	"price_per_day" numeric(10, 2) NOT NULL,
	"seats" integer,
	"transmission" text,
	"fuel" text,
	"description" text,
	"image_url" text,
	"image_key" text,
	"available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE set null ON UPDATE no action;