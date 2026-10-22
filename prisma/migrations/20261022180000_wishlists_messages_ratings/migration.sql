-- Round 4: named wishlists, guest/host messaging, and per-category review ratings.

-- Review category ratings (1–5). Nullable: reviews written before this migration only have the overall rating.
ALTER TABLE "Review"
  ADD COLUMN "accuracy" INTEGER,
  ADD COLUMN "checkIn" INTEGER,
  ADD COLUMN "cleanliness" INTEGER,
  ADD COLUMN "communication" INTEGER,
  ADD COLUMN "location" INTEGER,
  ADD COLUMN "value" INTEGER;
ALTER TABLE "Review" ADD CONSTRAINT "Review_category_ratings_valid" CHECK (
  ("accuracy" IS NULL OR "accuracy" BETWEEN 1 AND 5) AND ("checkIn" IS NULL OR "checkIn" BETWEEN 1 AND 5) AND
  ("cleanliness" IS NULL OR "cleanliness" BETWEEN 1 AND 5) AND ("communication" IS NULL OR "communication" BETWEEN 1 AND 5) AND
  ("location" IS NULL OR "location" BETWEEN 1 AND 5) AND ("value" IS NULL OR "value" BETWEEN 1 AND 5)
);

-- Named wishlists.
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Wishlist_name_valid" CHECK (char_length(btrim("name")) BETWEEN 1 AND 50)
);
CREATE INDEX "Wishlist_userId_idx" ON "Wishlist"("userId");
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing saves move into one "Saved" list per user.
INSERT INTO "Wishlist" ("id", "userId", "name", "createdAt", "updatedAt")
SELECT 'wl' || substr(md5(random()::text || u."userId"), 1, 23), u."userId", 'Saved', now(), now()
FROM (SELECT DISTINCT "userId" FROM "WishlistItem") u;

ALTER TABLE "WishlistItem" ADD COLUMN "wishlistId" TEXT;
UPDATE "WishlistItem" wi SET "wishlistId" = w."id" FROM "Wishlist" w WHERE w."userId" = wi."userId";
ALTER TABLE "WishlistItem" ALTER COLUMN "wishlistId" SET NOT NULL;
ALTER TABLE "WishlistItem" DROP CONSTRAINT "WishlistItem_pkey";
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("wishlistId", "listingId");
CREATE INDEX "WishlistItem_userId_listingId_idx" ON "WishlistItem"("userId", "listingId");
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Messaging: one conversation per guest per listing.
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guestReadAt" TIMESTAMP(3),
    "hostReadAt" TIMESTAMP(3),
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Conversation_participants_differ" CHECK ("guestId" <> "hostId")
);
CREATE UNIQUE INDEX "Conversation_listingId_guestId_key" ON "Conversation"("listingId", "guestId");
CREATE INDEX "Conversation_guestId_lastMessageAt_idx" ON "Conversation"("guestId", "lastMessageAt");
CREATE INDEX "Conversation_hostId_lastMessageAt_idx" ON "Conversation"("hostId", "lastMessageAt");
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Message_body_valid" CHECK (char_length(btrim("body")) BETWEEN 1 AND 2000)
);
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
