import { useQuery } from "@tanstack/react-query";
import { api } from "@/libs/api.lib";
import { SettingsResponseSchema } from "./settings.schema";

export const getSettings = async () => {
  const res = await api.get("/settings");
  return SettingsResponseSchema.parse(res);
};

export const useSettingsQuery = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });
