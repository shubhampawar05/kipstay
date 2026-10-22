"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { Listing } from "@prisma/client";
import type { ListingFormState } from "@/app/actions/listings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AMENITIES, CATEGORIES, PROPERTY_TYPES } from "@/lib/constants";

type Action = (prev: ListingFormState, formData: FormData) => Promise<ListingFormState>;

const selectClass = "h-10 w-full rounded-lg border bg-background px-3 text-sm";

export function ListingForm({ action, listing, submitLabel }: { action: Action; listing?: Listing; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const e = state?.errors ?? {};
  const sent = state?.values;
  // After a failed submit, prefer what was sent over the saved listing.
  const val = <T,>(name: string, fallback: T): string | T => (sent ? ((sent[name] as string | undefined) ?? "") : fallback);
  const checked = (name: string, fallback: boolean | undefined) => (sent ? sent[name] === "on" : !!fallback);

  const field = (name: string, label: string, input: React.ReactNode, hint?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {input}
      {e[name] ? (
        <p className="text-sm text-destructive" id={`${name}-error`}>
          {e[name]}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
  const text = (name: keyof Listing & string, props: React.ComponentProps<"input"> = {}) => (
    <Input id={name} name={name} aria-invalid={!!e[name]} aria-describedby={e[name] ? `${name}-error` : undefined} {...props} />
  );

  return (
    <form action={formAction} className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">The basics</h2>
        {field("title", "Title", text("title", { defaultValue: val("title", listing?.title), maxLength: 80, required: true }))}
        {field(
          "description",
          "Description",
          <Textarea id="description" name="description" rows={6} defaultValue={val("description", listing?.description)} required aria-invalid={!!e.description} />,
          "At least 30 characters. Describe the space, the neighbourhood and what makes it special.",
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {field(
            "propertyType",
            "Property type",
            <select id="propertyType" name="propertyType" defaultValue={val("propertyType", listing?.propertyType ?? "APARTMENT")} className={selectClass}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>,
          )}
          {field(
            "category",
            "Category",
            <select id="category" name="category" defaultValue={val("category", listing?.category ?? "CITY")} className={selectClass}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>,
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Location</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {field("city", "City", text("city", { defaultValue: val("city", listing?.city), required: true }))}
          {field("region", "Region / state", text("region", { defaultValue: val("region", listing?.region), required: true }))}
          {field("country", "Country", text("country", { defaultValue: val("country", listing?.country), required: true }))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Space</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {field("maxGuests", "Max guests", text("maxGuests", { type: "number", min: 1, max: 16, defaultValue: val("maxGuests", listing?.maxGuests ?? 2) }))}
          {field("bedrooms", "Bedrooms", text("bedrooms", { type: "number", min: 0, max: 20, defaultValue: val("bedrooms", listing?.bedrooms ?? 1) }))}
          {field("beds", "Beds", text("beds", { type: "number", min: 1, max: 30, defaultValue: val("beds", listing?.beds ?? 1) }))}
          {field("bathrooms", "Bathrooms", text("bathrooms", { type: "number", min: 0, max: 20, step: 0.5, defaultValue: val("bathrooms", listing?.bathrooms ?? 1) }))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Pricing & stay rules</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {field(
            "pricePerNight",
            "Nightly price (USD)",
            text("pricePerNight", { type: "number", min: 10, step: 1, defaultValue: val("pricePerNight", listing ? listing.pricePerNight / 100 : 120), required: true }),
          )}
          {field("cleaningFee", "Cleaning fee (USD)", text("cleaningFee", { type: "number", min: 0, step: 1, defaultValue: val("cleaningFee", listing ? listing.cleaningFee / 100 : 30) }))}
          {field("minNights", "Minimum nights", text("minNights", { type: "number", min: 1, max: 30, defaultValue: val("minNights", listing?.minNights ?? 1) }))}
          {field("checkInTime", "Check-in from", text("checkInTime", { type: "time", defaultValue: val("checkInTime", listing?.checkInTime ?? "15:00") }))}
          {field("checkOutTime", "Checkout by", text("checkOutTime", { type: "time", defaultValue: val("checkOutTime", listing?.checkOutTime ?? "11:00") }))}
          {field(
            "cancellationPolicy",
            "Cancellation policy",
            <select id="cancellationPolicy" name="cancellationPolicy" defaultValue={val("cancellationPolicy", listing?.cancellationPolicy ?? "FLEXIBLE")} className={selectClass}>
              <option value="FLEXIBLE">Flexible (1 day)</option>
              <option value="MODERATE">Moderate (5 days)</option>
              <option value="STRICT">Strict (14 days)</option>
            </select>,
          )}
        </div>
        {field("houseRules", "House rules", <Textarea id="houseRules" name="houseRules" rows={3} defaultValue={val("houseRules", listing?.houseRules)} />, "One rule per line.")}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="allowsPets" defaultChecked={checked("allowsPets", listing?.allowsPets)} className="size-4 accent-primary" /> Pets allowed
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Amenities</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {AMENITIES.map((a) => (
            <label key={a} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="amenities" value={a} defaultChecked={sent ? (sent.amenities ?? []).includes(a) : listing?.amenities.includes(a)} className="size-4 accent-primary" /> {a}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Photos</h2>
        {field(
          "images",
          "Photo URLs",
          <Textarea
            id="images"
            name="images"
            rows={5}
            defaultValue={val("images", listing?.images.join("\n") ?? "/images/listings/city-1.svg\n/images/listings/bedroom-1.svg\n/images/listings/living-1.svg")}
            className="font-mono text-xs"
            aria-invalid={!!e.images}
          />,
          "One per line, up to 12. Use https:// image URLs or the bundled /images/listings/… artwork. File upload isn't available in this build.",
        )}
      </section>

      <section className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="isPublished" defaultChecked={checked("isPublished", listing?.isPublished ?? true)} className="size-4 accent-primary" /> Published (visible in
          search)
        </label>
      </section>

      {Object.keys(e).length > 0 && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {e.form ?? "Please fix the highlighted fields."}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="h-12 px-8">
        {pending && <Loader2 className="animate-spin" />} {submitLabel}
      </Button>
    </form>
  );
}
