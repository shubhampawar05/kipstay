-- Host calendar blocks: nights a listing can't be booked.
CREATE TABLE "AvailabilityBlock" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AvailabilityBlock_listingId_startDate_idx" ON "AvailabilityBlock"("listingId", "startDate");

ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Same guarantees as bookings: a non-empty range, and no two blocks on one listing share a night.
ALTER TABLE "AvailabilityBlock"
  ADD CONSTRAINT "AvailabilityBlock_dates_valid" CHECK ("endDate" > "startDate"),
  ADD CONSTRAINT "AvailabilityBlock_no_overlap"
  EXCLUDE USING gist ("listingId" WITH =, daterange("startDate", "endDate", '[)') WITH &&);
