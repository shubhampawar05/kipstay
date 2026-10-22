import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateListingAction } from "@/app/actions/listings";
import { ListingForm } from "@/components/host/listing-form";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: PageProps<"/host/listings/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser(`/host/listings/${id}/edit`);
  const listing = await prisma.listing.findFirst({ where: { id, hostId: user.id } });
  if (!listing) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <h1 className="mb-8 text-[32px] leading-9 font-semibold">Edit listing</h1>
      <ListingForm action={updateListingAction.bind(null, listing.id)} listing={listing} submitLabel="Save changes" />
    </div>
  );
}
