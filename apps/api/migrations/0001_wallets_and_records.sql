CREATE TYPE "public"."wallet_type" AS ENUM('CASH', 'DIGITAL');--> statement-breakpoint
CREATE TYPE "public"."record_type" AS ENUM('INCOME', 'EXPENSE');--> statement-breakpoint
CREATE TABLE "wallet" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"balance" numeric(19,4) DEFAULT '0' NOT NULL,
	"type" "public"."wallet_type" NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "record" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_id" text NOT NULL,
	"type" "public"."record_type" NOT NULL,
	"amount" numeric(19,4) NOT NULL,
	"category" text NOT NULL,
	"note" text,
	"date" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record" ADD CONSTRAINT "record_wallet_id_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wallet_user_id_idx" ON "wallet" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wallet_created_at_idx" ON "wallet" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "record_wallet_id_idx" ON "record" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "record_date_idx" ON "record" USING btree ("date");
