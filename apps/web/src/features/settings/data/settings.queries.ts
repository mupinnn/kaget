import { useQuery } from "@tanstack/react-query";
import { getSettings } from "./settings.services";

export const SETTINGS_QUERY_KEY = "settings";

export const useSettingsQuery = (options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: [SETTINGS_QUERY_KEY],
    queryFn: getSettings,
    enabled: options.enabled ?? true,
  });
