CREATE TYPE "public"."debt_loan_type" AS ENUM('DEBT', 'LOAN');--> statement-breakpoint
CREATE TABLE "debt_loan" (
	"id" text PRIMARY KEY NOT NULL,
	"note" text,
	"other_party" text NOT NULL,
	"amount" numeric(19, 4) NOT NULL,
	"type" "public"."debt_loan_type" NOT NULL,
	"source_id" text NOT NULL,
	"source_type" "public"."source_type" NOT NULL,
	"initial_record_id" text NOT NULL,
	"resolved_at" timestamp,
	"resolved_record_id" text,
	"occurred_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "debt_loan" ADD CONSTRAINT "debt_loan_source_id_wallet_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "debt_loan_source_lookup_idx" ON "debt_loan" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "debt_loan_type_idx" ON "debt_loan" USING btree ("type");--> statement-breakpoint
CREATE INDEX "debt_loan_resolved_at_idx" ON "debt_loan" USING btree ("resolved_at");--> statement-breakpoint
CREATE UNIQUE INDEX "debt_loan_initial_record_id_idx" ON "debt_loan" USING btree ("initial_record_id");--> statement-breakpoint
CREATE UNIQUE INDEX "debt_loan_resolved_record_id_idx" ON "debt_loan" USING btree ("resolved_record_id");
