import { queryOptions, useQuery } from "@tanstack/react-query";
import { getDriveSyncMeta } from "./drive-sync.meta";

export const DRIVE_SYNC_META_QUERY_KEY = "drive-sync-meta";

export const driveSyncMetaQueryOptions = () =>
  queryOptions({
    queryKey: [DRIVE_SYNC_META_QUERY_KEY],
    queryFn: getDriveSyncMeta,
  });

export const useDriveSyncMetaQuery = () => useQuery(driveSyncMetaQueryOptions());
