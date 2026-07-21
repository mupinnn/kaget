import { z } from "zod";

export const ServiceResponsePaginationMetaSchema = z.object({
  total_records: z.number().int(),
  current_page: z.number().int(),
  total_pages: z.number().int(),
  next_page: z.number().int().nullable(),
  prev_page: z.number().int().nullable(),
});

export type ServicePaginationMeta = z.infer<typeof ServiceResponsePaginationMetaSchema>;
