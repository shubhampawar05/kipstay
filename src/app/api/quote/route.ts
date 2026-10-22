import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkStay } from "@/lib/bookings";
import { bookingRequestSchema } from "@/lib/validation";

/** Server-side price quote and availability check for the booking widget. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const parsed = bookingRequestSchema.safeParse({
    listingId: sp.get("listingId"),
    checkin: sp.get("checkin"),
    checkout: sp.get("checkout"),
    adults: sp.get("adults") ?? 1,
    children: sp.get("children") ?? 0,
    infants: sp.get("infants") ?? 0,
    pets: sp.get("pets") ?? 0,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const user = await getCurrentUser();
  const result = await checkStay(parsed.data, user?.id ?? null);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 200 });
  return NextResponse.json({ ok: true, quote: result.quote }, { headers: { "Cache-Control": "no-store" } });
}
