import * as z from "zod";

export const putDriveLedgerSchema = z.object({
  content: z.any(),
});

export type PutDriveLedgerInput = z.infer<typeof putDriveLedgerSchema>;
