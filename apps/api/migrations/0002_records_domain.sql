CREATE TYPE "public"."source_type" AS ENUM('WALLET', 'BUDGET');--> statement-breakpoint
ALTER TYPE "public"."record_type" ADD VALUE IF NOT EXISTS 'DEBT';--> statement-breakpoint
ALTER TYPE "public"."record_type" ADD VALUE IF NOT EXISTS 'DEBT_REPAYMENT';--> statement-breakpoint
ALTER TYPE "public"."record_type" ADD VALUE IF NOT EXISTS 'LOAN';--> statement-breakpoint
ALTER TYPE "public"."record_type" ADD VALUE IF NOT EXISTS 'LOAN_COLLECTION';--> statement-breakpoint
ALTER TABLE "record" ADD COLUMN "source_id" text;--> statement-breakpoint
ALTER TABLE "record" ADD COLUMN "source_type" "public"."source_type";--> statement-breakpoint
ALTER TABLE "record" ADD COLUMN "record_type" "public"."record_type";--> statement-breakpoint
ALTER TABLE "record" ADD COLUMN "recorded_at" timestamp;--> statement-breakpoint
UPDATE "record" SET
  "source_id" = "wallet_id",
  "source_type" = 'WALLET',
  "record_type" = "type",
  "recorded_at" = "date",
  "note" = COALESCE("note", "category")
WHERE "source_id" IS NULL;--> statement-breakpoint
ALTER TABLE "record" ALTER COLUMN "source_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "record" ALTER COLUMN "source_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "record" ALTER COLUMN "record_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "record" ALTER COLUMN "recorded_at" SET NOT NULL;--> statement-breakpoint
CREATE TABLE "record_item" (
	"id" text PRIMARY KEY NOT NULL,
	"record_id" text NOT NULL,
	"note" text,
	"amount" numeric(19,4) NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);--> statement-breakpoint
INSERT INTO "record_item" ("id", "record_id", "note", "amount", "created_at", "updated_at")
SELECT
  "id" || '-item',
  "id",
  COALESCE("note", "category"),
  "amount",
  "created_at",
  "updated_at"
FROM "record";--> statement-breakpoint
ALTER TABLE "record_item" ADD CONSTRAINT "record_item_record_id_record_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."record"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record" DROP CONSTRAINT "record_wallet_id_wallet_id_fk";--> statement-breakpoint
DROP INDEX "record_wallet_id_idx";--> statement-breakpoint
DROP INDEX "record_date_idx";--> statement-breakpoint
ALTER TABLE "record" DROP COLUMN "wallet_id";--> statement-breakpoint
ALTER TABLE "record" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "record" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "record" DROP COLUMN "date";--> statement-breakpoint
CREATE INDEX "record_source_lookup_idx" ON "record" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "record_source_date_idx" ON "record" USING btree ("source_id","recorded_at");--> statement-breakpoint
CREATE INDEX "record_item_record_id_idx" ON "record_item" USING btree ("record_id");
