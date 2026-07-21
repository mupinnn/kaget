export const formatCurrency = (number: number, options?: Intl.NumberFormatOptions) => {
  return new Intl.NumberFormat(window.navigator.languages, {
    style: "currency",
    currency: window.settings?.currencyCode ?? "IDR",
    ...options,
  }).format(number);
};

export const noop = () => {};

export const noopAsync = () => Promise.resolve(undefined);
