# Kipstay

An original, full-stack accommodation marketplace (search, listings, bookings, wishlists, hosting) whose UX was informed by an
evidence-based investigation of Airbnb's public guest flows. See [`REVERSE_ENGINEERING.md`](REVERSE_ENGINEERING.md) for
round 1 (structure and behaviour) and [`REFERENCE_MATCH.md`](REFERENCE_MATCH.md) for round 2 (measured layout, styles and motion).

Kipstay uses its own name, logo, teal brand colour, typeface, copy and artwork. Layout dimensions, neutral greys, radii,
shadows and animation timings were measured from the reference and reproduced. No Airbnb assets, images or code are
reused, and all listings, hosts and reviews are fictional seed data.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui (Base UI primitives), lucide icons, sonner toasts, Leaflet + OpenStreetMap (maps) |
| Data | PostgreSQL 16 + Prisma 6 |
| Auth | Email + password (bcrypt, cost 12) with database-backed sessions in an `httpOnly` cookie |
| Validation | Zod on every server action, route handler and URL parameter |
| Tests | Playwright (end-to-end on desktop and Pixel 7, plus Node-only unit/integration specs) |

## Getting started

Prerequisites: Node 20+ (tested on 26), npm, Docker (for PostgreSQL), Google Chrome (used by Playwright).

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npm run db:up
```

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

```bash
npm run dev
```

Open http://localhost:3000.

> npm 11 blocks dependency install scripts until approved. This repo's `package.json` already approves the
> five that are needed (`prisma`, `@prisma/client`, `@prisma/engines`, `esbuild`, `unrs-resolver`).

### Demo accounts

`npm run db:seed` resets the database and creates `guest@kipstay.test`, `host@kipstay.test` and `host2@kipstay.test`, plus
six reviewer accounts. All of them use the password in `SEED_DEMO_PASSWORD` (see `.env.example`). The guest starts with one
upcoming trip and one saved listing, and the hosts own the 26 seeded listings.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm start` | Production build (runs `prisma generate` first) / serve it |
| `npm run lint` · `npm run typecheck` | ESLint · `tsc --noEmit` |
| `npm run db:up` | Start PostgreSQL in Docker (port 5433) |
| `npm run db:migrate` · `db:seed` · `db:reset` | Apply migrations · reseed · drop and recreate |
| `npm run assets` | Regenerate the SVG listing artwork in `public/images/listings` |
| `npm run test:e2e` | Playwright suite (build first; it starts `next start` on :3100 or reuses a running one) |

## What's implemented

- **Home:** category bar, hero, "Popular homes in …" rows for the top destinations, guest favourites, and a streaming skeleton.
- **Search (`/s`):** URL-driven: destination, check-in/out, adults/children/infants/pets, category, property type, amenities,
  price range, bedrooms, sort and pagination. Date searches exclude listings with overlapping bookings or a longer minimum stay,
  and cards show the all-in total (with a struck-through pre-discount price for 7+ nights).
- **Search bar:** a three-segment desktop pill and a full-screen sheet on mobile.
  - Destination combobox: popular places on focus, DB-backed autocomplete, keyboard support.
  - Range calendar: two months on desktop, past days disabled.
  - Guest steppers: a child, infant or pet adds an adult, as observed on the reference site.
- **Listing detail (`/rooms/[id]`):**
  - Photo mosaic and keyboard lightbox; a swipe strip on phones.
  - Highlights, amenities, house rules and cancellation policy, plus the latest reviews.
  - Inline availability calendar: booked nights disabled, but a booking's first night can still be your checkout day.
  - Sticky booking widget, or a bottom bar on phones.
- **Pricing:** computed only on the server (`src/lib/pricing.ts`): nightly × nights − 10% weekly discount + cleaning +
  12% service fee + 5% tax. The widget fetches `/api/quote`, checkout recomputes, and the booking stores a price snapshot.
- **Booking:**
  - `/book/[id]` re-validates everything server-side: published listing, not your own, no past dates, minimum nights,
    90-night cap, capacity, pets, availability.
  - **Mock payment** that's clearly labelled, collects no card data and needs an explicit acknowledgement.
  - Then a confirmation page with a `mock_` payment reference.
- **Double-booking prevention:** an application check inside a transaction, plus a PostgreSQL exclusion constraint
  (`EXCLUDE USING gist (listingId WITH =, daterange(checkIn, checkOut, '[)') WITH &&) WHERE status <> 'CANCELLED'`). This
  makes overlapping bookings impossible even under concurrent requests.
- **Trips:** upcoming, past and cancelled; reservation detail; cancel before check-in; review after checkout (updates the
  listing's rating).
- **Wishlist:** a heart on every card and detail page, persisted per user. Logged-out clicks redirect to log in and back.
- **Auth:** sign up, log in and log out.
  - Passwords are hashed with bcrypt.
  - The session token is random, and only its SHA-256 is stored.
  - The cookie is `httpOnly` and `SameSite=Lax` (`Secure` in production).
  - Login timing is the same for unknown emails, and failed logins are rate-limited.
  - `?next=` redirects are same-origin only.
- **Host dashboard (`/host`):** stats, upcoming reservations (with host-side cancel), and listings with create, edit,
  publish/unpublish and delete (blocked while upcoming reservations exist). Every mutation is scoped to the owner, and
  other users get a 404.
- **States:** skeletons on home, search, wishlists, trips, host and checkout; empty states; route and global error
  boundaries; and a real 404 status for missing or unpublished listings.
- **Mobile:** bottom tab bar (Explore, Wishlists, Trips, Host, Profile or Log in), search sheet, and a sticky reserve bar.
- Security headers (`nosniff`, `DENY` framing, referrer and permissions policies).

### Round 2: matching the reference (see REFERENCE_MATCH.md)

- **Header:** collapses on scroll into a compact pill that re-expands the full search. The 66 px search pill has
  measured panel styling.
- **Home:** carousel rows fill 7 cards at 1440 px, including "Available in {city} this weekend" with live availability.
- **Results:** chip toolbar plus a **map** with price pins (Leaflet + OpenStreetMap, no API key). The **Filters
  dialog** has a price histogram, a two-thumb slider and a live result count.
- **Listing page:** **photo tour** and fullscreen viewer, sticky **section sub-nav**, **all-reviews dialog** with
  rating distribution, "Where you'll be" map, Share (Web Share or copy link), and "Things to know" dialogs.
- **Host profiles:** a public page at `/users/[id]`.
- **Account settings:** edit name and bio; change password, which signs out every other session.
- **Footer:** "Inspiration for future getaways" tabs built from database destinations.
- **Motion:** measured easing (`cubic-bezier(.2,0,0,1)`), press feedback (heart 1.08/0.92, arrows 30/28 and 26/28),
  shimmer skeletons (1.3 s, staggered 100 ms), sheet and dialog entrances, all disabled under `prefers-reduced-motion`.

### Round 3: interactions and motion

- **Motion:**
  - Rows and cards below the fold fade and lift in on scroll, using one shared IntersectionObserver with a 60 ms stagger. Content already on screen is never hidden, so first paint and hydration are unaffected.
  - Routes fade in (opacity only).
  - The header gains a shadow on scroll, without changing size.
  - On phones, the bottom tab bar slides away while you scroll down and returns when you scroll up (one reading per frame).
  - Cards zoom their photo and lift on hover.
  - Every effect is off under `prefers-reduced-motion`.
- **Card photo carousel:** a scroll-snap track, so it can be swiped on touch screens and slides smoothly with the arrows. The
  dots follow the photo, and photos after the first lazy-load.
- **Wishlist without leaving the page:** a logged-out heart opens "Log in or sign up" in a dialog, as on the reference. Log
  in or sign up inside it and the save completes in place (`AuthForm` `onSuccess`; the server action skips its redirect).
- **Phone listing page:** photos run edge to edge, with Back (returns to your search), Share and Save floating on top and a live
  photo counter. The reserve bar replaces the tab bar.
- **Host calendar (`/host/listings/[id]/calendar`):**
  - Block nights, with an optional private note, and reopen them. Booked nights are shown.
  - Blocks are owner-scoped and validated on the server: no past dates, at most 365 nights, never over a live booking or
    another block.
  - A PostgreSQL exclusion constraint prevents overlapping blocks. A listing row lock serialises blocks against bookings.
  - Search, the "this weekend" row, quotes and checkout all treat blocked nights as unavailable.
- **URL state:**
  - Dates and guests chosen on a listing page are written to the URL with `replaceState`, so refresh, back and Share keep
    them.
  - An out-of-range `?page=` redirects to the last page.
- **Hardening from an audit pass:**
  - Listings with any reservation history can't be deleted; unpublish them instead. The delete runs under the listing lock,
    so trips and receipts survive.
  - Cancellation is a conditional update, so there are no double cancels.
  - Raw ids are validated.
  - Login is rate-limited per email as well as per email+IP.
  - The review form keeps its input after a validation error.
  - The price inputs in Filters no longer clamp while you type.
  - The live count and "more reviews" show error states.
  - Focus rings appear on the booking-widget and search triggers.
  - Outside-click listeners only run while the list is open, and carousel edge checks run at most once per frame.
  - A hidden table header no longer widens the host dashboard on phones.

### Round 4: messaging, named wishlists, map search, category ratings

Gaps came from a fresh REA capture of the reference results page (evidence `ev_254292a8…`, at
`../investigation/evidence/round4_results_ref.*`) and the round-1 listing-page accessibility tree.

- **Header flicker fix:**
  - The home search band now sits in normal page flow under a fixed-height sticky bar, and an IntersectionObserver
    crossfades the compact pill in once the big pill has slid under the bar.
  - Before, collapsing the header shrank it by about 165 px, Chrome's scroll anchoring pulled the page back, and the header
    looped between states.
  - The hidden band is `inert`/`aria-hidden`.
- **Messaging (`/messages`):**
  - "Message host" on listing and trip pages, "Message" per reservation for hosts, an inbox with unread dots, and threads
    that send optimistically and refresh every 8 s while visible.
  - Unread state shows in the account menu and on a Messages tab on phones.
  - One conversation per guest and listing. Only the two participants can read or post (others get a 404). Hosts can only
    message guests who booked. Bodies are 1–2000 characters, enforced with zod and a DB CHECK.
- **Named wishlists:**
  - The heart opens the reference's "Save to wishlist" dialog: list tiles with cover photos, or create a list (50-character
    name with a counter). The toast has a "Change" action.
  - A filled heart removes the stay from every list.
  - `/wishlists` shows list tiles (1 + 2 collage). `/wishlists/[id]` adds rename and delete; other users get a 404.
  - Existing saves were migrated into a "Saved" list.
- **Map search:**
  - Panning or zooming the results map re-runs the search for the visible area (`bbox` in the URL, validated on the server),
    as on the reference.
  - The first map search adds a history entry, so Back returns to the text search.
  - "Search as I move the map" can be turned off, which shows "Search this area" instead.
  - Desktop has an expand-map toggle.
  - Only real user input triggers a search; fitting to results and resizing don't.
- **Category ratings:** reviews rate Cleanliness, Accuracy, Check-in, Communication, Location and Value (required, 1–5,
  DB CHECK). The listing page shows the reference's breakdown row with an icon per category.
- **Search bar motion:** a single white pill slides between Where, When and Who (transform + width, 300 ms standard easing).
- **Listing page:** "Explore other options in and around {city}" links (other stay types here, nearby cities) and a
  breadcrumb.

## Project layout

```
prisma/            schema.prisma, migrations (incl. exclusion + CHECK constraints), seed.ts
scripts/           generate-art.mjs: deterministic original SVG listing artwork
src/lib/           db, auth (sessions), pricing, dates, validation (zod), listings + bookings services
src/app/           routes; actions/ holds server actions (auth, wishlist, bookings, listings)
src/components/    search/, listings/, host/, layout/, ui/ (shadcn)
tests/unit         pricing/validation specs + a DB integration test for the overlap constraint
tests/e2e          search, auth, booking, wishlist, host, mobile
```

## Verification status (2026-10-22, round 4)

| Check | Result |
|---|---|
| `npm run lint` | ✅ no warnings or errors |
| `npm run typecheck` | ✅ no errors |
| `npm run build` | ✅ succeeds (all routes dynamic) |
| `npx playwright test` | ✅ 45 passed, 4 skipped (9 unit/integration, 32 desktop e2e, 4 mobile e2e; the skips are the mobile specs inside the desktop project) |
| Responsive sweep | ✅ 20 pages × 375/390/768/1280/1440 px: no horizontal overflow; no console errors except the intentional 404 |

The e2e suite covers:
- **Search:** autocomplete through results to a listing; date-aware availability and discounts; filters; empty state; capacity; 404.
- **Auth:** sign up, log out, log in; bad credentials; weak password; duplicate email; protected-route redirects.
- **Booking journey:** quote, reserve with mock payment, confirmation, trips, a second user blocked from overlapping
  dates, cancel releasing them, and server-side rule rejections.
- **Wishlist:** logged-out redirect; save, persist and remove.
- **Hosting:** create (with server validation errors), search visibility, edit, non-owner 404, unpublish.
- **Mobile:** tab bar and search sheet; reserve bar.
- **Round 2 features:** profile edit; password change signing out other sessions; reviews dialog; photo tour and viewer;
  host profile; Filters dialog live count; map price pins; header collapse and re-expand.
- **Round 3:**
  - Host calendar: block → guests refused (quote and search) → reopen.
  - Listing dates in the URL survive a reload.
  - Back and forward between results and listing.
  - Card carousel; dropdown closes on Escape (focus returns to the trigger) and on outside click.
  - Scroll reveal and reduced motion.
  - Wishlist login dialog (Escape, then sign up in place).
  - Phone: the photo track is the touch target, and Back returns to the search.
  - DB constraint test for host blocks.

## Not implemented / known limitations

- **Real payments:** only the mock provider exists (`PAYMENT_PROVIDER=mock`). There are no refunds, payouts or invoices.
  The listed cancellation policy is informational; cancellations are always allowed before check-in.
- **Maps** use OpenStreetMap's public tiles, which suit development and light use only (see the
  [tile policy](https://operations.osmfoundation.org/policies/tiles/)). Set `NEXT_PUBLIC_MAP_TILE_URL` to a tile provider
  you're licensed for in production. There's no clustering or search-as-you-move-the-map.
- **Photo uploads:** hosts paste image URLs (or use the bundled artwork). There's no file storage integration.
- **Host calendar** blocks whole nights only. There's no per-night pricing, and no iCal import or export.
- **Messaging** refreshes every 8 s while the tab is visible; there are no push or websocket updates and no email
  notifications. Attachments aren't supported.
- **Map search** uses a simple latitude/longitude box, so it doesn't handle an area crossing the antimeridian.
- **Not built:** social login, email verification, password reset, "Flexible dates" search, Experiences/Services verticals.
- **Rate limiting** is in-memory per server instance; use a shared store (for example Redis) for multi-instance deployments.
- **Currency:** USD only. Date math is calendar-day based (UTC); the date picker renders client-side to use the viewer's local "today".
- **E2E data:** the e2e suite writes test users and bookings to the configured database. Run `npm run db:seed` to reset.
