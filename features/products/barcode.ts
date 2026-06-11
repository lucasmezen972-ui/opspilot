export function normalizeBarcode(value: string): string {
  return value.replace(/\s+/g, '').trim();
}
