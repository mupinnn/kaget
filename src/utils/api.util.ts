import { HttpResponse, HttpResponseInit } from "msw";
import { ZodError } from "zod";
import { APIResponseMeta, BaseAPIResponse } from "@/schemas/api.schema";
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
}: GeneratePaginationMetaParams): APIResponseMeta["meta"] {
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

export function successResponse({
  data,
  message,
  meta,
  ...httpResponseInit
}: BaseAPIResponse & HttpResponseInit) {
  return HttpResponse.json(
    {
      data,
      message,
      meta,
    },
    httpResponseInit
  );
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return HttpResponse.json(
      {
        message: "Invalid body request",
        data: error.errors,
      },
      { status: 400 }
    );
  }

  if (error instanceof HttpResponseError) {
    return HttpResponse.json({ message: error.message }, { status: error.status });
  }

  return new HttpResponse(null, { status: 500 });
}
