import type { CancellationPolicy, Category, PropertyType } from "@prisma/client";

export const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "BEACH", label: "Beachfront", icon: "Waves" },
  { value: "MOUNTAINS", label: "Mountains", icon: "Mountain" },
  { value: "CITY", label: "City stays", icon: "Building2" },
  { value: "COUNTRYSIDE", label: "Countryside", icon: "Trees" },
  { value: "LAKEFRONT", label: "Lakefront", icon: "Sailboat" },
  { value: "DESERT", label: "Desert", icon: "Sun" },
  { value: "TROPICAL", label: "Tropical", icon: "Palmtree" },
];

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "CABIN", label: "Cabin" },
  { value: "VILLA", label: "Villa" },
  { value: "COTTAGE", label: "Cottage" },
  { value: "LOFT", label: "Loft" },
  { value: "TINY_HOME", label: "Tiny home" },
];

export const AMENITIES = [
  "Wifi",
  "Kitchen",
  "Free parking",
  "Pool",
  "Hot tub",
  "Air conditioning",
  "Heating",
  "Washer",
  "Dedicated workspace",
  "TV",
  "Fireplace",
  "Beach access",
  "EV charger",
  "Smoke alarm",
  "Carbon monoxide alarm",
] as const;

// Shown as quick-toggle chips on the results page (the full list lives in the filters dialog).
export const QUICK_AMENITIES = ["Wifi", "Pool", "Kitchen", "Free parking", "Air conditioning", "Hot tub"] as const;

export const CANCELLATION_POLICIES: Record<CancellationPolicy, { label: string; daysBefore: number }> = {
  FLEXIBLE: { label: "Flexible", daysBefore: 1 },
  MODERATE: { label: "Moderate", daysBefore: 5 },
  STRICT: { label: "Strict", daysBefore: 14 },
};

export const PAGE_SIZE = 18;
export const MAX_GUESTS = 16;

export function propertyTypeLabel(type: PropertyType) {
  return PROPERTY_TYPES.find((p) => p.value === type)?.label ?? type;
}

export function categoryLabel(category: Category) {
  return CATEGORIES.find((c) => c.value === category)?.label ?? category;
}
