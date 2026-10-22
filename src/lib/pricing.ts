import { nightsBetween } from "./dates";

// All amounts are integer cents. This module is the only place prices are
// computed; the UI renders quotes produced here on the server.

export const SERVICE_FEE_RATE = 0.12;
export const TAX_RATE = 0.05;
export const WEEKLY_DISCOUNT_RATE = 0.1;
export const WEEKLY_DISCOUNT_MIN_NIGHTS = 7;
export const MAX_NIGHTS = 90;

export type PricedListing = {
  pricePerNight: number;
  cleaningFee: number;
};

export type Quote = {
  nights: number;
  nightlyPrice: number;
  subtotal: number;
  discount: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
  currency: "USD";
};

export function calculateQuote(
  listing: PricedListing,
  checkIn: Date,
  checkOut: Date,
  opts: { applyDiscount?: boolean } = {},
): Quote {
  const nights = nightsBetween(checkIn, checkOut);
  if (!Number.isInteger(nights) || nights < 1) throw new RangeError("Check-out must be after check-in");
  if (nights > MAX_NIGHTS) throw new RangeError(`Stays are limited to ${MAX_NIGHTS} nights`);

  const subtotal = listing.pricePerNight * nights;
  const discountable = (opts.applyDiscount ?? true) && nights >= WEEKLY_DISCOUNT_MIN_NIGHTS;
  const discount = discountable ? Math.round(subtotal * WEEKLY_DISCOUNT_RATE) : 0;
  const taxableBase = subtotal - discount + listing.cleaningFee;
  const serviceFee = Math.round(taxableBase * SERVICE_FEE_RATE);
  const taxes = Math.round(taxableBase * TAX_RATE);

  return {
    nights,
    nightlyPrice: listing.pricePerNight,
    subtotal,
    discount,
    cleaningFee: listing.cleaningFee,
    serviceFee,
    taxes,
    total: taxableBase + serviceFee + taxes,
    currency: "USD",
  };
}

export function formatMoney(cents: number, opts: { cents?: boolean } = {}): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(cents / 100);
}
