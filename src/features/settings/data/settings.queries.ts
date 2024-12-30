import { useQuery } from "@tanstack/react-query";
import { api } from "@/libs/api.lib";
import { SettingsResponseSchema } from "./settings.schema";

export const getSettings = async () => {
  const res = await api.get("/settings");
  return SettingsResponseSchema.parse(res);
};

export const preloadSettings = async () => {
  const settings = await getSettings();
  window.settings = settings.data;
};

export const useSettingsQuery = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });
