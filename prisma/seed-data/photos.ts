import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Category } from "@prisma/client";
import type { Rng } from "./generate";

// Licensed photos live in public/images/photos/<slot>/NN.jpg (credits in credits.json next to them). Any slot that is
// missing falls back to the bundled SVG artwork, so seeding never depends on the photo library being present.

const ROOT = path.join(process.cwd(), "public", "images", "photos");
const SCENE: Record<Category, string> = {
  BEACH: "beach",
  MOUNTAINS: "mountains",
  CITY: "city",
  COUNTRYSIDE: "countryside",
  LAKEFRONT: "lakefront",
  DESERT: "desert",
  TROPICAL: "tropical",
};

const cache = new Map<string, string[]>();

function slot(name: string): string[] {
  if (!cache.has(name)) {
    const dir = path.join(ROOT, name);
    const files = existsSync(dir) ? readdirSync(dir).filter((f) => /\.(jpe?g|webp)$/i.test(f)).sort() : [];
    cache.set(
      name,
      files.length ? files.map((f) => `/images/photos/${name}/${f}`) : [1, 2, 3, 4].map((n) => `/images/listings/${name}-${n}.svg`),
    );
  }
  return cache.get(name)!;
}

// Thin exterior slots borrow from a look-alike scene so covers don't repeat across a whole city row.
const BORROW: Partial<Record<Category, string>> = { BEACH: "tropical", DESERT: "tropical" };

function exteriorPool(category: Category) {
  const own = slot(SCENE[category]);
  const borrow = BORROW[category];
  return own.length < 6 && borrow ? [...own, ...slot(borrow)] : own;
}

/**
 * Photos for one listing, in the order the reference uses: a cover exterior, then rooms (a bedroom per bedroom up to
 * three, living area, kitchen, bathroom) and a second exterior. Picks are spread with `rng` so neighbouring
 * listings rarely share a cover.
 */
export function listingPhotos(rng: Rng, category: Category, bedrooms: number, hasKitchen: boolean): string[] {
  const exteriors = rng.sample(exteriorPool(category), 2);
  const photos = [exteriors[0]];
  photos.push(...rng.sample(slot("bedroom"), Math.max(1, Math.min(3, bedrooms))));
  photos.push(...rng.sample(slot("living"), rng.int(1, 2)));
  if (hasKitchen) photos.push(rng.pick(slot("kitchen")));
  photos.push(rng.pick(slot("bathroom")));
  if (exteriors[1]) photos.push(exteriors[1]);
  return photos;
}
