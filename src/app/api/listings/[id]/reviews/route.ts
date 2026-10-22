import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const PAGE = 10;

/** Paginated reviews for the "Show all reviews" dialog (newest first). */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/listings/[id]/reviews">) {
  const { id } = await params;
  const page = Math.max(0, Math.min(1000, Number(request.nextUrl.searchParams.get("page")) || 0));
  const listing = await prisma.listing.findFirst({ where: { id, isPublished: true }, select: { id: true } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reviews = await prisma.review.findMany({
    where: { listingId: id },
    orderBy: { createdAt: "desc" },
    skip: page * PAGE,
    take: PAGE + 1,
    select: { id: true, rating: true, comment: true, createdAt: true, author: { select: { name: true, createdAt: true } } },
  });
  return NextResponse.json({
    reviews: reviews.slice(0, PAGE).map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      author: r.author.name.split(" ")[0],
      memberSince: r.author.createdAt.toISOString(),
    })),
    hasMore: reviews.length > PAGE,
  });
}
