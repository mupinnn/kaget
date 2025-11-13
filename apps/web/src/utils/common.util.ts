export const formatCurrency = (number: number, options?: Intl.NumberFormatOptions) => {
  return new Intl.NumberFormat(window.navigator.languages, {
    style: "currency",
    currency: window.settings?.currency ?? "IDR",
    ...options,
  }).format(number);
};

export const noop = () => {};

export const noopAsync = () => Promise.resolve(undefined);
