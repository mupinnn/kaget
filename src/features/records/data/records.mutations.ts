import { useMutation } from "@tanstack/react-query";
import { type CreateRecord } from "./records.schemas";
import { createRecord, deleteRecord } from "./records.services";

export const useCreateRecordMutation = () => {
  return useMutation({
    async mutationFn(data: CreateRecord) {
      return await createRecord(data);
    },
  });
};

export const useDeleteRecordMutation = () => {
  return useMutation({
    async mutationFn(recordId: string) {
      return await deleteRecord(recordId);
    },
  });
};
