import { z } from "zod";

export const APIResponseMetaSchema = z.object({
  meta: z
    .object({
      pagination: z
        .object({
          total_records: z.number().int(),
          current_page: z.number().int(),
          total_pages: z.number().int(),
          next_page: z.number().int().nullable(),
          prev_page: z.number().int().nullable(),
        })
        .optional(),
    })
    .optional(),
});
export type APIResponseMeta = z.infer<typeof APIResponseMetaSchema>;

export const BaseAPIResponseSchema = z
  .object({
    message: z.string(),
    data: z.unknown(),
  })
  .merge(APIResponseMetaSchema);
export type BaseAPIResponse = z.infer<typeof BaseAPIResponseSchema>;

type APIResponseSchemaParams<TSchema> = {
  schema: TSchema;
};

export const APIResponseSchema = <TSchema extends z.ZodTypeAny>({
  schema,
}: APIResponseSchemaParams<TSchema>) => {
  return BaseAPIResponseSchema.extend({
    data: schema,
  });
};
