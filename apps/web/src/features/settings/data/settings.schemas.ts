import { currencyCodeBodySchema } from "@kaget/api/schemas";
import type { InferResponseType } from "hono/client";
import type { z } from "zod";
import { api } from "@/libs/api.lib";

export type Settings = InferResponseType<typeof api.api.settings.$get, 200>["data"];

export { currencyCodeBodySchema };

export type CreateSettings = z.infer<typeof currencyCodeBodySchema>;
export type UpdateSettings = z.infer<typeof currencyCodeBodySchema>;
