import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { title: "Photo credits" };

type Credit = { path: string; title: string; author: string; license: string; licenseUrl?: string; sourceUrl: string };

const SLOT_LABELS: Record<string, string> = {
  beach: "Beach homes",
  mountains: "Mountain homes",
  city: "City stays",
  countryside: "Countryside",
  lakefront: "Lakefront",
  desert: "Desert",
  tropical: "Tropical",
  bedroom: "Bedrooms",
  living: "Living areas",
  kitchen: "Kitchens",
  bathroom: "Bathrooms",
};

async function loadCredits(): Promise<Credit[]> {
  try {
    const raw = await readFile(path.join(process.cwd(), "public", "images", "photos", "credits.json"), "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Attribution for the listing photos. They come from Wikimedia Commons under CC0, public-domain, CC BY or CC BY-SA
 * licences; CC BY/BY-SA require crediting the author and linking the licence, which this page does for every file.
 */
export default async function CreditsPage() {
  const credits = await loadCredits();
  const groups = new Map<string, Credit[]>();
  for (const c of credits) {
    const slot = c.path.split("/")[3] ?? "other";
    groups.set(slot, [...(groups.get(slot) ?? []), c]);
  }

  return (
    <div className="page-gutter mx-auto max-w-[1120px] pt-10 pb-16">
      <h1 className="text-[28px] leading-8 font-semibold">Photo credits</h1>
      <p className="mt-3 max-w-[680px] text-base leading-6 text-muted-foreground">
        Kipstay is a demo: every listing, host and review is fictional, but the photos are real. They come from Wikimedia
        Commons and are used under the licences below. Photos are resized; nothing else is changed.
      </p>

      {credits.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No photo credits recorded yet.</p>
      ) : (
        [...groups.entries()].map(([slot, items]) => (
          <section key={slot} aria-labelledby={`credits-${slot}`} className="mt-10">
            <h2 id={`credits-${slot}`} className="text-xl leading-6 font-semibold">
              {SLOT_LABELS[slot] ?? slot}
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <li key={c.path} className="flex gap-3 rounded-2xl border border-grey-300 p-3">
                  <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-grey-200">
                    <Image src={c.path} alt="" fill className="object-cover" sizes="80px" />
                  </span>
                  <span className="min-w-0 text-sm">
                    <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="line-clamp-2 font-medium hover:underline focus-ring">
                      {c.title}
                    </a>
                    <span className="mt-0.5 block truncate text-muted-foreground">by {c.author || "Unknown author"}</span>
                    {c.licenseUrl ? (
                      <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer license" className="mt-0.5 inline-block text-muted-foreground underline focus-ring">
                        {c.license}
                      </a>
                    ) : (
                      <span className="mt-0.5 block text-muted-foreground">{c.license}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
