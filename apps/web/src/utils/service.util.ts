import type { ServicePaginationMeta } from "@/schemas/service.schema";
import type { ApiPagination } from "@/utils/api.util";

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

export function mapApiPagination(pagination: ApiPagination): ServicePaginationMeta {
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  return generatePaginationMeta({
    total: pagination.total,
    currentPage,
    perPage: pagination.limit,
  });
}
