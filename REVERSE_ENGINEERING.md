# Reverse-Engineering Report — Airbnb public guest flows

Reference target: `https://www.airbnb.com/` (investigated 2026-10-22).
Purpose: guide the UI and behaviour of **Kipstay**, an original accommodation marketplace. Nothing in this
report is copied into the product: no Airbnb logo, imagery, copy, CSS, or code is reused.

## 0. How the investigation was done

| Item | Value |
|---|---|
| Tooling | REA MCP server, `capture_browser_scenario` (Playwright provider `rea-playwright-browser-scenario` v1) |
| Browser | REA-owned, temporary-profile Chromium 155.0.8059.85 launched from `/Applications/Google Chrome.app` |
| Default environment | 1280×720, `en-US`, UTC, light scheme, reduced motion, service workers blocked |
| Account state | Logged out for every capture. No account created, no credentials entered |
| Region | Requests to airbnb.com were redirected to **airbnb.co.in** (`/v2/domain_switch/handoff` → `/?locale=en`), so prices are in INR |
| Raw evidence | `../investigation/evidence/*.json` (full REA Evidence records) plus extracted `*_a11y.txt` / `*_dom.html` |

**Confidence vocabulary used below**
- **Observed**: present in a REA capture (accessibility tree, DOM, URL, or network metadata). The Evidence ID is cited.
- **Inferred**: a reasonable reading of observed data that the capture does not prove.
- **Unknown**: not observed, either because REA could not reach it or because it lives server-side.

### Evidence ledger

| # | Scenario | Evidence ID | Saved file |
|---|---|---|---|
| E1 | Headless home, 5 s settle, a11y + screenshot | `ev_1d9390ff…a50a85f` | (inline only) |
| E2 | Headless home, 12 s settle, network metadata (150 txns) | `ev_1ce0ad54…f78bb` | `home_desktop_network.json` |
| E3 | Headless home DOM | `ev_cf511cb4…daf8055d` | `home_desktop_dom.json` |
| E4 | Click "Where" → suggested destinations | `ev_a2bc1bb2…c6b069` | (inline only) |
| E5 | Type "Goa" → autocomplete | `ev_45de1b5a…54ad14` | `where_autocomplete.json` |
| E6 | Headed home shows the "one price, all fees included" notice | `ev_c6518f91…05f343` | (inline only) |
| E7 | Headed home after dismissing the notice (cards render) | `ev_db14ebc3…027435` | `home_headed.json` |
| E8 | Date picker opened | `ev_026fed13…639451` | `date_picker.json` |
| E9 | Check-in/check-out selected by keyboard | `ev_e36622f9…aeb6f` | (inline only) |
| E10 | Guest picker opened | `ev_40c34dee…5f9cce6` | `guest_picker.json` |
| E11 | Full search → results page | `ev_58765994…e1ee22` | `search_flow.json` |
| E12 | Listing detail page + network | `ev_d7b5a8f1…0f177c` | `listing_detail.json` |
| E13 | Price breakdown dialog | `ev_1626efde…aa70a3` | `price_breakdown.json` |
| E14 | Wishlist heart while logged out | `ev_bb72439c…48d9a9` | `wishlist_logged_out.json` |
| E15 | Reserve while logged out | `ev_b303091…aca105` | `reserve_logged_out.json` |
| E16 | Mobile viewport 375×812 @2x | `ev_56503207…87b86ce` | `home_mobile.json` |

## 1. Reference page structure

### 1.1 Home (`/`): observed in E1, E3, E7

```
skip-link → #site-content
h1 (visually hidden) "Airbnb homepage"
banner
 ├─ logo link (/)
 ├─ search  [data-testid=big-search]
 │   ├─ tablist: All | Homes | Experiences | Services
 │   ├─ "Where"  input#bigsearch-query-location-input  (type=search, name=query,
 │   │           placeholder "Search destinations", data-testid=structured-search-input-field-query)
 │   ├─ "When  Add dates"   div[role=button][aria-expanded]
 │   ├─ "Who   Add guests"  div[role=button][aria-expanded]
 │   └─ Search button  [data-testid=structured-search-input-search-button]
 └─ nav "Profile": Become a host · Log in or sign up · Main navigation menu (hamburger + avatar)
main#site-content
 ├─ carousel group "Available in Gurugram this weekend"   (heading link → /s/<place>/homes?…)
 │    "6 of 9 items showing", Previous [disabled] / Next, 6 listing cards
 ├─ carousel group "Popular homes in South Delhi"
 ├─ carousel group "Guest favourite homes in Noida"
 ├─ carousel group "Explore experiences nearby" (category chips: Cultural tours, Food tours…)
 └─ …
"Inspiration for future getaways": tabs Popular / Arts & culture / Beach / Mountains / Outdoors / Things to do,
   each a list of SEO links "<City> <Type> rentals" + "Show more"
footer (contentinfo): Support / Hosting / Airbnb columns, ©, Privacy · Terms, language + currency buttons, socials
```

- **Observed:** the carousels are personalised by geography. All of them are Delhi-NCR places, which matches the IP-based `.co.in` redirect.
- **Observed (E1–E3 vs E7):** in a **headless** browser `<main>` stayed empty. In a **headed** browser a modal first appeared,
  *"Now you'll see one price for your trip, all fees included." [Got it]* (E6), and the carousels rendered after it was dismissed.
  **Inferred:** content is client-rendered, and the headless build is either served less content or times out. REA did not try to work around this.

### 1.2 Search results (`/s/<Place-Slug>/homes?...`): observed in E11

Submitting the search for "North Goa", 9–12 Nov 2026, 1 child produced:

```
/s/North-Goa/homes?place_id=…&refinement_paths[]=/homes&location_bb=…&acp_id=…
   &date_picker_type=calendar&checkin=2026-11-09&checkout=2026-11-12&children=1&adults=1
   &search_type=autocomplete_click
```

```
banner: compact "little search": Location "Homes in North Goa" · "Check in / Check out 9–12 Nov" · "Guests 2 guests"
filters bar: [Filters] + toggle chips: Free parking · Pool · Free cancellation · Wifi · Air conditioning ·
             Kitchen · Washing machine · Guest favourite · TV · 1+ bathrooms
main
 ├─ h1 "Search results; Over 1,000 homes in North Goa"  + "Prices include all fees"
 ├─ 18–20 listing cards (grid)
 ├─ "Available for similar dates" carousel (cards labelled with alternative dates, e.g. "11 to 13 Nov")
 ├─ "More stays available for your dates"
 ├─ nav "Search results pagination": Previous · 1 2 3 4 … 15 · Next   (20 stays per page → "Showing 20 stays")
 └─ region "Google Map": price-pill markers ("Room in Anjuna, ₹9,018"), zoom, full-screen, one "selected" marker
```

### 1.3 Listing detail (`/rooms/<id>?adults&check_in&check_out`): observed in E12

Top to bottom:
1. h1 title, **Share**, **Add to wishlist** (`data-testid=pdp-save-button-unsaved`)
2. 5-image mosaic (each image is a button) and **Show all photos**
3. h2 "Entire home in Siolim, India" + list: `2 guests · 1 bedroom · 1 bed · 1 bathroom`
4. "Top guest favourite" badge, rating 5.0 and 69 reviews
5. Host summary: "Hosted by Jeveton · Superhost · 5 years hosting"
6. "Listing highlights" (3 short feature blurbs)
7. Description and "What this place offers" (6 amenities, unavailable ones prefixed with "Unavailable:"), "Show all 19 amenities"
8. "3 nights in Siolim" and an **inline 2-month availability calendar** (`data-testid=inline-availability-calendar`, day test IDs `calendar-day-DD/MM/YYYY`)
9. Sticky **booking sidebar** (`complementary "Booking Information"`):
   price button "₹6,000 **Show price breakdown**" + "for 3 nights", a Check-in/Checkout control, a Guests control,
   "Free cancellation before 4 November", **Reserve**, and "You won't be charged yet"
10. Reviews: overall histogram (5→1 stars, %), six sub-ratings (cleanliness, accuracy, check-in, communication, location, value),
    "Guests mention" topic chips, six review snippets with "Show more", and "Show all 69 reviews" (modal)
11. "Where you'll be" (approximate area; "Exact location will be provided after booking")
12. "Meet your host" card: response rate, response time, "Message host"
13. "Things to know": check-in after 1:00 pm, checkout before 10:00 am, house rules, safety, cancellation policy
14. Breadcrumbs (Airbnb › India › Goa › North Goa) and SEO link lists

## 2. Reusable UI components (observed)

| Component | Evidence | Observed anatomy and behaviour | Kipstay equivalent |
|---|---|---|---|
| **Search bar (expanded)** | E3, E4 | Pill with 3 segments (Where / When / Who) + round search button; each segment opens a popover; active segment shows `aria-expanded` | `SearchBar` (desktop) |
| **Search bar (compact)** | E11, E12 | Three buttons summarising location / dates / guests on results and detail pages | `CompactSearch` |
| **Destination suggestions** | E4 | On focus, before typing: group "Suggested destinations", 21 links each with a reason subtitle ("Popular beach destination", "Near you", "For nature lovers") | Popular destinations from DB |
| **Autocomplete** | E5 | Input becomes `combobox [expanded]` + `listbox "Search suggestions"` with options ("North Goa City", "Palolem Beach Beach in South Goa") and a "Clear Input" button | `/api/destinations?q=` |
| **Date-range calendar** | E8, E9 | Tabs *Dates / Flexible*; two months side by side; prev disabled on the current month; past days `disabled` with label "Past dates can't be selected."; day `aria-label` "9, Monday, November 2026. Available. Select as check-in date." changes to "Selected check-in date." / "Selected checkout date."; flexibility radios Exact / ±1 / ±2 / ±3 / ±7 / ±14 days; keyboard help text (arrows = day/week, PgUp/PgDn = month, Backspace = reset) | `DateRangePicker` (accessible, keyboard support) |
| **Guest stepper** | E10 | Rows: Adults "Ages 13 or above", Children "Ages 2–12", Infants "Under 2", Pets ("Bringing a service animal?" link); `−` disabled at 0; `aria-label` "Increase Adults"; hidden live label "0 Adults" | `GuestPicker` |
| **Listing card** | E7, E11 | `role=group` labelled by the title; whole-card link opens **in a new tab** (`target=_blank`); responsive `<picture>`; badge (Guest favourite / Superhost / Top guest favourite); 32 px heart "Add to wishlist: <title>"; image carousel "Photo 1 of 6" + "Next photo"; title "Flat in Arpora"; subtitle (listing name); beds/baths line; total price "₹9,450 for 3 nights"; optional strikethrough "originally ₹29,634"; rating "4.85 (33)"; "Free cancellation" | `ListingCard` (+ `CardCarousel`) |
| **Carousel row** | E7 | Heading link, "6 of 9 items showing", Previous/Next | Home sections |
| **Filter chips** | E11 | Toggle checkboxes + "Filters" button opening the full panel | `FiltersBar` + filters dialog |
| **Price-pill map markers** | E11 | Marker per result with price; selected state | **Not built**: see §6 |
| **Photo mosaic** | E12 | 1 large + 4 small, "Show all photos" | `PhotoGallery` + lightbox |
| **Booking widget** | E12, E13 | Sticky sidebar; price → "Price details" dialog; Reserve; "You won't be charged yet" | `BookingWidget` |
| **Price-details dialog** | E13 | `dialog "Price details"`: "3 nights x ₹2,000.00 ₹6,000.00" | `PriceBreakdown` |
| **Auth modal** | E14 | `dialog "Log in or sign up"`: one identifier field "Phone number or email", Continue, "Continue with Google / Apple" | Email + password auth pages and modal prompt |
| **Informational notice** | E6 | First-visit dialog on "all fees included" pricing | Not needed |
| **Loading skeleton** | E16 | `shimmer-container` with carousels reporting "0 of 0 items showing" while loading | `loading.tsx` skeletons |

### Visual tokens (partial)
- **Observed** font stack: `Airbnb Cereal VF, Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif`.
  Kipstay uses its own stack (Inter via `next/font`).
- **Observed** inline colours `#222222` (primary text), `#ffffff`, and one `#FF5A5F`. Full palette tokens (`--palette-*`) are referenced
  (for example `var(--palette-grey1000)`) but **defined in external CSS that REA did not capture**.
- **Observed** typography token names such as `titles-semibold_22_26`, `title-large32px`, `body-text_16_20`, i.e. a size/line-height scale of 14/18, 16/20, 18/24, 22/26, 26/30, 32/36.
- **Observed** radii in the booking widget: 12 px (`border-top-left-radius: 12px`).
- **Observed** the CSS is atomic, generated by Linaria (`atm_*` classes and `data-testid="linaria-injector"`).
- **Observed** breakpoints `@media (min-width: 950px)` and `(min-width: 1440px)` inline, and image `media="(max-width: 743px)"` / `(min-width: 743.1px)`.
  Card image `sizes` are 342 px (mobile) and 216/219/250 px (desktop tiers at 1127 / 1439 px).
- **Design choice (not observed):** Kipstay uses teal `#0F766E` as the brand colour, `rounded-xl` cards, and Tailwind's default breakpoints (`sm 640 · md 768 · lg 1024 · xl 1280`).

## 3. Interaction flows

### F1 Destination → dates → guests → search (E4, E5, E9, E11)
1. Focus Where → the suggestions list opens (no network wait is visible in a11y, **inferred** preloaded). E2 shows an `AutoSuggestionsQuery` GraphQL call at load.
2. Type → `combobox` + `listbox`. Choosing an option moves on to the date picker (**inferred** from the flow continuing; the calendar was open after selection).
3. Choose check-in, then check-out. The segment label becomes "9 Nov - 12 Nov" with a clear (×) button.
4. Guests: **observed** that adding a child with 0 adults produced `adults=1&children=1` in the URL and the label "2 guests".
   **Rule: a child, infant or pet forces at least one adult.**
5. Search → full page navigation to `/s/<slug>/homes?...` with every parameter in the query string, so **search state is URL-driven and shareable.**

### F2 Results → listing (E11, E12)
Card links carry `adults, check_in, check_out, children` to `/rooms/<id>`, and the detail page pre-fills the calendar and booking widget from them.

### F3 Listing → price breakdown (E13)
The price button (`aria-haspopup=dialog`) opens "Price details". With fees included, the listing showed one line, *nights × nightly = total*.

### F4 Wishlist while logged out (E14)
The heart opens the auth modal instead of saving. **Inferred:** saving needs an authenticated user and saves to a server-side wishlist.

### F5 Reserve while logged out (E15)
`Reserve` navigates to `/book/stays/create?productId=53584424&checkin=…&checkout=…&numberOfAdults=2&numberOfChildren&numberOfInfants&numberOfPets&guestCurrency=INR&isWorkTrip=false`.
The page did not render content within 7 s for the logged-out headed browser. **Unknown:** checkout steps, payment UI, and whether login is forced first.

### F6 Calendar constraints on the detail page (E12)
Day labels encode availability rules:
- "There is a 2-night minimum stay requirement."
- "Available, but has no eligible checkout date due to the 2-night stay requirement."
- "This day is only available for checkout." (the day after the last available night)
- "Unavailable" (disabled), and range labels "Selected start date / Selected. / Selected end date."

**Rule:** nights are half-open intervals `[checkin, checkout)`, so a booked night blocks check-in but can still be a checkout day.

## 4. Responsive observations
- **Desktop 1280 px (E7):** full 3-segment search pill and tabs in the header, "Become a host" visible, 6 cards visible per carousel row.
- **Mobile 375 px (E16):** header keeps the category tabs and When/Who/Search buttons, **drops "Become a host"**, and the profile nav becomes
  "Log in or sign up" + a hamburger link. Carousels first render as shimmer skeletons.
  **Not observed:** a bottom tab bar (the 375 px capture used a desktop UA in a resized window; a real mobile UA may get a different layout).
- **Images:** 342 px wide below 743 px, about 216–250 px on desktop. **Inferred:** single-column cards on phones, 3–6 columns on desktop.

## 5. Functional requirements derived for Kipstay

| ID | Requirement | Source |
|---|---|---|
| R1 | URL-driven search: `/s?location=&checkin=&checkout=&adults=&children=&infants=&pets=&category=&minPrice=&maxPrice=&amenities=&page=` | F1, E11 |
| R2 | Destination suggestions on focus and autocomplete while typing, both backed by the database | E4, E5 |
| R3 | Date-range picker: no past dates, check-out after check-in, keyboard accessible | E8, E9 |
| R4 | Guests: adults ≥ 1 whenever any guest is present; enforce listing capacity | E10, F1 |
| R5 | Filters: price range, property type, amenities chips; paginated results (20 per page) | E11 |
| R6 | Listing card: carousel, wishlist heart, rating, total price for the selected nights | E7, E11 |
| R7 | Detail page: gallery + lightbox, highlights, amenities, availability calendar, reviews, host card, rules | E12 |
| R8 | **Server-side** price computation: nights × nightly price + cleaning + service fee + taxes, shown as a breakdown | E13 |
| R9 | Availability: blocked dates from existing bookings using `[checkin, checkout)` semantics; minimum nights | F6 |
| R10 | Booking conflict prevention at the database level, not only in the UI | F6 (inferred necessity) |
| R11 | Wishlist requires login; logged-out heart sends the user to login and returns them | F4 |
| R12 | Reserve → checkout page → (mock) payment → confirmed reservation; "you won't be charged yet" messaging | F5 |
| R13 | Guest trip management (upcoming/past, cancel) | Not observed (logged-out); standard expectation |
| R14 | Host dashboard: create/edit/unlist listings, see reservations | Not observed (host pages were not investigated) |
| R15 | Loading skeletons, empty states, error boundaries | E16 shimmer |

## 6. Technical assumptions and unresolved questions

**Observed technical facts**
- The frontend calls **persisted GraphQL** over GET: `/api/v3/<OperationName>/<sha256>?operationName&variables&extensions`.
  Operations seen: `Header`, `NaviServerAnnouncementsQuery`, `PromotionsByPlacementsQuery`, `GetConsentForUserQuery`, `AutoSuggestionsQuery`,
  `SearchInputQuery` (POST), `StaysPdpSections` (POST), `StaysPdpBookItQuery`, `PdpAvailabilityCalendarV2Query`, `StaysPdpReviewsQuery`, `SimilarListingsCarouselQuery`.
  REST endpoints seen: `/api/v2/client_configs`, `/api/v2/user_markets`, `/api/v2/get-data-layer-variables`. Telemetry: `/tracking/jitney/logging/messages`, server-side GTM `/sgtm/g/collect`.
- Images are served from `a0.muscache.com/im/pictures/...?im_w=<width>`.

**Unknown (REA cannot or did not observe)**
| Unknown | Why | Kipstay decision |
|---|---|---|
| Server-side pricing formula (fee %, taxes, discounts, the "originally ₹29,634" logic) | Server code and private APIs are not inspectable; the one breakdown captured had fees folded in | Transparent formula: subtotal + cleaning fee + 12% service fee + 5% tax, configurable in `src/lib/pricing.ts` |
| Checkout and payment UI | `/book/stays/create` did not render logged out (E15) | Own checkout page with a **clearly labelled mock payment** |
| Logged-in wishlist UX (collections, naming) | Logging in is out of scope | Single default wishlist per user, with heart toggle |
| Host dashboard | Not investigated (requires a host account) | Own design: listings CRUD, reservations table |
| Search ranking and personalisation | Server-side | Order by rating, then review count, then created date |
| Map | Uses the Google Maps JS API (third-party, needs a key) | Not built: no map key is configured, and a fake map would be misleading. Listing coordinates are stored for a future map |
| Full colour palette | Defined in external stylesheets not captured | Own palette |
| Real mobile layout (bottom tab bar?) | Only a resized desktop UA was captured | Own mobile nav: bottom tab bar + sheet search |
| Response bodies (GraphQL schemas) | Bodies were not captured (privacy and size) | Own Prisma schema |

## 7. Limitations of the investigation
- **Headless vs headed:** headless captures (E1–E5) rendered the shell only. Listings needed headed mode (E7+).
- **Pointer clicks on calendar days and some `div[role=button]` controls timed out**, while keyboard `Enter` via `press` worked. Dates
  and guests were therefore driven by keyboard, the activation path the calendar's own instructions document.
- **The first-visit notice modal (E6)** blocked pointer interaction until dismissed with "Got it". It is informational, not consent or terms.
- **Single region (India) and currency (INR)**, because of the geo redirect. Other markets may show service fees as separate lines.
- **No authenticated flows** were captured (wishlist save, checkout, trips, hosting). No CAPTCHA or bot challenge was seen, and none was bypassed.
- **Evidence files contain third-party content** (host first names, review text, listing photos URLs). They are kept locally for
  traceability outside this repository (`../investigation/`, not committed), and never used as app content. Kipstay seed data is entirely fictional.

## 8. How the findings were used in Kipstay

| Finding (evidence) | Kipstay implementation | Deliberate difference |
|---|---|---|
| 3-segment Where/When/Who pill + round search button (E3, E4) | `src/components/search/search-bar.tsx` | Own styling and teal brand; a full-screen sheet on phones |
| Suggestions on focus; combobox + listbox while typing (E4, E5) | `destination-input.tsx` + `GET /api/destinations` | Suggestions come from Kipstay's own listing data, not geo-personalised |
| Two-month calendar, past days disabled, range labels (E8, E9) | `date-range-calendar.tsx` (react-day-picker range mode) | No "Flexible ±N days" tab (unresolved: needs fuzzy-date search) |
| Child/infant/pet forces ≥1 adult (E11 URL `adults=1&children=1`) | `GuestPicker` + `normaliseGuests()` on the server | Same rule, enforced on both client and server |
| URL-driven search state (E11) | `/s?location=&checkin=&checkout=&adults=…` parsed by Zod | Simpler param names; no place IDs or bounding boxes |
| Card anatomy: carousel, badge, heart, total price, strikethrough (E7, E11) | `listing-card.tsx`, `card-carousel.tsx` | Strikethrough only for a real weekly discount computed server-side |
| Filter chips + Filters dialog + pagination (E11) | `filters.tsx`, `pagination.tsx` | 18 results per page; no map |
| Detail page order: gallery → summary → host → highlights → amenities → calendar → reviews → rules (E12) | `src/app/rooms/[id]/page.tsx` | Fewer sections (no "Where you'll be" map, no host profile page) |
| Calendar rules: min nights, checkout-only days, half-open ranges (F6) | `StayProvider.isDisabled`, `checkStay()`, DB exclusion constraint | Enforced in the database, not only the UI |
| "Show price breakdown" dialog (E13) | `PriceBreakdown` in the widget and checkout | Fees are shown as separate lines rather than folded in |
| Wishlist heart → login when logged out (E14) | `WishlistButton` → `/login?next=` | Email/password login page instead of a modal with social providers |
| Reserve → `/book/stays/create?...` (E15) | `/book/[id]?checkin&checkout&adults…` with a labelled mock payment | Real checkout was not observable, so the design is Kipstay's own |
| Shimmer skeletons while loading (E16) | `src/components/skeletons.tsx` with in-page `<Suspense>` | Skeletons are placed so that 404 and redirect status codes are preserved |
