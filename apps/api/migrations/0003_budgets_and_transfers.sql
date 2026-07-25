CREATE TYPE "public"."budget_type" AS ENUM('BUDGET', 'GOAL');--> statement-breakpoint
CREATE TYPE "public"."transfer_type" AS ENUM('INCOMING', 'OUTGOING');--> statement-breakpoint
CREATE TABLE "budget" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"wallet_id" text NOT NULL,
	"balance" numeric(19,4) DEFAULT '0' NOT NULL,
	"total_balance" numeric(19,4) NOT NULL,
	"budget_type" "public"."budget_type" DEFAULT 'BUDGET' NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer" (
	"id" text PRIMARY KEY NOT NULL,
	"note" text,
	"amount" numeric(19,4) NOT NULL,
	"fee" numeric(19,4) DEFAULT '0' NOT NULL,
	"source_id" text NOT NULL,
	"source_type" "public"."source_type" NOT NULL,
	"source_name" text NOT NULL,
	"destination_id" text NOT NULL,
	"destination_type" "public"."source_type" NOT NULL,
	"destination_name" text NOT NULL,
	"type" "public"."transfer_type" NOT NULL,
	"ref_id" text NOT NULL,
	"transferred_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget" ADD CONSTRAINT "budget_wallet_id_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budget_wallet_id_idx" ON "budget" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "transfer_ref_id_idx" ON "transfer" USING btree ("ref_id");--> statement-breakpoint
CREATE INDEX "transfer_source_lookup_idx" ON "transfer" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "transfer_transferred_at_idx" ON "transfer" USING btree ("transferred_at");
