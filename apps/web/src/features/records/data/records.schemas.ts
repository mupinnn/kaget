import { createRecordSchema } from "@kaget/api/schemas";
import type { InferResponseType } from "hono/client";
import { z } from "zod";
import type { Wallet } from "@/features/wallets/data/wallets.schemas";
import { api } from "@/libs/api.lib";

export type ApiRecord = InferResponseType<
  typeof api.api.records.$get,
  200
>["data"]["records"][number];

export type OwnedRecord = InferResponseType<(typeof api.api.records)[":id"]["$get"], 200>["data"];

export type RecordListItem = ApiRecord & {
  sourceName: string;
};

export const RecordsRequestQuerySchema = z.object({
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  source_id: z.string().optional(),
  source_type: z.enum(["WALLET", "BUDGET"]).optional(),
});

export type RecordsRequestQuery = z.infer<typeof RecordsRequestQuerySchema>;

export const CreateRecordFormSchema = z.object({
  note: z.string().trim().optional(),
  amount: z.coerce.number().positive().optional(),
  record_type: z.enum(["INCOME", "EXPENSE"]),
  source: z.custom<Wallet | { id: string; name: string; balance: string | number }>(),
  dor: z.union([z.date(), z.string()]),
  items: z
    .array(
      z.object({
        note: z.string().trim().optional(),
        amount: z.coerce.number().positive(),
      })
    )
    .default([]),
});

export type CreateRecordForm = z.infer<typeof CreateRecordFormSchema>;

export { createRecordSchema };

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
