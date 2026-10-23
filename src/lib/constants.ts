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

/** One-line descriptions under home rows (the reference pairs each destination heading with a short tagline). */
export const CITY_TAGLINES: Record<string, string> = {
  Lisbon: "Hilltop lanes and Atlantic light",
  Kyoto: "Temples, gardens and lantern-lit streets",
  Banff: "Peaks and glacier lakes in the Rockies",
  "Lake Tahoe": "Alpine water on the California–Nevada line",
  Asheville: "Blue Ridge views and a lively food scene",
  Tulum: "Cenotes, ruins and Caribbean beaches",
  Santorini: "Caldera sunsets in the Aegean",
  Marrakech: "Riads, souks and the edge of the desert",
  Reykjavik: "Harbour city by the lava fields",
  "Cape Town": "Table Mountain, beaches and vineyards",
  Goa: "Palm-lined beaches on India's west coast",
  Bled: "A lake island among the Julian Alps",
  "Joshua Tree": "Boulder country under dark skies",
  "New Delhi": "Old bazaars, Mughal gardens and leafy colonies",
  Noida: "Planned city next door to Delhi",
  Gurugram: "Business district with rooftop dining",
  Jaipur: "Pink City forts, bazaars and block prints",
  Udaipur: "Palaces reflected in quiet lakes",
  Rishikesh: "Yoga, rafting and the Ganges in the foothills",
  Manali: "Apple orchards under snowy Himalayan peaks",
  Munnar: "Rolling tea estates in the Western Ghats",
  Alleppey: "Backwaters, canals and slow houseboat days",
  Ubud: "Rice terraces and jungle in Bali's heart",
  Bangkok: "Street food, temples and rooftop views",
  Tokyo: "Neon nights and quiet neighbourhood alleys",
  Paris: "Cafés, galleries and walks along the Seine",
  London: "Markets, museums and leafy squares",
  Barcelona: "Gaudí, beaches and late dinners",
  "Amalfi Coast": "Cliffside villages above the Tyrrhenian Sea",
  Dubai: "Skyline, beaches and desert at the door",
  Queenstown: "Adventure capital on a mountain lake",
  Hallstatt: "Alpine village on a mirror-still lake",
};

/** Service types offered on the Services tab's "Type of service" panel (the reference lists these nine). */
export const SERVICE_TYPES = [
  { value: "photography", label: "Photography" },
  { value: "chefs", label: "Chefs" },
  { value: "massage", label: "Massage" },
  { value: "prepared-meals", label: "Prepared meals" },
  { value: "training", label: "Training" },
  { value: "make-up", label: "Make-up" },
  { value: "hair", label: "Hair" },
  { value: "spa", label: "Spa treatments" },
  { value: "catering", label: "Catering" },
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number]["value"];

export function serviceLabel(value: string | undefined | null) {
  return SERVICE_TYPES.find((s) => s.value === value)?.label;
}

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

/** Review categories rated 1–5 alongside the overall rating (reference review form and listing breakdown). */
export const REVIEW_CATEGORIES = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "accuracy", label: "Accuracy" },
  { key: "checkIn", label: "Check-in" },
  { key: "communication", label: "Communication" },
  { key: "location", label: "Location" },
  { key: "value", label: "Value" },
] as const;

export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number]["key"];
