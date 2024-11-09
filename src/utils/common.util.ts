export const formatCurrency = (number: number, options?: Intl.NumberFormatOptions) => {
  return new Intl.NumberFormat(window.navigator.languages, {
    style: "currency",
    currency: "IDR",
    ...options,
  }).format(number);
};
