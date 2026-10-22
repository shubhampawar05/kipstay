import { NextResponse, type NextRequest } from "next/server";
import { countListings } from "@/lib/listings";
import { searchParamsSchema } from "@/lib/validation";

/** Live result count for the Filters dialog's "Show N places" button. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const raw: Record<string, string | string[]> = {};
  for (const key of new Set(sp.keys())) {
    const all = sp.getAll(key);
    raw[key] = all.length > 1 ? all : all[0];
  }
  const count = await countListings(searchParamsSchema.parse(raw));
  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
