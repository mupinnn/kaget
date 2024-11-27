export const formatCurrency = (number: number, options?: Intl.NumberFormatOptions) => {
  return new Intl.NumberFormat(window.navigator.languages, {
    style: "currency",
    currency: "IDR",
    ...options,
  }).format(number);
};

export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
  return new Intl.DateTimeFormat(window.navigator.languages, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(new Date(date));
};
