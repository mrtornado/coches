CREATE TABLE "car_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"car_id" integer NOT NULL,
	"url" text NOT NULL,
	"key" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "car_images" ADD CONSTRAINT "car_images_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "car_images" ("car_id", "url", "key", "position")
SELECT "id", "image_url", "image_key", 0 FROM "cars" WHERE "image_url" IS NOT NULL;