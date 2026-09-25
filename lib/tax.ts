// Sales tax preview. The server is the authority: a top-up it has made carries its own tax_lines.
// This only previews the split before the member taps Pay, the same way the database does it
// (public.tax_lines): each line rounded to the cent, the last line takes the remainder, so the lines
// always add up to round(amount x total rate).

export interface TaxComponent { code: string; label: string; rate: number }
export interface TaxLinePreview extends TaxComponent { amount: number }

export function splitTax(components: TaxComponent[] | undefined, amount: number, totalRate: number): TaxLinePreview[] {
  const total = Math.round(amount * totalRate * 100) / 100;
  if (!components || components.length === 0) return [{ code: "tax", label: "Sales tax", rate: totalRate, amount: total }];
  let used = 0;
  return components.map((c, i) => {
    const amt = i === components.length - 1
      ? Math.round((total - used) * 100) / 100
      : Math.round(amount * c.rate * 100) / 100;
    used += amt;
    return { ...c, amount: amt };
  });
}

/** Credits for a payment: what is paid less the tax, as "18.00". */
export const creditsAfterTax = (amount: number, totalRate: number) =>
  (amount - Math.round(amount * totalRate * 100) / 100).toFixed(2);

/** 0.0725 -> "7.25%" */
export const pct = (rate: number) => `${Math.round(rate * 100000) / 1000}%`;
