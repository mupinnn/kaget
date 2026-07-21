import type { ClientResponse } from "hono/client";
import {
  BadRequestError,
  ConflictError,
  FetchError,
  InternalServerError,
  NotFoundError,
  UnprocessableEntityError,
} from "@/utils/error.util";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[]>;
  };
};

function throwApiError(status: number, message: string): never {
  switch (status) {
    case 400:
      throw new BadRequestError(message);
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

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.error?.message ?? res.statusText ?? "Request failed";
  } catch {
    return res.statusText ?? "Request failed";
  }
}

export async function unwrap<T>(
  response: ClientResponse<T> | Promise<ClientResponse<T>>
): Promise<T> {
  const res = await response;

  if (res.ok) {
    const body = (await res.json()) as { data: T };
    return body.data;
  }

  throwApiError(res.status, await parseErrorMessage(res));
}

export type ApiPagination = {
  total: number;
  limit: number;
  offset: number;
};

export async function unwrapPaginated<T>(
  response:
    | ClientResponse<{ data: T; pagination: ApiPagination }>
    | Promise<ClientResponse<{ data: T; pagination: ApiPagination }>>
): Promise<{ data: T; pagination: ApiPagination }> {
  const res = await response;

  if (res.ok) {
    return (await res.json()) as { data: T; pagination: ApiPagination };
  }

  throwApiError(res.status, await parseErrorMessage(res));
}

export async function unwrapRaw<T>(
  response: ClientResponse<T> | Promise<ClientResponse<T>>
): Promise<T> {
  const res = await response;

  if (res.ok) {
    return (await res.json()) as T;
  }

  throwApiError(res.status, await parseErrorMessage(res));
}
