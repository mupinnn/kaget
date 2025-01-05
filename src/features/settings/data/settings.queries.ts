import { useQuery } from "@tanstack/react-query";
import { getSettings } from "./settings.services";

export const SETTINGS_QUERY_KEY = "settings";

export const useSettingsQuery = () =>
  useQuery({
    queryKey: [SETTINGS_QUERY_KEY],
    queryFn: getSettings,
  });
