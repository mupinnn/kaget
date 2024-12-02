export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
  return new Intl.DateTimeFormat(window.navigator.languages, {
    dateStyle: "medium",
    ...options,
  }).format(new Date(date));
};

export type DateInput = string | Date;

export const getUTCTimestamp = (date: DateInput) => {
  const dateObj = new Date(date);
  return Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
};

export const compareDate = (a: DateInput, b: DateInput) => {
  return getUTCTimestamp(a) - getUTCTimestamp(b);
};

export const isDateEqual = (a: DateInput, b: DateInput) => compareDate(a, b) === 0;

export const isDateAfter = (a: DateInput, b: DateInput) => compareDate(a, b) > 0;

export const isDateBefore = (a: DateInput, b: DateInput) => compareDate(a, b) < 0;

export const isDateAfterOrEqual = (a: DateInput, b: DateInput) => compareDate(a, b) >= 0;

export const isDateBeforeOrEqual = (a: DateInput, b: DateInput) => compareDate(a, b) <= 0;