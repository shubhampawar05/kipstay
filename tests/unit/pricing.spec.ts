import { expect, test } from "@playwright/test";
import { calculateQuote } from "../../src/lib/pricing";
import { nightsBetween, parseISODate, rangesOverlap } from "../../src/lib/dates";
import { normaliseGuests, safeNextPath, searchParamsSchema } from "../../src/lib/validation";

const d = (s: string) => parseISODate(s)!;
const listing = { pricePerNight: 10000, cleaningFee: 5000 }; // $100/night, $50 cleaning

test("quotes a short stay with fees and taxes", () => {
  const q = calculateQuote(listing, d("2026-11-10"), d("2026-11-13"));
  expect(q.nights).toBe(3);
  expect(q.subtotal).toBe(30000);
  expect(q.discount).toBe(0);
  // base = 300 + 50 = 350 → service 12% = 42, tax 5% = 17.50
  expect(q.serviceFee).toBe(4200);
  expect(q.taxes).toBe(1750);
  expect(q.total).toBe(35000 + 4200 + 1750);
});

test("applies the weekly discount from 7 nights", () => {
  const q = calculateQuote(listing, d("2026-11-01"), d("2026-11-08"));
  expect(q.nights).toBe(7);
  expect(q.discount).toBe(7000);
  const undiscounted = calculateQuote(listing, d("2026-11-01"), d("2026-11-08"), { applyDiscount: false });
  expect(undiscounted.total).toBeGreaterThan(q.total);
});

test("rejects zero, negative and over-long stays", () => {
  expect(() => calculateQuote(listing, d("2026-11-10"), d("2026-11-10"))).toThrow();
  expect(() => calculateQuote(listing, d("2026-11-10"), d("2026-11-09"))).toThrow();
  expect(() => calculateQuote(listing, d("2026-01-01"), d("2026-06-01"))).toThrow();
});

test("date helpers use half-open night ranges", () => {
  expect(parseISODate("2026-02-31")).toBeNull();
  expect(nightsBetween(d("2026-03-28"), d("2026-04-02"))).toBe(5);
  // Back-to-back stays share a changeover day but no night.
  expect(rangesOverlap(d("2026-11-10"), d("2026-11-12"), d("2026-11-12"), d("2026-11-14"))).toBe(false);
  expect(rangesOverlap(d("2026-11-10"), d("2026-11-13"), d("2026-11-12"), d("2026-11-14"))).toBe(true);
});

test("children, infants or pets imply an adult", () => {
  expect(normaliseGuests({ adults: 0, children: 1, infants: 0, pets: 0 }).adults).toBe(1);
  expect(normaliseGuests({ adults: 0, children: 0, infants: 0, pets: 0 }).adults).toBe(0);
});

test("search params are validated and inverted dates dropped", () => {
  const f = searchParamsSchema.parse({ checkin: "2026-11-12", checkout: "2026-11-10", adults: "abc", page: "-4", amenities: ["Pool", "Nope"] });
  expect(f.checkin).toBeUndefined();
  expect(f.adults).toBe(0);
  expect(f.page).toBe(1);
  expect(f.amenities).toEqual([]);
});

test("post-login redirects stay on this site", () => {
  expect(safeNextPath("/trips")).toBe("/trips");
  expect(safeNextPath("//evil.example")).toBe("/");
  expect(safeNextPath("https://evil.example")).toBe("/");
  expect(safeNextPath("/\\evil.example")).toBe("/");
});
