import { useMutation } from "@tanstack/react-query";
import type { CreateSettings } from "./settings.schemas";
import { createSettings } from "./settings.services";

export const useCreateSettingsMutation = () => {
  return useMutation({
    mutationFn: (data: CreateSettings) => createSettings(data),
    meta: { successMessage: "Successfully saved settings" },
  });
};
