/** Use the exact invoiced total; never guess tax from the advertised plan price. */
export function parseInvoiceTotal(value: string): number | null {
  const clean = value.trim();
  if (!/^(0|[1-9]\d{0,4})([.,]\d{1,2})?$/.test(clean)) return null;
  const [whole, fraction = ''] = clean.replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return cents >= 50 && cents <= 1000000 ? cents : null;
}

export function invoicePeriodEnd(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T23:59:59Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    return null;
  return date.toISOString();
}
