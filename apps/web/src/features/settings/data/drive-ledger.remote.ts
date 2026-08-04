import { api } from "@/libs/api.lib";
import {
  BadRequestError,
  ConflictError,
  FetchError,
  InternalServerError,
  NotFoundError,
  UnprocessableEntityError,
} from "@/utils/error.util";
import type { DriveLedgerRemote } from "./drive-sync.engine";
import { DriveSyncNotConnectedError } from "./drive-sync.errors";

export type { DriveLedgerRemote };
export { DriveSyncNotConnectedError };

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

async function parseError(
  res: Response
): Promise<{ status: number; code?: string; message: string }> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return {
      status: res.status,
      code: body.error?.code,
      message: body.error?.message ?? res.statusText ?? "Request failed",
    };
  } catch {
    return { status: res.status, message: res.statusText ?? "Request failed" };
  }
}

function throwHttp(status: number, message: string): never {
  switch (status) {
    case 400:
      throw new BadRequestError(message);
    case 401:
    case 403:
      throw new DriveSyncNotConnectedError(message);
    case 404:
      throw new NotFoundError(message);
    case 409:
      throw new ConflictError(message);
    case 422:
      throw new UnprocessableEntityError(message);
    case 500:
      throw new InternalServerError(message);
    default:
      throw new FetchError(message);
  }
}

export async function ensureDriveLedger(): Promise<void> {
  const res = await api.api.drive.ledger.ensure.$post();
  if (!res.ok) {
    const err = await parseError(res);
    if (err.code === "DRIVE_GOOGLE_AUTH_REQUIRED" || err.status === 401 || err.status === 403) {
      throw new DriveSyncNotConnectedError(err.message);
    }
    throwHttp(err.status, err.message);
  }
}

/** Unbinds the server-side Drive `fileId` pointer. Does not delete Drive file content. */
export async function unbindDriveLedger(): Promise<{ cleared: boolean; fileId?: string }> {
  const res = await api.api.drive.ledger.$delete();
  if (!res.ok) {
    const err = await parseError(res);
    if (err.code === "DRIVE_GOOGLE_AUTH_REQUIRED" || err.status === 401 || err.status === 403) {
      throw new DriveSyncNotConnectedError(err.message);
    }
    throwHttp(err.status, err.message);
  }
  const body = (await res.json()) as { data: { cleared: boolean; fileId?: string } };
  return body.data;
}

export function createApiDriveLedgerRemote(): DriveLedgerRemote {
  return {
    ensure: ensureDriveLedger,

    async download() {
      const res = await api.api.drive.ledger.$get();
      if (!res.ok) {
        const err = await parseError(res);
        if (err.code === "DRIVE_GOOGLE_AUTH_REQUIRED" || err.status === 401 || err.status === 403) {
          throw new DriveSyncNotConnectedError(err.message);
        }
        if (err.code === "DRIVE_FILE_NOT_BOUND" || err.code === "DRIVE_FILE_NOT_FOUND") {
          return {};
        }
        throwHttp(err.status, err.message);
      }
      const body = (await res.json()) as { data: { content: unknown } };
      return body.data.content;
    },

    async upload(document) {
      const res = await api.api.drive.ledger.$put({
        json: { content: document },
      });
      if (!res.ok) {
        const err = await parseError(res);
        if (err.code === "DRIVE_GOOGLE_AUTH_REQUIRED" || err.status === 401 || err.status === 403) {
          throw new DriveSyncNotConnectedError(err.message);
        }
        throwHttp(err.status, err.message);
      }
    },
  };
}
