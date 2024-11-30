// TODO: benchmark this against number format util why this approach is slower

export const createDateFormatter = (options?: Intl.DateTimeFormatOptions) => {
  return new Intl.DateTimeFormat(window.navigator.languages, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
};

export const dateFormatter = createDateFormatter();

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
