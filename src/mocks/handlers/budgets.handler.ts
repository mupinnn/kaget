import { http, HttpResponse } from "msw";

export const budgetsHandler = [
  http.get("/budgets", () => {
    return HttpResponse.json([
      {
        id: 1,
        name: "Sports",
        limit: 1000,
        used: 200,
      },
    ]);
  }),
];
