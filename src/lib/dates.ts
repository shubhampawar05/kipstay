// Stay dates are calendar dates without a time zone. They travel as "YYYY-MM-DD"
// strings and are represented as UTC-midnight Date objects everywhere else, which
// matches how Prisma reads and writes PostgreSQL `date` columns.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function parseISODate(value: string | null | undefined): Date | null {
  if (!value || !ISO_DATE.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Reject rollovers such as 2026-02-31.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date;
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayUTC(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
}

/** Local-calendar Date (from a date picker) → the same calendar day at UTC midnight. */
export function fromLocalDay(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

/** UTC-midnight Date → local Date on the same calendar day (for date pickers). */
export function toLocalDay(date: Date): Date {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function formatStayDate(date: Date, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }).format(date);
}

export function formatStayRange(checkIn: Date, checkOut: Date): string {
  const sameMonth =
    checkIn.getUTCMonth() === checkOut.getUTCMonth() && checkIn.getUTCFullYear() === checkOut.getUTCFullYear();
  return sameMonth
    ? `${formatStayDate(checkIn)} – ${checkOut.getUTCDate()}`
    : `${formatStayDate(checkIn)} – ${formatStayDate(checkOut)}`;
}

/** True when the half-open ranges [aStart, aEnd) and [bStart, bEnd) share a night. */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}
