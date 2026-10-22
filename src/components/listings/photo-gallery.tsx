"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Grid3x3 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Five-photo mosaic (desktop) / swipeable strip (phone), plus a full-screen lightbox. */
export function PhotoGallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  function show(i: number) {
    setIndex(i);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  const mosaic = images.slice(0, 5);

  return (
    <>
      {/* Phone: horizontal snap strip */}
      <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory overflow-x-auto md:hidden">
        {images.map((src, i) => (
          <button key={src + i} type="button" className="relative aspect-[4/3] w-full shrink-0 snap-center" onClick={() => show(i)} aria-label={`Open photo ${i + 1} of ${images.length}`}>
            <Image src={src} alt="" fill unoptimized priority={i === 0} className="object-cover" sizes="100vw" />
            <span className="absolute right-3 bottom-3 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
              {i + 1} / {images.length}
            </span>
          </button>
        ))}
      </div>

      {/* Desktop: mosaic */}
      <div className="relative hidden h-[28rem] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:grid">
        {mosaic.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => show(i)}
            aria-label={`${title}, photo ${i + 1}`}
            className={cn("relative overflow-hidden bg-muted", i === 0 && "col-span-2 row-span-2", mosaic.length === 1 && "col-span-4")}
          >
            <Image src={src} alt="" fill unoptimized priority={i === 0} className="object-cover transition-[filter] hover:brightness-90" sizes="50vw" />
          </button>
        ))}
        <Button variant="outline" size="sm" className="absolute right-4 bottom-4 bg-background" onClick={() => show(0)}>
          <Grid3x3 /> Show all photos
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="h-[100dvh] max-w-none rounded-none bg-black p-0 text-white sm:max-w-none" showCloseButton>
          <DialogTitle className="sr-only">
            {title}: photo {index + 1} of {images.length}
          </DialogTitle>
          <div className="relative flex h-full items-center justify-center">
            <div className="relative h-[80dvh] w-full max-w-5xl">
              <Image src={images[index]} alt={`${title}, photo ${index + 1} of ${images.length}`} fill unoptimized className="object-contain" sizes="100vw" />
            </div>
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-sm" aria-live="polite">
              {index + 1} / {images.length}
            </p>
            <Button
              variant="outline"
              size="icon-lg"
              className="absolute left-4 rounded-full bg-white/90 text-black"
              aria-label="Previous photo"
              onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-lg"
              className="absolute right-4 rounded-full bg-white/90 text-black"
              aria-label="Next photo"
              onClick={() => setIndex((i) => (i + 1) % images.length)}
            >
              <ChevronRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
