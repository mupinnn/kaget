export function parseAmount(value: string | number): number {
  return typeof value === "number" ? value : Number.parseFloat(value);
}
