import type { Category, PropertyType } from "@prisma/client";

/**
 * Destinations for generated listings. Prices are rough nightly USD ranges for a one-bedroom place, chosen to feel
 * plausible per market (public knowledge, not copied from any listing). Every name below is a real place; every
 * listing generated in it is fictional.
 */
export type Place = {
  city: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  /** How many generated listings to add (anchors in seed.ts come on top). */
  count: number;
  price: [number, number];
  categories: Category[];
  types: PropertyType[];
  neighbourhoods: string[];
};

export const PLACES: Place[] = [
  // Existing destinations (anchors live in seed.ts).
  { city: "Lisbon", region: "Lisbon District", country: "Portugal", lat: 38.716, lng: -9.14, count: 10, price: [70, 190], categories: ["CITY", "BEACH"], types: ["APARTMENT", "LOFT", "HOUSE"], neighbourhoods: ["Príncipe Real", "Belém", "Graça", "Alfama", "Chiado", "Cascais Coast", "Campo de Ourique"] },
  { city: "Kyoto", region: "Kyoto Prefecture", country: "Japan", lat: 35.01, lng: 135.77, count: 9, price: [70, 260], categories: ["CITY", "MOUNTAINS"], types: ["HOUSE", "APARTMENT", "COTTAGE"], neighbourhoods: ["Higashiyama", "Nishiki", "Ohara Valley", "Fushimi", "Arashiyama", "Gion"] },
  { city: "Banff", region: "Alberta", country: "Canada", lat: 51.178, lng: -115.57, count: 8, price: [140, 380], categories: ["MOUNTAINS", "LAKEFRONT"], types: ["CABIN", "HOUSE", "APARTMENT"], neighbourhoods: ["Tunnel Mountain", "Canmore Ridge", "Spray Valley", "Bow Valley"] },
  { city: "Lake Tahoe", region: "California", country: "United States", lat: 39.0, lng: -120.05, count: 8, price: [120, 380], categories: ["LAKEFRONT", "MOUNTAINS"], types: ["CABIN", "HOUSE", "TINY_HOME"], neighbourhoods: ["Kings Beach", "Tahoe City", "South Shore", "Incline Village"] },
  { city: "Asheville", region: "North Carolina", country: "United States", lat: 35.595, lng: -82.55, count: 8, price: [90, 280], categories: ["COUNTRYSIDE", "MOUNTAINS"], types: ["HOUSE", "TINY_HOME", "CABIN", "COTTAGE"], neighbourhoods: ["River Arts", "Weaverville", "Black Mountain", "West Asheville"] },
  { city: "Tulum", region: "Quintana Roo", country: "Mexico", lat: 20.21, lng: -87.46, count: 9, price: [90, 420], categories: ["TROPICAL", "BEACH"], types: ["VILLA", "APARTMENT", "TINY_HOME"], neighbourhoods: ["Aldea Zamá", "La Veleta", "Playa Paraíso", "Region 15"] },
  { city: "Santorini", region: "South Aegean", country: "Greece", lat: 36.42, lng: 25.43, count: 9, price: [140, 450], categories: ["BEACH"], types: ["HOUSE", "APARTMENT", "VILLA"], neighbourhoods: ["Imerovigli", "Firostefani", "Pyrgos", "Oia", "Kamari"] },
  { city: "Marrakech", region: "Marrakech-Safi", country: "Morocco", lat: 31.63, lng: -7.99, count: 9, price: [60, 260], categories: ["DESERT", "CITY"], types: ["HOUSE", "VILLA", "TINY_HOME"], neighbourhoods: ["Mouassine", "Palmeraie", "Kasbah", "Mellah", "Agafay"] },
  { city: "Reykjavik", region: "Capital Region", country: "Iceland", lat: 64.146, lng: -21.94, count: 8, price: [120, 300], categories: ["CITY", "MOUNTAINS"], types: ["APARTMENT", "CABIN", "HOUSE"], neighbourhoods: ["Vesturbær", "Hlíðar", "Grótta", "Laugardalur"] },
  { city: "Cape Town", region: "Western Cape", country: "South Africa", lat: -33.925, lng: 18.42, count: 9, price: [70, 320], categories: ["BEACH", "COUNTRYSIDE", "CITY"], types: ["APARTMENT", "COTTAGE", "HOUSE", "VILLA"], neighbourhoods: ["Bo-Kaap", "Constantia", "Muizenberg", "Sea Point", "Camps Bay"] },
  { city: "Goa", region: "Goa", country: "India", lat: 15.5, lng: 73.83, count: 12, price: [30, 220], categories: ["BEACH", "TROPICAL"], types: ["VILLA", "COTTAGE", "APARTMENT"], neighbourhoods: ["Assagao", "Candolim", "Agonda", "Anjuna", "Siolim", "Palolem"] },
  { city: "Bled", region: "Upper Carniola", country: "Slovenia", lat: 46.368, lng: 14.11, count: 6, price: [80, 210], categories: ["LAKEFRONT", "MOUNTAINS"], types: ["CABIN", "APARTMENT", "HOUSE"], neighbourhoods: ["Zasip", "Bohinj Edge", "Mlino"] },
  { city: "Joshua Tree", region: "California", country: "United States", lat: 34.135, lng: -116.31, count: 7, price: [110, 300], categories: ["DESERT"], types: ["HOUSE", "TINY_HOME", "CABIN"], neighbourhoods: ["Yucca Mesa", "Pioneertown", "Flamingo Heights"] },

  // New destinations.
  { city: "New Delhi", region: "Delhi", country: "India", lat: 28.55, lng: 77.22, count: 14, price: [20, 120], categories: ["CITY"], types: ["APARTMENT", "HOUSE", "LOFT"], neighbourhoods: ["Greater Kailash", "Hauz Khas", "Vasant Kunj", "Lajpat Nagar", "Saket", "Defence Colony"] },
  { city: "Noida", region: "Uttar Pradesh", country: "India", lat: 28.57, lng: 77.36, count: 10, price: [20, 90], categories: ["CITY"], types: ["APARTMENT", "LOFT"], neighbourhoods: ["Sector 18", "Sector 50", "Sector 137", "Greater Noida West"] },
  { city: "Gurugram", region: "Haryana", country: "India", lat: 28.46, lng: 77.03, count: 10, price: [25, 110], categories: ["CITY"], types: ["APARTMENT", "LOFT", "HOUSE"], neighbourhoods: ["Golf Course Road", "Sector 57", "DLF Phase 4", "Sohna Road"] },
  { city: "Jaipur", region: "Rajasthan", country: "India", lat: 26.91, lng: 75.79, count: 10, price: [25, 180], categories: ["DESERT", "CITY"], types: ["HOUSE", "VILLA", "APARTMENT"], neighbourhoods: ["C-Scheme", "Bani Park", "Amer", "Malviya Nagar"] },
  { city: "Udaipur", region: "Rajasthan", country: "India", lat: 24.58, lng: 73.68, count: 8, price: [30, 200], categories: ["LAKEFRONT", "CITY"], types: ["HOUSE", "VILLA", "APARTMENT"], neighbourhoods: ["Lake Pichola", "Ambamata", "Fateh Sagar", "Old City"] },
  { city: "Rishikesh", region: "Uttarakhand", country: "India", lat: 30.09, lng: 78.27, count: 8, price: [20, 120], categories: ["MOUNTAINS"], types: ["COTTAGE", "CABIN", "TINY_HOME"], neighbourhoods: ["Tapovan", "Laxman Jhula", "Shivpuri"] },
  { city: "Manali", region: "Himachal Pradesh", country: "India", lat: 32.24, lng: 77.19, count: 9, price: [25, 150], categories: ["MOUNTAINS"], types: ["CABIN", "COTTAGE", "HOUSE"], neighbourhoods: ["Old Manali", "Vashisht", "Naggar", "Solang Valley"] },
  { city: "Munnar", region: "Kerala", country: "India", lat: 10.09, lng: 77.06, count: 7, price: [30, 160], categories: ["COUNTRYSIDE", "MOUNTAINS"], types: ["COTTAGE", "VILLA", "TINY_HOME"], neighbourhoods: ["Chithirapuram", "Pallivasal", "Devikulam"] },
  { city: "Alleppey", region: "Kerala", country: "India", lat: 9.5, lng: 76.34, count: 7, price: [35, 180], categories: ["LAKEFRONT", "TROPICAL"], types: ["COTTAGE", "VILLA", "HOUSE"], neighbourhoods: ["Kumarakom Backwaters", "Marari", "Punnamada"] },
  { city: "Ubud", region: "Bali", country: "Indonesia", lat: -8.51, lng: 115.26, count: 10, price: [40, 260], categories: ["TROPICAL"], types: ["VILLA", "TINY_HOME", "HOUSE"], neighbourhoods: ["Penestanan", "Sayan", "Tegallalang", "Keliki"] },
  { city: "Bangkok", region: "Bangkok", country: "Thailand", lat: 13.74, lng: 100.52, count: 9, price: [30, 160], categories: ["CITY"], types: ["APARTMENT", "LOFT"], neighbourhoods: ["Sukhumvit", "Ari", "Silom", "Thonglor", "Riverside"] },
  { city: "Tokyo", region: "Tokyo", country: "Japan", lat: 35.68, lng: 139.69, count: 10, price: [70, 260], categories: ["CITY"], types: ["APARTMENT", "LOFT", "HOUSE"], neighbourhoods: ["Shibuya", "Shimokitazawa", "Asakusa", "Nakameguro", "Koenji"] },
  { city: "Paris", region: "Île-de-France", country: "France", lat: 48.857, lng: 2.35, count: 10, price: [110, 380], categories: ["CITY"], types: ["APARTMENT", "LOFT"], neighbourhoods: ["Le Marais", "Montmartre", "Saint-Germain", "Canal Saint-Martin", "Batignolles"] },
  { city: "London", region: "England", country: "United Kingdom", lat: 51.51, lng: -0.12, count: 10, price: [110, 360], categories: ["CITY"], types: ["APARTMENT", "HOUSE", "LOFT"], neighbourhoods: ["Shoreditch", "Notting Hill", "Islington", "Greenwich", "Clapham"] },
  { city: "Barcelona", region: "Catalonia", country: "Spain", lat: 41.39, lng: 2.17, count: 9, price: [90, 300], categories: ["CITY", "BEACH"], types: ["APARTMENT", "LOFT"], neighbourhoods: ["Gràcia", "El Born", "Barceloneta", "Eixample", "Poblenou"] },
  { city: "Amalfi Coast", region: "Campania", country: "Italy", lat: 40.63, lng: 14.6, count: 8, price: [150, 480], categories: ["BEACH"], types: ["VILLA", "APARTMENT", "HOUSE"], neighbourhoods: ["Positano", "Praiano", "Ravello", "Atrani"] },
  { city: "Dubai", region: "Dubai", country: "United Arab Emirates", lat: 25.2, lng: 55.27, count: 9, price: [90, 400], categories: ["CITY", "DESERT", "BEACH"], types: ["APARTMENT", "VILLA"], neighbourhoods: ["Dubai Marina", "Downtown", "Jumeirah", "Al Barari"] },
  { city: "Queenstown", region: "Otago", country: "New Zealand", lat: -45.03, lng: 168.66, count: 8, price: [120, 380], categories: ["MOUNTAINS", "LAKEFRONT"], types: ["CABIN", "HOUSE", "APARTMENT"], neighbourhoods: ["Fernhill", "Arrowtown", "Kelvin Heights", "Jack's Point"] },
  { city: "Hallstatt", region: "Upper Austria", country: "Austria", lat: 47.56, lng: 13.65, count: 6, price: [120, 300], categories: ["LAKEFRONT", "MOUNTAINS"], types: ["HOUSE", "APARTMENT", "COTTAGE"], neighbourhoods: ["Lahn", "Obertraun", "Gosau"] },
];
