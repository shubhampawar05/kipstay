import { NextResponse, type NextRequest } from "next/server";
import { findDestinations } from "@/lib/listings";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 60);
  const destinations = await findDestinations(q);
  return NextResponse.json({ destinations }, { headers: { "Cache-Control": "public, max-age=60" } });
}
