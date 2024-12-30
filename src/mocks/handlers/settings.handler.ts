import { http } from "msw";
import { mockErrorResponse, mockSuccessResponse } from "@/utils/mock.util";
import { db } from "@/libs/db.lib";
import { Settings, SettingsSchema } from "@/features/settings/data/settings.schema";

export const settingsHandler = [
  http.get("/api/v1/settings", async () => {
    try {
      const storedSettings = await db.settings.limit(1).last();

      return mockSuccessResponse({
        data: storedSettings,
        message: "Successfully retrieved settings",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.post("/api/v1/settings", async ({ request }) => {
    try {
      const data = SettingsSchema.parse(await request.json());
      const newSettings: Settings = {
        currency: data.currency,
      };

      await db.settings.add(newSettings);

      return mockSuccessResponse({ data: newSettings, message: "Successfully save settings" });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),
];
