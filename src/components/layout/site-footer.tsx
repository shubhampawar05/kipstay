import Link from "next/link";

const COLUMNS = [
  { title: "Support", links: [["Help & safety", "/help"], ["Cancellation options", "/help#cancellations"], ["Report a concern", "/help#report"]] },
  { title: "Hosting", links: [["Host your place", "/host"], ["Create a listing", "/host/listings/new"], ["Hosting standards", "/help#hosting"]] },
  { title: "Kipstay", links: [["About", "/help#about"], ["Explore stays", "/s"], ["Wishlists", "/wishlists"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-muted/40 pb-20 md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3 md:px-6">
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="mb-3 text-sm font-semibold">{col.title}</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 border-t px-4 py-6 text-sm text-muted-foreground md:px-6">
        <p>© {new Date().getFullYear()} Kipstay (demo project). Prices in USD.</p>
        <p>Payments in this build are simulated, and no card is ever charged.</p>
      </div>
    </footer>
  );
}
