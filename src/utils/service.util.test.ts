import { expect, test, describe } from "vitest";
import { generatePaginationMeta } from "./service.util";

describe("`generatePaginationMeta` util", () => {
  test("Should properly generate basic pagination meta", () => {
    const params = { total: 100, currentPage: 2, perPage: 10 };
    const expected = {
      total_records: 100,
      current_page: 2,
      total_pages: 10,
      next_page: 3,
      prev_page: 1,
    };

    expect(generatePaginationMeta(params)).toEqual(expected);
  });

  test("Should handle odd pagination properly", () => {
    const params = { total: 103, currentPage: 3, perPage: 10 };
    const expected = {
      total_records: 103,
      current_page: 3,
      total_pages: 11,
      next_page: 4,
      prev_page: 2,
    };

    expect(generatePaginationMeta(params)).toEqual(expected);
  });

  test("Should return `null` when no `next_page` available", () => {
    const params = { total: 104, currentPage: 6, perPage: 20 };
    const expected = {
      total_records: 104,
      current_page: 6,
      total_pages: 6,
      next_page: null,
      prev_page: 5,
    };

    expect(generatePaginationMeta(params)).toEqual(expected);
  });

  test("Should return `null` when no `prev_page` available", () => {
    const params = { total: 104, currentPage: 1, perPage: 20 };
    const expected = {
      total_records: 104,
      current_page: 1,
      total_pages: 6,
      next_page: 2,
      prev_page: null,
    };

    expect(generatePaginationMeta(params)).toEqual(expected);
  });

  test("Should handle zero total records properly", () => {
    const params = { total: 0, currentPage: 1, perPage: 10 };
    const expected = {
      total_records: 0,
      current_page: 1,
      total_pages: 0,
      next_page: null,
      prev_page: null,
    };

    expect(generatePaginationMeta(params)).toEqual(expected);
  });
});
