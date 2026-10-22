import { formatMoney, type Quote } from "@/lib/pricing";

export function PriceBreakdown({ quote }: { quote: Quote }) {
  const rows: [string, number, string?][] = [
    [`${formatMoney(quote.nightlyPrice, { cents: true })} x ${quote.nights} night${quote.nights === 1 ? "" : "s"}`, quote.subtotal],
  ];
  if (quote.discount) rows.push(["Weekly stay discount", -quote.discount, "text-emerald-700"]);
  if (quote.cleaningFee) rows.push(["Cleaning fee", quote.cleaningFee]);
  rows.push(["Kipstay service fee", quote.serviceFee]);
  rows.push(["Taxes", quote.taxes]);

  return (
    <dl className="space-y-3 text-[15px]" data-testid="price-breakdown">
      {rows.map(([label, amount, cls]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className={cls}>{amount < 0 ? `−${formatMoney(-amount, { cents: true })}` : formatMoney(amount, { cents: true })}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t pt-3 font-semibold">
        <dt>Total (USD)</dt>
        <dd data-testid="price-total">{formatMoney(quote.total, { cents: true })}</dd>
      </div>
    </dl>
  );
}
