import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MESSAGE_MAX } from "@/lib/messages";
import { NewMessageForm } from "./new-message-form";
import { rawImage } from "@/lib/photos";

export const metadata: Metadata = { title: "Contact host" };

const str = (v: string | string[] | undefined) => (typeof v === "string" && v.length <= 40 ? v : undefined);

/** Reference "Contact host" page: listing context plus a first message. Hosts reach it with `guest=` to message a guest. */
export default async function NewMessagePage({ searchParams }: PageProps<"/messages/new">) {
  const sp = await searchParams;
  const listingId = str(sp.listing);
  const guestId = str(sp.guest);
  if (!listingId) notFound();
  const user = await requireUser(`/messages/new?${new URLSearchParams({ listing: listingId, ...(guestId ? { guest: guestId } : {}) })}`);

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, title: true, city: true, country: true, images: true, isPublished: true, hostId: true, host: { select: { name: true } } },
  });
  if (!listing) notFound();
  const asHost = !!guestId && listing.hostId === user.id;
  if (!asHost && (listing.hostId === user.id || !listing.isPublished)) notFound();

  const recipient = asHost ? await prisma.user.findUnique({ where: { id: guestId }, select: { name: true } }) : listing.host;
  if (!recipient) notFound();

  // Already talking about this listing: continue that thread.
  const existing = await prisma.conversation.findUnique({
    where: { listingId_guestId: { listingId: listing.id, guestId: asHost ? guestId! : user.id } },
    select: { id: true },
  });
  if (existing) redirect(`/messages/${existing.id}`);

  const first = recipient.name.split(" ")[0];
  return (
    <div className="mx-auto max-w-[1120px] px-6 py-8 min-[1168px]:px-0">
      <Link
        href={asHost ? "/host" : `/rooms/${listing.id}`}
        className="inline-flex items-center gap-1 rounded-sm text-sm font-medium hover:underline focus-ring"
      >
        <ChevronLeft className="size-4" /> {asHost ? "Host dashboard" : "Back to listing"}
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <h1 className="text-[32px] leading-9 font-semibold">{asHost ? `Message ${first}` : `Contact ${first}`}</h1>
          <p className="mt-2 text-muted-foreground">
            {asHost
              ? "Send your guest arrival details or answer their questions."
              : "Still have questions? Message the host directly. Typical topics: check-in, parking, and the neighbourhood."}
          </p>
          <NewMessageForm listingId={listing.id} guestId={asHost ? guestId : undefined} recipient={first} maxLength={MESSAGE_MAX} />
        </div>
        <aside className="h-fit rounded-xl border border-grey-400 p-5 shadow-elev-1">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-grey-200">
            {listing.images[0] && <Image src={listing.images[0]} alt="" fill unoptimized={rawImage(listing.images[0])} className="object-cover" sizes="360px" />}
          </div>
          <p className="mt-3 font-semibold">{listing.title}</p>
          <p className="text-sm text-muted-foreground">
            {listing.city}, {listing.country} · Hosted by {listing.host.name}
          </p>
        </aside>
      </div>
    </div>
  );
}
