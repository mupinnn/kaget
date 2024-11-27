import { http } from "msw";
import { nanoid } from "nanoid";
import { db } from "@/libs/db.lib";
import { mockSuccessResponse, mockErrorResponse } from "@/utils/mock.util";
import { CreateRecordSchema } from "@/features/records/data/records.schema";

export const recordsHandler = [
  http.post("/api/v1/records", async ({ request }) => {
    try {
      const data = CreateRecordSchema.parse(await request.json());
      return mockSuccessResponse({ data: {}, message: "Successfully create a record" });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),
];
