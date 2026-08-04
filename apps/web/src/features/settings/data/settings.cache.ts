let currencyCodeCache = "IDR";

export function getCachedCurrencyCode() {
  return currencyCodeCache;
}

export function setCachedCurrencyCode(currencyCode: string) {
  currencyCodeCache = currencyCode;
}
