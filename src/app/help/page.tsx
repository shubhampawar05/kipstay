import type { Metadata } from "next";
import { CANCELLATION_POLICIES } from "@/lib/constants";
import { SERVICE_FEE_RATE, TAX_RATE, WEEKLY_DISCOUNT_MIN_NIGHTS, WEEKLY_DISCOUNT_RATE } from "@/lib/pricing";

export const metadata: Metadata = { title: "Help & safety" };

const pct = (r: number) => `${Math.round(r * 100)}%`;

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Help & safety</h1>

      <section id="about" className="scroll-mt-28 space-y-2">
        <h2 className="text-xl font-semibold">About Kipstay</h2>
        <p className="text-muted-foreground">
          Kipstay is a demonstration accommodation marketplace. Listings, hosts and reviews are fictional sample data. Payments are simulated, and no
          card details are collected.
        </p>
      </section>

      <section id="pricing" className="scroll-mt-28 space-y-2">
        <h2 className="text-xl font-semibold">How prices are calculated</h2>
        <p className="text-muted-foreground">
          Totals are computed on our server: nightly price × nights, minus a {pct(WEEKLY_DISCOUNT_RATE)} discount for stays of {WEEKLY_DISCOUNT_MIN_NIGHTS}+
          nights, plus the host&apos;s cleaning fee, a {pct(SERVICE_FEE_RATE)} service fee and {pct(TAX_RATE)} tax.
        </p>
      </section>

      <section id="cancellations" className="scroll-mt-28 space-y-2">
        <h2 className="text-xl font-semibold">Cancellation options</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {Object.values(CANCELLATION_POLICIES).map((p) => (
            <li key={p.label}>
              <strong className="text-foreground">{p.label}:</strong> free cancellation until {p.daysBefore} day{p.daysBefore === 1 ? "" : "s"} before
              check-in.
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground">You can cancel any upcoming reservation from its page in Trips. Stays that have already started can&apos;t be cancelled online.</p>
      </section>

      <section id="hosting" className="scroll-mt-28 space-y-2">
        <h2 className="text-xl font-semibold">Hosting standards</h2>
        <p className="text-muted-foreground">
          Hosts must describe their place accurately, keep their calendar up to date and honour confirmed reservations. Unpublished listings never
          appear in search.
        </p>
      </section>

      <section id="report" className="scroll-mt-28 space-y-2">
        <h2 className="text-xl font-semibold">Report a concern</h2>
        <p className="text-muted-foreground">
          This demo has no support inbox. In a production deployment this section would link to a monitored contact channel and emergency guidance.
        </p>
      </section>
    </div>
  );
}
