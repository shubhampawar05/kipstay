import type { CancellationPolicy, Category, PropertyType } from "@prisma/client";
import type { Place } from "./places";

/** Small seeded PRNG (mulberry32), so every `npm run db:seed` produces the same data. */
export function createRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)];
  const chance = (p: number) => next() < p;
  /** `n` distinct items in random order. */
  const sample = <T>(items: readonly T[], n: number): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
  };
  return { next, int, pick, chance, sample };
}

export type Rng = ReturnType<typeof createRng>;

export type GeneratedListing = {
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
  minNights: number;
  pets: boolean;
  policy: CancellationPolicy;
  amenities: string[];
  description: string;
  houseRules: string;
  checkInTime: string;
  checkOutTime: string;
  /** Mean of this listing's review scores (4.6–5) and how many reviews to write. */
  quality: number;
  reviews: number;
};

const TYPE_WORD: Record<PropertyType, string[]> = {
  APARTMENT: ["Apartment", "Flat", "Residence"],
  HOUSE: ["House", "Home", "Townhouse", "Retreat"],
  CABIN: ["Cabin", "Chalet", "Lodge", "A-Frame"],
  VILLA: ["Villa", "Estate", "Pool Villa"],
  COTTAGE: ["Cottage", "Bungalow", "Farmhouse"],
  LOFT: ["Loft", "Penthouse"],
  TINY_HOME: ["Tiny Home", "Hideaway", "Dome", "Cabin Pod"],
};

const ADJECTIVES = ["Sunlit", "Quiet", "Garden", "Hillside", "Modern", "Hidden", "Breezy", "Artist's", "Courtyard", "Panorama", "Cosy", "Bright", "Serene", "Stylish", "Rustic", "Elegant", "Airy", "Charming", "Secluded", "Spacious"];

const FEATURES: Record<Category, string[]> = {
  BEACH: ["Ocean Deck", "Sea-View Terrace", "Sunset Balcony", "Beach Path", "Plunge Pool", "Hammock Garden"],
  MOUNTAINS: ["Fireplace", "Valley Views", "Hot Tub", "Forest Deck", "Wood Stove", "Peak Views"],
  CITY: ["Rooftop Terrace", "City Views", "Balcony", "Workspace", "Skyline Views", "Courtyard"],
  COUNTRYSIDE: ["Orchard", "Vineyard Views", "Fire Pit", "Wraparound Porch", "Meadow Views", "Veggie Garden"],
  LAKEFRONT: ["Private Dock", "Lake Views", "Kayaks", "Waterfront Deck", "Boathouse", "Sauna"],
  DESERT: ["Courtyard Pool", "Stargazing Deck", "Rooftop Terrace", "Cowboy Tub", "Desert Views", "Fire Pit"],
  TROPICAL: ["Infinity Pool", "Jungle Views", "Outdoor Shower", "Rice-Field Views", "Garden Pool", "Open-Air Living Room"],
};

const BASE_AMENITIES = ["Wifi", "Smoke alarm"];
const TYPE_AMENITIES: Record<PropertyType, string[]> = {
  APARTMENT: ["Kitchen", "Air conditioning", "Washer", "TV", "Dedicated workspace", "Heating"],
  HOUSE: ["Kitchen", "Free parking", "Washer", "TV", "Heating", "Carbon monoxide alarm"],
  CABIN: ["Kitchen", "Fireplace", "Free parking", "Heating", "Carbon monoxide alarm"],
  VILLA: ["Kitchen", "Pool", "Free parking", "Air conditioning", "Washer", "TV"],
  COTTAGE: ["Kitchen", "Free parking", "Heating", "Fireplace"],
  LOFT: ["Kitchen", "Air conditioning", "Dedicated workspace", "TV", "Washer"],
  TINY_HOME: ["Free parking", "Heating", "Kitchen"],
};
const CATEGORY_AMENITIES: Record<Category, string[]> = {
  BEACH: ["Beach access", "Air conditioning", "Pool"],
  MOUNTAINS: ["Hot tub", "Fireplace", "Heating"],
  CITY: ["Dedicated workspace", "Air conditioning", "EV charger"],
  COUNTRYSIDE: ["Free parking", "Fireplace", "EV charger"],
  LAKEFRONT: ["Hot tub", "Free parking", "Fireplace"],
  DESERT: ["Pool", "Air conditioning", "Hot tub"],
  TROPICAL: ["Pool", "Air conditioning", "Beach access"],
};

const OPENERS: Record<Category, string[]> = {
  BEACH: [
    "Wake up to the sound of the waves in this {type}, a few minutes' walk from the sand.",
    "Salt air, long sunsets and a terrace made for slow breakfasts: this {type} is built around the sea.",
    "A breezy {type} where the days start with a swim and end with the light going gold over the water.",
  ],
  MOUNTAINS: [
    "A warm {type} high above the valley, with trails starting almost at the front door.",
    "Snowy peaks out of every window and a fire waiting when you come in from the cold.",
    "This {type} sits among the pines, quiet enough to hear the river below.",
  ],
  CITY: [
    "Stay right in the middle of {hood}, with cafés, markets and the metro on your doorstep.",
    "A thoughtfully designed {type} for exploring the city on foot, then retreating somewhere calm.",
    "High ceilings, good light and the best of {hood} within a ten-minute walk.",
  ],
  COUNTRYSIDE: [
    "Fields, birdsong and big skies: this {type} is made for slowing down.",
    "A restored {type} surrounded by gardens, with a porch built for long evenings.",
    "Swap traffic for tractors in this peaceful {type} just outside town.",
  ],
  LAKEFRONT: [
    "Step straight from the deck onto the water at this {type} on the shore.",
    "Mornings on the dock, afternoons on the lake and quiet evenings by the fire.",
    "A {type} with the lake as its front garden and the mountains as its backdrop.",
  ],
  DESERT: [
    "Big skies, warm stone and a sky full of stars from this {type} in the desert.",
    "A calm, sun-washed {type} built around a shaded courtyard.",
    "Wide horizons and total quiet: this {type} is a place to switch off.",
  ],
  TROPICAL: [
    "Palms, a private pool and the sound of the jungle all around this {type}.",
    "Open-air living in a {type} where the garden flows right into the rooms.",
    "A lush, light-filled {type} made for lazy days by the water.",
  ],
};

const MIDDLES = [
  "The {bedrooms} sleeps up to {guests}, with crisp linens, blackout curtains and plenty of storage.",
  "Inside you'll find {bedrooms}, a fully equipped kitchen and a living area that opens onto the {feature}.",
  "There's {bedrooms}, fast wifi for working remotely and a {feature} you won't want to leave.",
  "We've furnished it with local pieces, comfortable beds and everything you need for a longer stay.",
];

const CLOSERS = [
  "We live nearby and are always a message away for tips on where to eat.",
  "Self check-in makes arrivals easy, whatever time your flight lands.",
  "Perfect for couples, friends or a small family looking for a calm base.",
  "Ask us about our favourite walks, markets and day trips from {city}.",
];

const RULE_SETS = [
  ["No parties or events.", "Quiet hours after 22:00.", "No smoking indoors."],
  ["No parties or events.", "No smoking.", "Please take off shoes indoors."],
  ["Quiet hours from 23:00 to 07:00.", "No smoking indoors.", "Recycling is collected on Mondays."],
  ["No parties or events.", "No smoking.", "Please turn off the air conditioning when you go out."],
];

const CHECK_IN_TIMES = ["14:00", "15:00", "15:00", "16:00"];
const CHECK_OUT_TIMES = ["10:00", "11:00", "11:00", "12:00"];

function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}

const roundTo5 = (n: number) => Math.max(15, Math.round(n / 5) * 5);

/** Generated listings for one place. `priceCap` keeps an anchor listing as the city's most expensive. */
export function generateForPlace(rng: Rng, place: Place, priceCap?: number): GeneratedListing[] {
  const out: GeneratedListing[] = [];
  const usedTitles = new Set<string>();
  for (let i = 0; i < place.count; i++) {
    const category = rng.pick(place.categories);
    const type = rng.pick(place.types);
    const hood = place.neighbourhoods[i % place.neighbourhoods.length];
    const bedrooms = type === "TINY_HOME" ? rng.int(0, 1) : type === "VILLA" ? rng.int(2, 5) : type === "LOFT" ? rng.int(0, 2) : rng.int(1, 4);
    const beds = Math.max(1, bedrooms + rng.int(0, 2));
    const guests = Math.min(16, Math.max(2, beds * 2 - rng.int(0, 1)));
    const baths = Math.max(1, Math.round((bedrooms * 0.7 + rng.next() * 0.6) * 2) / 2);

    const [lo, hi] = place.price;
    const size = 1 + Math.max(0, bedrooms - 1) * 0.35;
    const typeFactor = type === "VILLA" ? 1.5 : type === "TINY_HOME" ? 0.75 : type === "LOFT" ? 1.1 : 1;
    let price = roundTo5((lo + rng.next() * (hi - lo)) * size * typeFactor);
    if (priceCap) price = Math.min(price, roundTo5(priceCap * 0.95));
    const cleaning = roundTo5(price * (0.15 + rng.next() * 0.15));

    const feature = rng.pick(FEATURES[category]);
    // "Studio" only for places without a separate bedroom.
    const typeWord = bedrooms === 0 && (type === "APARTMENT" || type === "LOFT") ? "Studio" : rng.pick(TYPE_WORD[type]);
    let title = rng.chance(0.5) ? `${rng.pick(ADJECTIVES)} ${typeWord} with ${feature}` : `${rng.pick(ADJECTIVES)} ${typeWord} in ${hood}`;
    while (usedTitles.has(title)) title = `${rng.pick(ADJECTIVES)} ${typeWord} near ${rng.pick(place.neighbourhoods)}`;
    usedTitles.add(title);

    const amenities = [
      ...new Set([
        ...BASE_AMENITIES,
        ...rng.sample(TYPE_AMENITIES[type], rng.int(3, TYPE_AMENITIES[type].length)),
        ...rng.sample(CATEGORY_AMENITIES[category], rng.int(1, 2)),
      ]),
    ];

    const bedroomText = bedrooms === 0 ? "open-plan studio" : `${bedrooms} bedroom${bedrooms > 1 ? "s" : ""}`;
    const vars = { type: typeWord.toLowerCase(), hood, city: place.city, feature: feature.toLowerCase(), guests: String(guests), bedrooms: bedrooms === 0 ? "studio" : bedroomText };
    const description = [
      `${fill(rng.pick(OPENERS[category]), vars)} ${fill(rng.pick(MIDDLES), vars)}`,
      `It's in ${hood}, ${rng.pick(["a short walk from", "an easy drive to", "close to"])} the best of ${place.city}. ${fill(rng.pick(CLOSERS), vars)}`,
    ].join("\n\n");

    // Some brand-new listings (no reviews yet), most with a handful, a few very popular.
    const reviews = rng.chance(0.08) ? 0 : rng.chance(0.2) ? rng.int(12, 26) : rng.int(2, 9);

    out.push({
      title,
      city: place.city,
      region: place.region,
      country: place.country,
      lat: place.lat + (rng.next() - 0.5) * 0.08,
      lng: place.lng + (rng.next() - 0.5) * 0.08,
      category,
      type,
      guests,
      bedrooms,
      beds,
      baths,
      price,
      cleaning,
      minNights: rng.chance(0.35) ? rng.int(2, 3) : 1,
      pets: rng.chance(0.3),
      policy: rng.pick(["FLEXIBLE", "FLEXIBLE", "MODERATE", "STRICT"] as const),
      amenities,
      description,
      houseRules: rng.pick(RULE_SETS).join("\n"),
      checkInTime: rng.pick(CHECK_IN_TIMES),
      checkOutTime: rng.pick(CHECK_OUT_TIMES),
      quality: 4.6 + rng.next() * 0.4,
      reviews,
    });
  }
  return out;
}

// --- People (all invented) ---

const FIRST_NAMES = [
  "Aarav", "Ananya", "Rohan", "Isha", "Kabir", "Meera", "Vikram", "Diya", "Arjun", "Saanvi", "Nikhil", "Tara",
  "Emma", "Liam", "Sofia", "Mateo", "Chloe", "Noah", "Amelia", "Lucas", "Hana", "Kenji", "Yuki", "Mei",
  "Omar", "Layla", "Youssef", "Amira", "Elena", "Marco", "Giulia", "Pierre", "Camille", "Lars", "Freya", "Oskar",
  "Thandi", "Sipho", "Ama", "Kofi", "Ana", "João", "Lucía", "Diego", "Chen", "Wei", "Linh", "Minh",
];
const LAST_NAMES = [
  "Sharma", "Iyer", "Kapoor", "Menon", "Reddy", "Bose", "Mehta", "Nair", "Singh", "Desai",
  "Walker", "Bennett", "Moreau", "Rossi", "García", "Silva", "Novak", "Larsen", "Schmidt", "Kowalski",
  "Tanaka", "Sato", "Kim", "Nguyen", "Haddad", "Mansour", "Okafor", "Mensah", "Dlamini", "Costa",
];

const HOST_BIOS = [
  "Born and raised here. I love sharing the cafés and walks that don't make the guidebooks.",
  "Designer and part-time potter. I furnished our place with pieces from local makers.",
  "We're a family of four who host the home we grew up in. Ask us anything about the area.",
  "Former chef. There's always a list of my favourite places to eat waiting for you.",
  "Hiker, cyclist and early riser. Happy to help plan your days outdoors.",
  "Architect with a soft spot for old buildings. Restoring this one took three years.",
  "I host a few homes with my sister; we're quick to reply and love a good recommendation swap.",
  "Retired teacher who loves gardening. The herbs in the garden are yours to use.",
];

export function makePeople(rng: Rng, n: number, used: Set<string>) {
  const people: { name: string; email: string }[] = [];
  while (people.length < n) {
    const name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
    if (used.has(name)) continue;
    used.add(name);
    const slug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, ".");
    people.push({ name, email: `${slug}@kipstay.test` });
  }
  return people;
}

export function hostBio(rng: Rng) {
  return rng.pick(HOST_BIOS);
}

// --- Reviews (all invented) ---

const REVIEW_OPENERS = [
  "Exactly like the photos.",
  "What a find!",
  "We had a wonderful stay.",
  "Such a peaceful place.",
  "Great value for the location.",
  "One of our favourite stays so far.",
  "Comfortable, clean and well equipped.",
  "Lovely home in a great spot.",
];
const REVIEW_DETAILS: Record<Category, string[]> = {
  BEACH: ["The beach is a few minutes away and the sunsets from the terrace were unreal.", "We swam every morning and the outdoor shower was a nice touch."],
  MOUNTAINS: ["The fireplace kept us cosy after long days on the trails.", "Waking up to those views never got old."],
  CITY: ["Everything was walkable and the neighbourhood is full of great food.", "Quiet at night despite being so central."],
  COUNTRYSIDE: ["We loved the garden and the total quiet.", "The porch was perfect for evening drinks."],
  LAKEFRONT: ["Kayaking straight off the dock was the highlight.", "Morning coffee looking over the water was magical."],
  DESERT: ["The stars at night were incredible.", "The courtyard stayed cool even in the afternoon heat."],
  TROPICAL: ["The pool was spotless and we barely left the garden.", "Falling asleep to the sounds of the jungle was so relaxing."],
};
const REVIEW_HOST = [
  "{host} was super responsive and gave great recommendations.",
  "Check-in was easy and {host} checked in to make sure we had everything.",
  "{host} left a lovely welcome note and some local snacks.",
  "Communication with {host} was quick and friendly.",
];
const REVIEW_MINOR = [
  "The wifi dropped a couple of times, but nothing major.",
  "The street can get a little noisy in the morning.",
  "The stairs are steep, so pack light.",
  "Parking was a bit tricky to find.",
];
const REVIEW_CLOSERS = ["Would definitely stay again.", "Highly recommend.", "We'll be back!", "Thanks for having us.", ""];

export function reviewText(rng: Rng, category: Category, hostFirstName: string, rating: number) {
  const parts = [rng.pick(REVIEW_OPENERS), rng.pick(REVIEW_DETAILS[category])];
  if (rng.chance(0.6)) parts.push(fill(rng.pick(REVIEW_HOST), { host: hostFirstName }));
  if (rating < 5) parts.push(rng.pick(REVIEW_MINOR));
  parts.push(rng.pick(REVIEW_CLOSERS));
  return parts.filter(Boolean).join(" ");
}

/** A 1–5 score around `quality`: mostly 5s and 4s, a rare 3, as review averages cluster at 4.7–5 on real platforms. */
export function score(rng: Rng, quality: number) {
  if (rng.chance(0.03)) return 3;
  return Math.max(4, Math.min(5, Math.round(quality + (rng.next() - 0.5))));
}
