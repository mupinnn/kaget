import { http } from "msw";
import { CreateWalletSchema } from "@/features/wallets/data/wallets.schema";
import { errorResponse, successResponse } from "@/utils/api.util";

export const walletsHandler = [
  http.post("/api/v1/wallets", async ({ request }) => {
    try {
      const data = CreateWalletSchema.parse(await request.json());
      return successResponse({ data, message: "Successfully create a wallet" });
    } catch (error) {
      return errorResponse(error);
    }
  }),
];
