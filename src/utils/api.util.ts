import { HttpResponse, HttpResponseInit } from "msw";
import { ZodError } from "zod";
import { HttpResponseError } from "./error.util";

type GeneratePaginationMetaParams = {
  total: number;
  currentPage: number;
  perPage?: number;
};

export function generatePaginationMeta({
  total,
  currentPage,
  perPage = 10,
}: GeneratePaginationMetaParams) {
  const nextPage = currentPage + 1;
  const prevPage = currentPage - 1;
  const totalPages = Math.abs(Math.ceil((total - 1) / perPage));

  return {
    pagination: {
      total_records: total,
      current_page: currentPage,
      total_pages: totalPages,
      next_page: nextPage > totalPages ? null : nextPage,
      prev_page: prevPage <= 0 ? null : prevPage,
    },
  };
}

type BaseResponseParams<TData> = {
  message: string;
  data?: TData;
} & HttpResponseInit;

type ResponseMeta = {
  pagination?: ReturnType<typeof generatePaginationMeta>;
};

type SuccessResponseParams<TData> = BaseResponseParams<TData> & {
  data: TData;
  meta?: ResponseMeta;
};

export function successResponse<TData>({
  data,
  message,
  meta,
  ...rest
}: SuccessResponseParams<TData>) {
  return HttpResponse.json(
    {
      data,
      message,
      meta,
    },
    { ...rest }
  );
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return {
      status: 400,
      message: error.message,
      errors: error.errors,
    };
  }

  if (error instanceof HttpResponseError) {
    return {
      status: error.code,
      message: error.message,
    };
  }

  throw error;
}
