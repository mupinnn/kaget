import type { ServicePaginationMeta, ServiceResponse } from "@/schemas/service.schema";

type GeneratePaginationMetaParams = {
  total: number;
  currentPage: number;
  perPage?: number;
};

export function generatePaginationMeta({
  total,
  currentPage,
  perPage = 10,
}: GeneratePaginationMetaParams): ServicePaginationMeta {
  const nextPage = currentPage + 1;
  const prevPage = currentPage - 1;
  const totalPages = Math.abs(Math.ceil((total - 1) / perPage));

  return {
    total_records: total,
    current_page: currentPage,
    total_pages: totalPages,
    next_page: nextPage > totalPages ? null : nextPage,
    prev_page: prevPage <= 0 ? null : prevPage,
  };
}

export function successResponse<TData>({
  data,
  message = "Success",
  meta,
}: ServiceResponse<TData>) {
  return { data, message, meta };
}
