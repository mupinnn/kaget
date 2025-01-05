import { useMutation } from "@tanstack/react-query";
import { Settings } from "./settings.schemas";
import { createSettings } from "./settings.services";

export const useCreateSettingsMutation = () => {
  return useMutation({
    async mutationFn(data: Settings) {
      return await createSettings(data);
    },
  });
};
