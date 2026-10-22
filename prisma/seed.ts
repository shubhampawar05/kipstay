/* Seeds Kipstay with fictional users, listings, reviews and bookings.
 * Every person, listing name and review here is invented. Run: npm run db:seed */
import { PrismaClient, type Category, type PropertyType, type CancellationPolicy } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculateQuote } from "../src/lib/pricing";
import { addDays, todayUTC } from "../src/lib/dates";

const prisma = new PrismaClient();
const password = process.env.SEED_DEMO_PASSWORD;
if (!password) throw new Error("Set SEED_DEMO_PASSWORD (see .env.example) before seeding.");

type Seed = {
  title: string;
  city: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  category: Category;
  type: PropertyType;
  guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  price: number; // dollars per night
  cleaning: number; // dollars
  minNights?: number;
  pets?: boolean;
  policy?: CancellationPolicy;
  amenities: string[];
  blurb: string;
};

const SCENE: Record<Category, string> = {
  BEACH: "beach",
  MOUNTAINS: "mountains",
  CITY: "city",
  COUNTRYSIDE: "countryside",
  LAKEFRONT: "lakefront",
  DESERT: "desert",
  TROPICAL: "tropical",
};

const listings: Seed[] = [
  { title: "Tidewater Cottage with Ocean Deck", city: "Lisbon", region: "Lisbon District", country: "Portugal", lat: 38.69, lng: -9.42, category: "BEACH", type: "COTTAGE", guests: 4, bedrooms: 2, beds: 2, baths: 1, price: 145, cleaning: 40, amenities: ["Wifi", "Kitchen", "Beach access", "Washer", "Smoke alarm"], blurb: "Wake up to the Atlantic from a whitewashed cottage a short walk from the sand." },
  { title: "Alfama Rooftop Loft", city: "Lisbon", region: "Lisbon District", country: "Portugal", lat: 38.71, lng: -9.13, category: "CITY", type: "LOFT", guests: 2, bedrooms: 1, beds: 1, baths: 1, price: 98, cleaning: 25, amenities: ["Wifi", "Kitchen", "Air conditioning", "Dedicated workspace", "Smoke alarm"], blurb: "A sunlit loft above tiled lanes, with a private terrace over the river." },
  { title: "Tram 28 Family Apartment", city: "Lisbon", region: "Lisbon District", country: "Portugal", lat: 38.715, lng: -9.14, category: "CITY", type: "APARTMENT", guests: 6, bedrooms: 3, beds: 4, baths: 2, price: 172, cleaning: 55, minNights: 2, amenities: ["Wifi", "Kitchen", "Washer", "TV", "Heating", "Smoke alarm", "Carbon monoxide alarm"], blurb: "Room for the whole family on a quiet street right on the historic tram line." },
  { title: "Machiya Townhouse near Kamo River", city: "Kyoto", region: "Kyoto Prefecture", country: "Japan", lat: 35.0, lng: 135.77, category: "CITY", type: "HOUSE", guests: 4, bedrooms: 2, beds: 3, baths: 1, price: 189, cleaning: 50, minNights: 2, amenities: ["Wifi", "Kitchen", "Heating", "Air conditioning", "Washer", "Smoke alarm"], blurb: "A restored wooden townhouse with a moss garden and a cedar soaking tub." },
  { title: "Arashiyama Bamboo Retreat", city: "Kyoto", region: "Kyoto Prefecture", country: "Japan", lat: 35.01, lng: 135.67, category: "MOUNTAINS", type: "COTTAGE", guests: 3, bedrooms: 1, beds: 2, baths: 1, price: 210, cleaning: 45, policy: "MODERATE", amenities: ["Wifi", "Hot tub", "Heating", "Free parking", "Smoke alarm"], blurb: "Forest views, a private onsen-style tub, and quiet mornings at the edge of the hills." },
  { title: "Gion Compact Studio", city: "Kyoto", region: "Kyoto Prefecture", country: "Japan", lat: 35.0, lng: 135.78, category: "CITY", type: "APARTMENT", guests: 2, bedrooms: 0, beds: 1, baths: 1, price: 82, cleaning: 20, amenities: ["Wifi", "Air conditioning", "Heating", "Dedicated workspace"], blurb: "Small, smart and steps from lantern-lit streets and late-night ramen." },
  { title: "Glacier View A-Frame", city: "Banff", region: "Alberta", country: "Canada", lat: 51.18, lng: -115.57, category: "MOUNTAINS", type: "CABIN", guests: 6, bedrooms: 3, beds: 4, baths: 2, price: 265, cleaning: 80, minNights: 2, pets: true, policy: "STRICT", amenities: ["Wifi", "Kitchen", "Fireplace", "Hot tub", "Free parking", "Heating", "Washer", "Smoke alarm", "Carbon monoxide alarm"], blurb: "Floor-to-ceiling windows frame the peaks; the hot tub frames the stars." },
  { title: "Bow River Log Cabin", city: "Banff", region: "Alberta", country: "Canada", lat: 51.17, lng: -115.55, category: "MOUNTAINS", type: "CABIN", guests: 4, bedrooms: 2, beds: 2, baths: 1, price: 189, cleaning: 60, pets: true, amenities: ["Wifi", "Kitchen", "Fireplace", "Free parking", "Heating", "Smoke alarm"], blurb: "A hand-built log cabin with a wood stove, a porch swing and river sounds." },
  { title: "Emerald Bay Lake House", city: "Lake Tahoe", region: "California", country: "United States", lat: 38.95, lng: -120.1, category: "LAKEFRONT", type: "HOUSE", guests: 8, bedrooms: 4, beds: 5, baths: 3, price: 420, cleaning: 120, minNights: 3, policy: "STRICT", amenities: ["Wifi", "Kitchen", "Hot tub", "Fireplace", "Free parking", "Washer", "TV", "EV charger", "Smoke alarm", "Carbon monoxide alarm"], blurb: "Private dock, kayaks and a wraparound deck right on the clearest water you've seen." },
  { title: "Pine Shore Tiny Home", city: "Lake Tahoe", region: "California", country: "United States", lat: 39.1, lng: -120.03, category: "LAKEFRONT", type: "TINY_HOME", guests: 2, bedrooms: 1, beds: 1, baths: 1, price: 129, cleaning: 30, pets: true, amenities: ["Wifi", "Kitchen", "Heating", "Free parking", "Smoke alarm"], blurb: "Everything you need, nothing you don't, and the lake at the end of the trail." },
  { title: "Blue Ridge Farmhouse", city: "Asheville", region: "North Carolina", country: "United States", lat: 35.6, lng: -82.55, category: "COUNTRYSIDE", type: "HOUSE", guests: 10, bedrooms: 5, beds: 6, baths: 3, price: 310, cleaning: 110, minNights: 2, pets: true, amenities: ["Wifi", "Kitchen", "Fireplace", "Free parking", "Washer", "TV", "Dedicated workspace", "Smoke alarm", "Carbon monoxide alarm"], blurb: "A restored 1920s farmhouse on twelve acres with a barn, a creek and long views." },
  { title: "Treetop Studio in the Woods", city: "Asheville", region: "North Carolina", country: "United States", lat: 35.58, lng: -82.6, category: "COUNTRYSIDE", type: "TINY_HOME", guests: 2, bedrooms: 1, beds: 1, baths: 1, price: 115, cleaning: 25, amenities: ["Wifi", "Heating", "Air conditioning", "Free parking"], blurb: "A cosy studio on stilts among the oaks, ten minutes from downtown breweries." },
  { title: "Lagoon Edge Bungalow", city: "Tulum", region: "Quintana Roo", country: "Mexico", lat: 20.21, lng: -87.46, category: "TROPICAL", type: "VILLA", guests: 4, bedrooms: 2, beds: 2, baths: 2, price: 235, cleaning: 60, amenities: ["Wifi", "Pool", "Air conditioning", "Kitchen", "Beach access", "Smoke alarm"], blurb: "Thatched roof, plunge pool and a hammock strung between two palms." },
  { title: "Jungle Villa with Cenote Path", city: "Tulum", region: "Quintana Roo", country: "Mexico", lat: 20.2, lng: -87.5, category: "TROPICAL", type: "VILLA", guests: 8, bedrooms: 4, beds: 4, baths: 4, price: 480, cleaning: 140, minNights: 3, policy: "MODERATE", amenities: ["Wifi", "Pool", "Air conditioning", "Kitchen", "Washer", "Dedicated workspace", "Free parking", "Smoke alarm"], blurb: "Four suites around a saltwater pool, with a private path to a swimming cenote." },
  { title: "Caldera Cave House", city: "Santorini", region: "South Aegean", country: "Greece", lat: 36.46, lng: 25.38, category: "BEACH", type: "HOUSE", guests: 2, bedrooms: 1, beds: 1, baths: 1, price: 290, cleaning: 50, minNights: 2, policy: "STRICT", amenities: ["Wifi", "Hot tub", "Air conditioning", "Kitchen"], blurb: "A carved cave home with a heated plunge pool facing the sunset." },
  { title: "Oia Whitewash Suite", city: "Santorini", region: "South Aegean", country: "Greece", lat: 36.46, lng: 25.37, category: "BEACH", type: "APARTMENT", guests: 3, bedrooms: 1, beds: 2, baths: 1, price: 205, cleaning: 40, amenities: ["Wifi", "Air conditioning", "Kitchen", "Beach access"], blurb: "Blue doors, white walls and a terrace for long breakfasts over the sea." },
  { title: "Medina Riad with Courtyard Pool", city: "Marrakech", region: "Marrakech-Safi", country: "Morocco", lat: 31.63, lng: -7.99, category: "DESERT", type: "HOUSE", guests: 6, bedrooms: 3, beds: 3, baths: 3, price: 175, cleaning: 45, amenities: ["Wifi", "Pool", "Air conditioning", "Kitchen", "TV"], blurb: "A tiled riad with orange trees, a courtyard pool and a rooftop for mint tea." },
  { title: "Agafay Desert Dome", city: "Marrakech", region: "Marrakech-Safi", country: "Morocco", lat: 31.45, lng: -8.15, category: "DESERT", type: "TINY_HOME", guests: 2, bedrooms: 1, beds: 1, baths: 1, price: 140, cleaning: 30, amenities: ["Free parking", "Air conditioning", "Heating"], blurb: "Sleep under a canvas dome in rocky desert, forty minutes from the medina." },
  { title: "Black Sand Cabin", city: "Reykjavik", region: "Capital Region", country: "Iceland", lat: 64.13, lng: -21.9, category: "MOUNTAINS", type: "CABIN", guests: 4, bedrooms: 2, beds: 3, baths: 1, price: 230, cleaning: 60, minNights: 2, amenities: ["Wifi", "Kitchen", "Hot tub", "Heating", "Free parking", "Smoke alarm"], blurb: "Watch for the northern lights from a geothermal hot tub on the lava fields." },
  { title: "Harbour Design Flat", city: "Reykjavik", region: "Capital Region", country: "Iceland", lat: 64.15, lng: -21.94, category: "CITY", type: "APARTMENT", guests: 3, bedrooms: 1, beds: 2, baths: 1, price: 160, cleaning: 35, amenities: ["Wifi", "Kitchen", "Heating", "Washer", "Dedicated workspace", "Smoke alarm"], blurb: "Nordic design, harbour views and the best bakeries just around the corner." },
  { title: "Vineyard Cottage", city: "Cape Town", region: "Western Cape", country: "South Africa", lat: -33.93, lng: 18.86, category: "COUNTRYSIDE", type: "COTTAGE", guests: 4, bedrooms: 2, beds: 2, baths: 2, price: 135, cleaning: 35, pets: true, amenities: ["Wifi", "Pool", "Kitchen", "Free parking", "Fireplace"], blurb: "A stone cottage among the vines, with mountain views and a wine farm next door." },
  { title: "Camps Bay Penthouse", city: "Cape Town", region: "Western Cape", country: "South Africa", lat: -33.95, lng: 18.38, category: "BEACH", type: "APARTMENT", guests: 6, bedrooms: 3, beds: 3, baths: 2, price: 340, cleaning: 80, minNights: 2, policy: "MODERATE", amenities: ["Wifi", "Pool", "Air conditioning", "Kitchen", "Washer", "TV", "Free parking", "Smoke alarm"], blurb: "Panoramic Atlantic views from an infinity pool beneath Table Mountain." },
  { title: "Palolem Beach Hut", city: "Goa", region: "South Goa", country: "India", lat: 15.01, lng: 74.02, category: "BEACH", type: "COTTAGE", guests: 2, bedrooms: 1, beds: 1, baths: 1, price: 55, cleaning: 10, amenities: ["Wifi", "Beach access", "Air conditioning"], blurb: "A breezy hut on stilts, ten steps from a crescent of sand and calm water." },
  { title: "Assagao Courtyard Villa", city: "Goa", region: "North Goa", country: "India", lat: 15.6, lng: 73.77, category: "TROPICAL", type: "VILLA", guests: 8, bedrooms: 4, beds: 5, baths: 4, price: 260, cleaning: 60, minNights: 2, pets: true, amenities: ["Wifi", "Pool", "Air conditioning", "Kitchen", "Washer", "Free parking", "Dedicated workspace", "Smoke alarm"], blurb: "A Portuguese-era villa with a courtyard pool, shaded verandas and a cook on request." },
  { title: "Lakeside Chalet on Bled", city: "Bled", region: "Upper Carniola", country: "Slovenia", lat: 46.36, lng: 14.09, category: "LAKEFRONT", type: "CABIN", guests: 5, bedrooms: 2, beds: 3, baths: 1, price: 150, cleaning: 40, amenities: ["Wifi", "Kitchen", "Fireplace", "Free parking", "Heating", "Smoke alarm"], blurb: "Row out to the island church, then warm up by the fire in a timber chalet." },
  { title: "Joshua Tree Star House", city: "Joshua Tree", region: "California", country: "United States", lat: 34.13, lng: -116.31, category: "DESERT", type: "HOUSE", guests: 4, bedrooms: 2, beds: 2, baths: 2, price: 225, cleaning: 70, minNights: 2, pets: true, amenities: ["Wifi", "Hot tub", "Air conditioning", "Kitchen", "Free parking", "EV charger", "Smoke alarm"], blurb: "A low adobe house among boulders, with a cowboy tub and a telescope on the roof." },
];


// Extra fictional stays per city so every home-page row can fill a 7-card carousel.
const NEIGHBOURHOODS: Record<string, string[]> = {
  Lisbon: ["Príncipe Real", "Belém", "Graça", "Cascais Coast"],
  Kyoto: ["Higashiyama", "Nishiki", "Ohara Valley", "Fushimi"],
  Banff: ["Tunnel Mountain", "Canmore Ridge", "Spray Valley"],
  "Lake Tahoe": ["Kings Beach", "Tahoe City", "South Shore"],
  Asheville: ["River Arts", "Weaverville", "Black Mountain"],
  Tulum: ["Aldea Zamá", "La Veleta", "Playa Paraíso"],
  Santorini: ["Imerovigli", "Firostefani", "Pyrgos"],
  Marrakech: ["Mouassine", "Palmeraie", "Kasbah"],
  Reykjavik: ["Vesturbær", "Hlíðar", "Grótta"],
  "Cape Town": ["Bo-Kaap", "Constantia", "Muizenberg"],
  Goa: ["Assagao Hills", "Candolim", "Agonda"],
  Bled: ["Zasip", "Bohinj Edge"],
  "Joshua Tree": ["Yucca Mesa", "Pioneertown"],
};
const ADJECTIVES = ["Sunlit", "Quiet", "Garden", "Hillside", "Modern", "Hidden", "Breezy", "Artist's", "Courtyard", "Panorama"];
const TYPE_WORD: Record<PropertyType, string> = {
  APARTMENT: "Apartment",
  HOUSE: "House",
  CABIN: "Cabin",
  VILLA: "Villa",
  COTTAGE: "Cottage",
  LOFT: "Loft",
  TINY_HOME: "Hideaway",
};
const baseCount = listings.length;
for (let i = 0; i < baseCount; i++) {
  const base = listings[i];
  const hoods = NEIGHBOURHOODS[base.city] ?? [];
  const extra = hoods.filter((_, j) => (i + j) % 2 === 0 || hoods.length <= 3).slice(0, 3);
  extra.forEach((hood, j) => {
    const scale = 0.75 + ((i * 7 + j * 13) % 9) / 10; // 0.75–1.55
    listings.push({
      ...base,
      title: `${ADJECTIVES[(i + j * 3) % ADJECTIVES.length]} ${TYPE_WORD[base.type]} in ${hood}`,
      lat: base.lat + (j + 1) * 0.011,
      lng: base.lng - (j + 1) * 0.013,
      price: Math.max(40, Math.round((base.price * scale) / 5) * 5),
      cleaning: Math.round(base.cleaning * scale),
      guests: Math.max(2, base.guests + ((j % 3) - 1) * 2),
      bedrooms: Math.max(1, base.bedrooms + ((j % 3) - 1)),
      beds: Math.max(1, base.beds + ((j % 3) - 1)),
      blurb: `${base.blurb} Tucked away in ${hood}, it's a calm base with easy access to the best of ${base.city}.`,
    });
  });
}

const reviewers = [
  { name: "Maya Okafor", email: "maya@kipstay.test" },
  { name: "Lucas Brandt", email: "lucas@kipstay.test" },
  { name: "Priya Raman", email: "priya@kipstay.test" },
  { name: "Tomás Herrera", email: "tomas@kipstay.test" },
  { name: "Aiko Tanaka", email: "aiko@kipstay.test" },
  { name: "Noor Haddad", email: "noor@kipstay.test" },
];

const reviewTexts = [
  "Spotless, quiet and exactly like the photos. The host had thought of every little detail.",
  "Great location and a really comfortable bed. Check-in was easy and communication was quick.",
  "We loved the views and the kitchen was well stocked. Would happily stay again.",
  "A calm, beautiful place to recharge. A couple of minor quirks but nothing that mattered.",
  "Perfect for our family trip. Plenty of space and the kids didn't want to leave.",
  "Lovely stay. The neighbourhood has great food within walking distance.",
  "The host's local tips made our trip. Clean, cosy and very well maintained.",
];

const CATEGORY_KEYS = ["cleanliness", "accuracy", "checkIn", "communication", "location", "value"] as const;

async function main() {
  console.log("Clearing existing data…");
  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.review.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.wishlist.deleteMany(),
    prisma.availabilityBlock.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.listing.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash(password!, 12);
  const [host, host2, guest] = await Promise.all([
    prisma.user.create({ data: { name: "Ines Carvalho", email: "host@kipstay.test", passwordHash, isHost: true, bio: "Architect turned host. I love restoring old buildings and sharing my favourite neighbourhood spots." } }),
    prisma.user.create({ data: { name: "Daniel Mbeki", email: "host2@kipstay.test", passwordHash, isHost: true, bio: "Outdoor guide and coffee enthusiast. Happy to help plan your hikes." } }),
    prisma.user.create({ data: { name: "Sam Rivera", email: "guest@kipstay.test", passwordHash } }),
  ]);
  const reviewerUsers = await Promise.all(reviewers.map((r) => prisma.user.create({ data: { ...r, passwordHash } })));

  const today = todayUTC();
  let index = 0;
  for (const s of listings) {
    index++;
    const scene = SCENE[s.category];
    const v = ((index - 1) % 4) + 1;
    const listing = await prisma.listing.create({
      data: {
        hostId: index % 3 === 0 ? host2.id : host.id,
        title: s.title,
        description: `${s.blurb}\n\nThe space has ${s.bedrooms === 0 ? "an open-plan studio" : `${s.bedrooms} bedroom${s.bedrooms > 1 ? "s" : ""}`} and sleeps up to ${s.guests}. You'll have the whole place to yourself, with fresh linens, towels and the essentials ready on arrival.\n\nThe neighbourhood is great for exploring on foot, and we're always a message away if you need recommendations.`,
        propertyType: s.type,
        category: s.category,
        city: s.city,
        region: s.region,
        country: s.country,
        latitude: s.lat,
        longitude: s.lng,
        maxGuests: s.guests,
        bedrooms: s.bedrooms,
        beds: s.beds,
        bathrooms: s.baths,
        pricePerNight: s.price * 100,
        cleaningFee: s.cleaning * 100,
        minNights: s.minNights ?? 1,
        allowsPets: s.pets ?? false,
        amenities: s.amenities,
        images: [
          `/images/listings/${scene}-${v}.svg`,
          `/images/listings/bedroom-${((index + 0) % 4) + 1}.svg`,
          `/images/listings/living-${((index + 1) % 4) + 1}.svg`,
          `/images/listings/kitchen-${((index + 2) % 4) + 1}.svg`,
          `/images/listings/bathroom-${((index + 3) % 4) + 1}.svg`,
          `/images/listings/${scene}-${(v % 4) + 1}.svg`,
        ],
        houseRules: "No parties or events.\nQuiet hours after 22:00.\nNo smoking indoors.",
        cancellationPolicy: s.policy ?? "FLEXIBLE",
      },
    });

    // Past stays with reviews (2–5 per listing), each tied to a completed booking.
    const reviewCount = 2 + (index % 4);
    for (let r = 0; r < reviewCount; r++) {
      const author = reviewerUsers[(index + r) % reviewerUsers.length];
      const nights = Math.max(listing.minNights, 2 + (r % 3));
      const checkIn = addDays(today, -30 * (r + 1) - index);
      const checkOut = addDays(checkIn, nights);
      const q = calculateQuote(listing, checkIn, checkOut);
      const booking = await prisma.booking.create({
        data: { listingId: listing.id, guestId: author.id, checkIn, checkOut, adults: 2, nights: q.nights, nightlyPrice: q.nightlyPrice, subtotal: q.subtotal, discount: q.discount, cleaningFee: q.cleaningFee, serviceFee: q.serviceFee, taxes: q.taxes, total: q.total, paymentRef: `mock_seed_${index}_${r}` },
      });
      await prisma.review.create({
        data: {
          listingId: listing.id,
          authorId: author.id,
          bookingId: booking.id,
          rating: (index + r) % 5 === 0 ? 4 : 5,
          // Deterministic category scores, mostly 5 with the odd 4, so listings get distinct breakdowns.
          ...Object.fromEntries(CATEGORY_KEYS.map((k, c) => [k, (index + r + c) % 7 === 0 ? 4 : 5])),
          comment: reviewTexts[(index + r) % reviewTexts.length],
          createdAt: addDays(checkOut, 2),
        },
      });
    }

    // An upcoming stay on most listings, so availability calendars show blocked dates.
    if (index % 4 !== 0) {
      const checkIn = addDays(today, 10 + (index % 7) * 3);
      const checkOut = addDays(checkIn, Math.max(listing.minNights, 3));
      const q = calculateQuote(listing, checkIn, checkOut);
      await prisma.booking.create({
        data: { listingId: listing.id, guestId: reviewerUsers[index % reviewerUsers.length].id, checkIn, checkOut, adults: 2, nights: q.nights, nightlyPrice: q.nightlyPrice, subtotal: q.subtotal, discount: q.discount, cleaningFee: q.cleaningFee, serviceFee: q.serviceFee, taxes: q.taxes, total: q.total, paymentRef: `mock_seed_future_${index}` },
      });
    }

    const agg = await prisma.review.aggregate({ where: { listingId: listing.id }, _avg: { rating: true }, _count: { _all: true } });
    await prisma.listing.update({
      where: { id: listing.id },
      data: { avgRating: Math.round((agg._avg.rating ?? 0) * 100) / 100, reviewCount: agg._count._all },
    });
  }

  // The demo guest starts with one upcoming trip and one saved place.
  const first = await prisma.listing.findFirstOrThrow({ where: { title: "Alfama Rooftop Loft" } });
  const checkIn = addDays(today, 45);
  const checkOut = addDays(checkIn, 4);
  const q = calculateQuote(first, checkIn, checkOut);
  await prisma.booking.create({
    data: { listingId: first.id, guestId: guest.id, checkIn, checkOut, adults: 2, nights: q.nights, nightlyPrice: q.nightlyPrice, subtotal: q.subtotal, discount: q.discount, cleaningFee: q.cleaningFee, serviceFee: q.serviceFee, taxes: q.taxes, total: q.total, paymentRef: "mock_seed_demo" },
  });
  const saved = await prisma.listing.findFirstOrThrow({ where: { title: "Glacier View A-Frame" } });
  const list = await prisma.wishlist.create({ data: { userId: guest.id, name: "Mountain escapes" } });
  await prisma.wishlistItem.create({ data: { wishlistId: list.id, userId: guest.id, listingId: saved.id } });

  // ...and one conversation with the host of their upcoming trip.
  await prisma.conversation.create({
    data: {
      listingId: first.id,
      guestId: guest.id,
      hostId: first.hostId,
      lastMessageAt: addDays(new Date(), -1),
      guestReadAt: new Date(),
      messages: {
        create: [
          { senderId: guest.id, body: "Hi! Is there somewhere to leave our bags if we arrive before check-in?", createdAt: addDays(new Date(), -2) },
          { senderId: first.hostId, body: "Of course. There's a luggage room by the entrance; I'll send the code the day before you arrive.", createdAt: addDays(new Date(), -1) },
        ],
      },
    },
  });

  console.log(`Seeded ${listings.length} listings, ${3 + reviewers.length} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
