// Sales tax preview. The server is the authority: a top-up it has made carries its own tax_lines.
// This only previews the split before the member taps Pay, the same way the database does it
// (public.tax_lines): each line rounded to the cent, the last line takes the remainder, so the lines
// always add up to round(amount x total rate).

export interface TaxComponent { code: string; label: string; rate: number }
export interface TaxLinePreview extends TaxComponent { amount: number }

/**
 * amount x rate in whole cents, rounded half up exactly like the database's numeric round().
 * Plain Math.round(amount * rate * 100) is off by a cent for about one amount in ten
 * (6 x 0.0725 x 100 is 43.49999999999999 in floating point; the database charges 44), so the
 * amount becomes integer cents and the rate integer millionths, and the product is exact.
 */
export function taxCents(amount: number, rate: number): number {
  const c = Math.round(amount * 100);
  const r = Math.round(rate * 1_000_000);
  return Math.floor((c * r + 500_000) / 1_000_000);
}

export function splitTax(components: TaxComponent[] | undefined, amount: number, totalRate: number): TaxLinePreview[] {
  const total = taxCents(amount, totalRate);
  if (!components || components.length === 0) return [{ code: "tax", label: "Sales tax", rate: totalRate, amount: total / 100 }];
  let used = 0;
  return components.map((c, i) => {
    const amt = i === components.length - 1 ? total - used : taxCents(amount, c.rate);
    used += amt;
    return { ...c, amount: amt / 100 };
  });
}

/** Credits for a payment: what is paid less the tax, as "18.00". */
export const creditsAfterTax = (amount: number, totalRate: number) =>
  ((Math.round(amount * 100) - taxCents(amount, totalRate)) / 100).toFixed(2);

/** 0.0725 -> "7.25%" */
export const pct = (rate: number) => `${Math.round(rate * 100000) / 1000}%`;
