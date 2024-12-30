import { z } from "zod";
import { APIResponseSchema } from "@/schemas/api.schema";

export const SettingsSchema = z.object({
  currency: z.string({ required_error: "Currency is required" }),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const SettingsResponseSchema = APIResponseSchema({
  schema: SettingsSchema.optional(),
});
