import { z } from "zod";

export const ServiceResponsePaginationMetaSchema = z.object({
  total_records: z.number().int(),
  current_page: z.number().int(),
  total_pages: z.number().int(),
  next_page: z.number().int().nullable(),
  prev_page: z.number().int().nullable(),
});

export type ServicePaginationMeta = z.infer<typeof ServiceResponsePaginationMetaSchema>;

export const ServiceResponseMetaSchema = z.object({
  meta: z
    .object({
      pagination: ServiceResponsePaginationMetaSchema.optional(),
    })
    .optional(),
});

export type ServiceResponseMeta = z.infer<typeof ServiceResponseMetaSchema>;

export const BaseServiceResponseSchema = z
  .object({ message: z.string() })
  .merge(ServiceResponseMetaSchema);

export type BaseServiceResponse = z.infer<typeof BaseServiceResponseSchema>;

export type ServiceResponse<TData> = { data: TData } & BaseServiceResponse;
