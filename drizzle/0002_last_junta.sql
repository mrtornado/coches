ALTER TABLE "cars" ADD COLUMN "km_unlimited" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "km_per_day" integer;