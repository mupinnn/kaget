import { useQuery } from "@tanstack/react-query";
import { getSettings } from "./settings.services";

export const useSettingsQuery = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });
