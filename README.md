# Kipstay

An original, full-stack accommodation marketplace (search, listings, bookings, wishlists, hosting) whose UX was informed by an
evidence-based investigation of Airbnb's public guest flows. See [`REVERSE_ENGINEERING.md`](REVERSE_ENGINEERING.md).

Kipstay uses its own name, logo, teal palette, copy and artwork. No Airbnb assets, code or styles are reused, and all
listings, hosts and reviews are fictional seed data.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui (Base UI primitives), lucide icons, sonner toasts |
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

## Verification status (2026-10-22)

| Check | Result |
|---|---|
| `npm run lint` | ✅ no warnings or errors |
| `npm run typecheck` | ✅ no errors |
| `npm run build` | ✅ succeeds (all routes dynamic) |
| `npx playwright test` | ✅ 24 passed, 2 skipped (26 tests: 8 unit/integration, 14 desktop e2e, 2 mobile e2e; the 2 skips are the mobile specs inside the desktop project) |

The e2e suite covers:
- **Search:** autocomplete through results to a listing; date-aware availability and discounts; filters; empty state; capacity; 404.
- **Auth:** sign up, log out, log in; bad credentials; weak password; duplicate email; protected-route redirects.
- **Booking journey:** quote, reserve with mock payment, confirmation, trips, a second user blocked from overlapping
  dates, cancel releasing them, and server-side rule rejections.
- **Wishlist:** logged-out redirect; save, persist and remove.
- **Hosting:** create (with server validation errors), search visibility, edit, non-owner 404, unpublish.
- **Mobile:** tab bar and search sheet; reserve bar.

## Not implemented / known limitations

- **Real payments:** only the mock provider exists (`PAYMENT_PROVIDER=mock`). There are no refunds, payouts or invoices.
  The listed cancellation policy is informational; cancellations are always allowed before check-in.
- **Map view:** the reference uses Google Maps with price pins. No map key is configured, and a fake map would be misleading,
  so coordinates are stored but no map is shown.
- **Photo uploads:** hosts paste image URLs (or use the bundled artwork). There's no file storage integration.
- **Not built:** messaging between guests and hosts, host calendar blocking, multiple named wishlists, social login,
  email verification, password reset, profile editing.
- **Rate limiting** is in-memory per server instance; use a shared store (for example Redis) for multi-instance deployments.
- **Currency:** USD only. Date math is calendar-day based (UTC); the date picker renders client-side to use the viewer's local "today".
- **E2E data:** the e2e suite writes test users and bookings to the configured database. Run `npm run db:seed` to reset.
