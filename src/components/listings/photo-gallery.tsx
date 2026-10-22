"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Grid3x3, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { groupPhotos } from "@/lib/photos";
import { cn } from "@/lib/utils";
import { ShareButton } from "./share-button";
import { useStay } from "./stay-context";

/**
 * Reference photo experience: 1+4 mosaic (radius 12, 8px gaps) → full-page "Photo tour" grouped by room
 * → fullscreen viewer with arrow-key navigation.
 */
export function PhotoGallery({ images, title, saveSlot }: { images: string[]; title: string; saveSlot?: React.ReactNode }) {
  const [tourOpen, setTourOpen] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const groups = groupPhotos(images);
  const mosaic = images.slice(0, 5);

  function step(delta: number) {
    setViewer((i) => (i === null ? i : (i + delta + images.length) % images.length));
  }

  return (
    <div id="photos" className="scroll-mt-24">
      {/* Phones: swipe strip with a counter. */}
      <div className="scrollbar-none -mx-6 flex snap-x snap-mandatory overflow-x-auto md:hidden">
        {images.map((src, i) => (
          <button key={src + i} type="button" className="relative aspect-[4/3] w-full shrink-0 snap-center" onClick={() => setTourOpen(true)} aria-label={`Open photo tour, photo ${i + 1} of ${images.length}`}>
            <Image src={src} alt="" fill unoptimized priority={i === 0} className="object-cover" sizes="100vw" />
            <span className="absolute right-4 bottom-4 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              {i + 1} / {images.length}
            </span>
          </button>
        ))}
      </div>

      {/* Desktop: 1 large + 4 small mosaic. */}
      <div className="relative hidden aspect-[2.35/1] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl md:grid">
        {mosaic.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setTourOpen(true)}
            aria-label={`${title}, photo ${i + 1}: open photo tour`}
            className={cn("group relative overflow-hidden bg-grey-200 outline-none focus-visible:z-10 focus-visible:shadow-[inset_0_0_0_3px_#222]", i === 0 && "col-span-2 row-span-2", mosaic.length === 1 && "col-span-4")}
          >
            <Image src={src} alt="" fill unoptimized priority={i === 0} className="object-cover transition-[filter] duration-200 group-hover:brightness-[0.85]" sizes="50vw" />
          </button>
        ))}
        <button
          type="button"
          className="absolute right-6 bottom-6 flex items-center gap-2 rounded-lg border border-foreground bg-background px-4 py-1.5 text-sm font-semibold transition-transform duration-200 hover:bg-grey-100 active:scale-[0.97] focus-ring"
          onClick={() => setTourOpen(true)}
        >
          <Grid3x3 className="size-4" /> Show all photos
        </button>
      </div>

      {/* Photo tour: full-page overlay. */}
      <Dialog open={tourOpen} onOpenChange={setTourOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-0 left-0 block h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none bg-background p-0 ring-0 sm:max-w-none data-open:animate-[kip-sheet-up_500ms_var(--ease-enter)]"
        >
          <div className="sticky top-0 z-10 flex h-16 items-center justify-between bg-background px-4 md:px-6">
            <button type="button" aria-label="Close photo tour" onClick={() => setTourOpen(false)} className="grid size-9 place-items-center rounded-full border border-foreground transition-colors hover:bg-grey-100 focus-ring">
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex items-center gap-1">
              <ShareButton title={title} />
              {saveSlot}
            </div>
          </div>
          <div className="mx-auto max-w-[1120px] px-6 pb-32">
            <DialogTitle className="pt-4 text-[26px] leading-[30px] font-semibold">Photo tour</DialogTitle>
            <div className="scrollbar-none mt-6 flex gap-4 overflow-x-auto pb-2">
              {groups.map((g) => (
                <a key={g.label} href={`#tour-${g.label.replace(/\W+/g, "-")}`} className="w-36 shrink-0 rounded-md text-sm focus-ring">
                  <span className="relative block aspect-[3/2] overflow-hidden rounded-md bg-grey-200">
                    <Image src={g.photos[0].src} alt="" fill unoptimized className="object-cover" sizes="144px" />
                  </span>
                  <span className="mt-2 block">{g.label}</span>
                </a>
              ))}
            </div>
            {groups.map((g) => (
              <section key={g.label} id={`tour-${g.label.replace(/\W+/g, "-")}`} className="mt-16 scroll-mt-20 grid gap-6 md:grid-cols-[1fr_2fr]">
                <h3 className="text-[22px] leading-[26px] font-semibold">{g.label}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {g.photos.map((p, i) => (
                    <button
                      key={p.src + p.index}
                      type="button"
                      onClick={() => setViewer(p.index)}
                      aria-label={`View ${g.label} photo ${i + 1} full screen`}
                      className={cn("group relative overflow-hidden bg-grey-200 focus-ring", i % 3 === 0 ? "col-span-2 aspect-[3/2]" : "aspect-square")}
                    >
                      <Image src={p.src} alt="" fill unoptimized className="object-cover transition-[filter] duration-200 group-hover:brightness-[0.9]" sizes="(max-width: 768px) 100vw, 66vw" />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <TourReserve onClose={() => setTourOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Fullscreen single-photo viewer. */}
      <Dialog open={viewer !== null} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent
          showCloseButton={false}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
          }}
          className="top-0 left-0 h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 rounded-none bg-black p-0 text-white ring-0 sm:max-w-none"
        >
          {viewer !== null && (
            <div className="relative flex h-full items-center justify-center">
              <DialogTitle className="sr-only">
                {title}: photo {viewer + 1} of {images.length}
              </DialogTitle>
              <button type="button" onClick={() => setViewer(null)} className="absolute top-6 left-6 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10 focus-ring">
                <X className="size-4" /> Close
              </button>
              <p className="absolute top-7 left-1/2 -translate-x-1/2 text-sm" aria-live="polite">
                {viewer + 1} / {images.length}
              </p>
              <div className="relative h-[78dvh] w-[min(1100px,86vw)]">
                <Image key={images[viewer]} src={images[viewer]} alt={`${title}, photo ${viewer + 1} of ${images.length}`} fill unoptimized className="kip-fade-in object-contain" sizes="90vw" />
              </div>
              <button type="button" aria-label="Previous photo" onClick={() => step(-1)} className="absolute left-6 grid size-12 place-items-center rounded-full border border-white/40 transition-transform hover:scale-[1.04] hover:border-white active:scale-[0.96] focus-ring">
                <ChevronLeft />
              </button>
              <button type="button" aria-label="Next photo" onClick={() => step(1)} className="absolute right-6 grid size-12 place-items-center rounded-full border border-white/40 transition-transform hover:scale-[1.04] hover:border-white active:scale-[0.96] focus-ring">
                <ChevronRight />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Floating "Reserve" pill inside the photo tour (reference). Goes to checkout when the stay is priced, else to the calendar. */
function TourReserve({ onClose }: { onClose: () => void }) {
  const { reserveHref } = useStay();
  const cls =
    "bg-brand-gradient pointer-events-auto rounded-full px-8 py-3.5 text-base font-semibold text-white shadow-elev-3 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] focus-ring";
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 flex justify-center">
      {reserveHref ? (
        <Link href={reserveHref} className={cls}>
          Reserve
        </Link>
      ) : (
        <button
          type="button"
          className={cls}
          onClick={() => {
            onClose();
            setTimeout(() => document.getElementById("availability-heading")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
          }}
        >
          Check availability
        </button>
      )}
    </div>
  );
}
