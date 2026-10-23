// Groups listing photos for the photo tour. Bundled photos encode the room in their path
// (/images/photos/kitchen/03.jpg, or the older /images/listings/kitchen-2.svg artwork); hosts' own URLs fall back to a
// single "Photos" group.

const ROOMS: { match: RegExp; label: string }[] = [
  { match: /\/(bedroom)[-/]/, label: "Bedroom" },
  { match: /\/(living)[-/]/, label: "Living area" },
  { match: /\/(kitchen)[-/]/, label: "Full kitchen" },
  { match: /\/(bathroom)[-/]/, label: "Full bathroom" },
  { match: /\/(beach|mountains|city|countryside|lakefront|desert|tropical)[-/]/, label: "Exterior" },
];

export type PhotoGroup = { label: string; photos: { src: string; index: number }[] };

export function groupPhotos(images: string[]): PhotoGroup[] {
  const groups = new Map<string, PhotoGroup>();
  images.forEach((src, index) => {
    const label = ROOMS.find((r) => r.match.test(src))?.label ?? "Photos";
    const group = groups.get(label) ?? { label, photos: [] };
    group.photos.push({ src, index });
    groups.set(label, group);
  });
  return [...groups.values()];
}

/**
 * Images next/image should serve as-is: SVG artwork (the optimizer refuses SVG) and hosts' remote URLs (no
 * remotePatterns are configured). Bundled JPEG photos go through the optimizer, so cards get card-sized files.
 */
export function rawImage(src: string) {
  return src.endsWith(".svg") || /^https?:\/\//.test(src);
}
