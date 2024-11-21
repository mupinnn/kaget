import { http } from "msw";
import { CreateWalletSchema } from "@/features/wallets/data/wallets.schema";
import { mockErrorResponse, mockSuccessResponse } from "@/utils/mock.util";

export const walletsHandler = [
  http.post("/api/v1/wallets", async ({ request }) => {
    try {
      const data = CreateWalletSchema.parse(await request.json());
      return mockSuccessResponse({ data, message: "Successfully create a wallet" });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),
];
