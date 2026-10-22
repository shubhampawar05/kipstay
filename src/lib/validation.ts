import { z } from "zod";
import { AMENITIES, MAX_GUESTS } from "./constants";
import { parseISODate } from "./dates";

const optionalString = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => (v ? v : undefined));

const isoDate = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const date = parseISODate(v);
    if (!date) {
      ctx.addIssue({ code: "custom", message: "Use YYYY-MM-DD dates" });
      return z.NEVER;
    }
    return date;
  });

const count = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

const guests = {
  adults: count(0, MAX_GUESTS).catch(0),
  children: count(0, MAX_GUESTS).catch(0),
  infants: count(0, 5).catch(0),
  pets: count(0, 5).catch(0),
};

/** Applies the observed rule that children, infants or pets imply at least one adult. */
export function normaliseGuests<T extends { adults: number; children: number; infants: number; pets: number }>(g: T): T {
  const needsAdult = g.children + g.infants + g.pets > 0;
  return { ...g, adults: needsAdult ? Math.max(1, g.adults) : g.adults };
}

const toArray = (v: unknown) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

export const searchParamsSchema = z
  .object({
    location: optionalString,
    checkin: isoDate,
    checkout: isoDate,
    ...guests,
    category: z.enum(["BEACH", "MOUNTAINS", "CITY", "COUNTRYSIDE", "LAKEFRONT", "DESERT", "TROPICAL"]).optional().catch(undefined),
    type: z
      .preprocess(toArray, z.array(z.enum(["APARTMENT", "HOUSE", "CABIN", "VILLA", "COTTAGE", "LOFT", "TINY_HOME"])))
      .catch([]),
    amenities: z.preprocess(toArray, z.array(z.enum(AMENITIES))).catch([]),
    minPrice: z.coerce.number().int().min(0).max(100000).optional().catch(undefined),
    maxPrice: z.coerce.number().int().min(0).max(100000).optional().catch(undefined),
    bedrooms: z.coerce.number().int().min(0).max(20).optional().catch(undefined),
    sort: z.enum(["recommended", "price_asc", "price_desc", "rating"]).catch("recommended"),
    page: z.coerce.number().int().min(1).max(500).catch(1),
  })
  .transform((s) => {
    // A half-specified or inverted date range is dropped rather than half-applied.
    const datesValid = s.checkin && s.checkout && s.checkout > s.checkin;
    return {
      ...normaliseGuests(s),
      checkin: datesValid ? s.checkin : undefined,
      checkout: datesValid ? s.checkout : undefined,
    };
  });

export type SearchFilters = z.infer<typeof searchParamsSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  password: z
    .string()
    .min(10, "Use at least 10 characters")
    .max(128)
    .regex(/[a-zA-Z]/, "Include a letter")
    .regex(/[0-9]/, "Include a number"),
});

const newPassword = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128)
  .regex(/[a-zA-Z]/, "Include a letter")
  .regex(/[0-9]/, "Include a number");

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  bio: z.string().trim().max(500, "Keep your bio under 500 characters").default(""),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(128),
    newPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] })
  .refine((v) => v.newPassword !== v.currentPassword, { message: "Choose a password you haven't used here", path: ["newPassword"] });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  password: z.string().min(1, "Enter your password").max(128),
});

export const bookingRequestSchema = z
  .object({
    listingId: z.string().min(1).max(40),
    checkin: z.string().refine((v) => parseISODate(v) !== null, "Invalid check-in date"),
    checkout: z.string().refine((v) => parseISODate(v) !== null, "Invalid check-out date"),
    adults: count(1, MAX_GUESTS),
    children: count(0, MAX_GUESTS).default(0),
    infants: count(0, 5).default(0),
    pets: count(0, 5).default(0),
  })
  .transform((b) => ({ ...b, checkIn: parseISODate(b.checkin)!, checkOut: parseISODate(b.checkout)! }));

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export const reviewSchema = z.object({
  bookingId: z.string().min(1).max(40),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10, "Tell future guests a little more (10+ characters)").max(1000),
});

const dollars = (label: string, min: number) =>
  z.coerce
    .number({ message: `${label} must be a number` })
    .min(min, `${label} must be at least $${min}`)
    .max(10000, `${label} must be at most $10,000`)
    .transform((v) => Math.round(v * 100));

export const listingSchema = z.object({
  title: z.string().trim().min(5, "Title needs at least 5 characters").max(80),
  description: z.string().trim().min(30, "Description needs at least 30 characters").max(4000),
  propertyType: z.enum(["APARTMENT", "HOUSE", "CABIN", "VILLA", "COTTAGE", "LOFT", "TINY_HOME"]),
  category: z.enum(["BEACH", "MOUNTAINS", "CITY", "COUNTRYSIDE", "LAKEFRONT", "DESERT", "TROPICAL"]),
  city: z.string().trim().min(2).max(60),
  region: z.string().trim().min(2).max(60),
  country: z.string().trim().min(2).max(60),
  maxGuests: count(1, MAX_GUESTS),
  bedrooms: count(0, 20),
  beds: count(1, 30),
  bathrooms: z.coerce.number().min(0).max(20).multipleOf(0.5, "Use whole or half bathrooms"),
  pricePerNight: dollars("Nightly price", 10),
  cleaningFee: dollars("Cleaning fee", 0),
  minNights: count(1, 30),
  allowsPets: z.coerce.boolean().default(false),
  amenities: z.preprocess(toArray, z.array(z.enum(AMENITIES))).default([]),
  images: z
    .string()
    .transform((v) =>
      v
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(
          z
            .string()
            .max(500)
            .refine(
              (u) => u.startsWith("/images/") || /^https:\/\/[^\s]+$/.test(u),
              "Each photo must be an https:// URL or a /images/ path",
            ),
        )
        .min(1, "Add at least one photo URL")
        .max(12, "Up to 12 photos"),
    ),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  houseRules: z.string().trim().max(2000).default(""),
  cancellationPolicy: z.enum(["FLEXIBLE", "MODERATE", "STRICT"]),
  isPublished: z.coerce.boolean().default(false),
});

export type ListingInput = z.infer<typeof listingSchema>;

/** A host closing nights on their calendar: [start, end) like a stay, so `end` is the first night open again. */
export const blockSchema = z
  .object({
    listingId: z.string().min(1).max(40),
    start: z.string().refine((v) => parseISODate(v) !== null, "Choose a start date"),
    end: z.string().refine((v) => parseISODate(v) !== null, "Choose an end date"),
    note: z.string().trim().max(120, "Keep the note under 120 characters").default(""),
  })
  .transform((b) => ({ ...b, startDate: parseISODate(b.start)!, endDate: parseISODate(b.end)! }))
  .refine((b) => b.endDate > b.startDate, { message: "Choose at least one night", path: ["end"] });

/** Only allow same-origin relative redirects after login. */
export function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next.slice(0, 500);
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}
