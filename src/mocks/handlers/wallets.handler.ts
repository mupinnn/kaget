import { http, HttpResponse } from "msw";

export const walletsHandler = [
  http.get("/wallets", () => {
    return HttpResponse.json({
      message: "Wallets retrieved",
      data: [
        {
          id: "18xjjx",
          name: "DompetKu",
          digital_balance: 1000000,
          cash_balance: 0,
          deleted_at: null,
        },
      ],
    });
  }),
];
