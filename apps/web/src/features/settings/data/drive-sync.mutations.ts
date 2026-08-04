import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DRIVE_SYNC_META_QUERY_KEY } from "./drive-sync.queries";
import type { SyncConflictChoice } from "./drive-sync.schemas";
import {
  connectDrive,
  disconnectDrive,
  finishPendingDriveConnect,
  resolveConflict,
  syncNow,
} from "./drive-sync.services";

export const useConnectDriveMutation = () => {
  return useMutation({
    mutationFn: connectDrive,
  });
};

export const useFinishPendingDriveConnectMutation = () => {
  return useMutation({
    mutationFn: finishPendingDriveConnect,
  });
};

export const useDisconnectDriveMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectDrive,
    meta: { successMessage: "Google Drive disconnected" },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [DRIVE_SYNC_META_QUERY_KEY] });
    },
  });
};

export const useSyncNowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncNow(),
    onSuccess: async result => {
      if (result.status === "conflict") {
        return;
      }
      await queryClient.invalidateQueries({ queryKey: [DRIVE_SYNC_META_QUERY_KEY] });
      if (result.status === "pulled") {
        await queryClient.invalidateQueries();
      }
    },
  });
};

export const useResolveConflictMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (choice: SyncConflictChoice) => resolveConflict(choice),
    onSuccess: async result => {
      await queryClient.invalidateQueries({ queryKey: [DRIVE_SYNC_META_QUERY_KEY] });
      if (result.status === "pulled") {
        await queryClient.invalidateQueries();
      }
    },
  });
};
