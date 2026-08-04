import { getCachedCurrencyCode } from "@/features/settings/data/settings.cache";

export const formatCurrency = (number: number, options?: Intl.NumberFormatOptions) => {
  return new Intl.NumberFormat(window.navigator.languages, {
    style: "currency",
    currency: getCachedCurrencyCode(),
    ...options,
  }).format(number);
};

export const noop = () => {};

export const noopAsync = () => Promise.resolve(undefined);
