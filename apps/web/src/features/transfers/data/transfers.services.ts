import { api } from "@/libs/api.lib";
import { unwrap } from "@/utils/api.util";
import type { CreateTransferForm, TransfersRequestQuery } from "./transfers.schemas";
import { toCreateTransferInput } from "./transfers.schemas";

export async function getTransferList(query: TransfersRequestQuery = {}) {
  const result = await unwrap(
    api.api.transfers.$get({
      query: {
        account_id: query.source_id,
        account_type: query.source_id ? query.source_type : undefined,
        limit: 100,
      },
    })
  );

  return result.transfers;
}

export async function createTransfer(payload: CreateTransferForm) {
  const json = toCreateTransferInput(payload);
  return unwrap(api.api.transfers.$post({ json }));
}
