import { z } from "zod";

export const SettingsSchema = z.object({
  currency: z.string({ required_error: "Currency is required" }),
});

export type Settings = z.infer<typeof SettingsSchema>;
