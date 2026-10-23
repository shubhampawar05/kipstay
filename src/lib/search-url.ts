// Client-safe helpers for the URL-driven search contract (/s?location=&checkin=&…).

/** Which tab's search: stays go to /s; experiences and services land on their (coming-soon) tab pages. */
export type SearchMode = "homes" | "experiences" | "services";

export function searchModeFor(pathname: string): SearchMode {
  return pathname === "/experiences" ? "experiences" : pathname === "/services" ? "services" : "homes";
}

export type SearchQuery = {
  location?: string;
  /** Services only: a SERVICE_TYPES value. */
  service?: string;
  checkin?: string;
  checkout?: string;
  adults?: number;
  children?: number;
  infants?: number;
  pets?: number;
};

export function searchHref(q: SearchQuery, base: Record<string, string | string[]> = {}): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    for (const item of Array.isArray(v) ? v : [v]) params.append(k, item);
  }
  const set = (k: string, v: string | number | undefined) => {
    params.delete(k);
    if (v !== undefined && v !== "" && v !== 0) params.set(k, String(v));
  };
  set("location", q.location?.trim());
  set("checkin", q.checkin);
  set("checkout", q.checkout);
  set("adults", q.adults);
  set("children", q.children);
  set("infants", q.infants);
  set("pets", q.pets);
  params.delete("page");
  const s = params.toString();
  return s ? `/s?${s}` : "/s";
}

/** Search URL for a tab: `/s?…` for homes, `/experiences?…` or `/services?…` (no pets; services add `service`). */
export function modeSearchHref(mode: SearchMode, q: SearchQuery): string {
  if (mode === "homes") return searchHref(q);
  const params = new URLSearchParams(searchHref({ ...q, pets: undefined }).split("?")[1] ?? "");
  if (mode === "services" && q.service) params.set("service", q.service);
  const s = params.toString();
  return `/${mode}${s ? `?${s}` : ""}`;
}

/** "YYYY-MM-DD" for a local calendar Date from a date picker. */
export function localISO(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Local calendar Date for "YYYY-MM-DD", or undefined. */
export function fromISO(value: string | undefined | null): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 ? date : undefined;
}

export function shortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
