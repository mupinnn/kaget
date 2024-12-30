import { useMutation } from "@tanstack/react-query";
import { api } from "@/libs/api.lib";
import { Settings, SettingsResponseSchema } from "./settings.schema";

export const useCreateSettingsMutation = () => {
  return useMutation({
    async mutationFn(data: Settings) {
      const res = await api.post(data, "/settings");
      return SettingsResponseSchema.parse(res);
    },
  });
};
