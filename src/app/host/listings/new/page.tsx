import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createListingAction } from "@/app/actions/listings";
import { ListingForm } from "@/components/host/listing-form";

export const metadata: Metadata = { title: "New listing" };

export default async function NewListingPage() {
  await requireUser("/host/listings/new");
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <h1 className="mb-8 text-[32px] leading-9 font-semibold">Create a listing</h1>
      <ListingForm action={createListingAction} submitLabel="Create listing" />
    </div>
  );
}
