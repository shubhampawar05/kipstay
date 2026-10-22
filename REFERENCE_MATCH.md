# Reference match — evidence and gap analysis (round 2)

Round 1 is in [`REVERSE_ENGINEERING.md`](REVERSE_ENGINEERING.md). This round measured the reference's *styles and
motion* rather than just its structure, and drove the visual upgrade on branch `feature/reference-match`.

## How the evidence was gathered (REA)

| What | REA operation | Evidence |
|---|---|---|
| Home @1440×900, DOM + full network bodies (inline Linaria CSS) | `capture_browser_scenario` (headed Chrome) | `ev_c8a6fba2…bc56` |
| The reference's main stylesheet (1.83 MB, sha256 `ef20ba99…14ee`) | `capture_browser_scenario` navigating to the public CSS URL | `ev_efb220a9…3d05e` |
| Home states: Where panel, calendar, guests, menu, scrolled header | `capture_browser_scenario`, screenshot per step | `ev_88debfd9…c5b4` |
| Results @1440: list, scrolled, Filters dialog | same | `ev_e1701da5…f4d7` |
| Listing @1440: top, scrolled (sticky sub-nav), photo tour | same | `ev_c4103ff4…20a0` |
| Mobile 390×844 @2x and tablet 820×1100 home | same | `ev_3c048693…8485`, `ev_95e98a7d…69b4` |

All of it was exported with `export_evidence_bundle` to `../investigation/evidence/bundle-v2-*.json` and is not
committed. Element styles were resolved by mapping each element's atomic classes (`atm_*`) in the captured DOM to rules in
the captured stylesheet (`investigation/scripts/ref_tree.py`). Values below are **observed** unless marked otherwise.

## Measured design system

| Token | Observed value |
|---|---|
| Text primary / secondary / tertiary | `#222222` / `#6C6C6C` (`#6A6A6A` legacy "foggy") / `#8C8C8C` |
| Borders | `#DDDDDD` (secondary), `#B0B0B0` (inputs), `#EBEBEB` (dividers, hover fill) |
| Surfaces | white, `#F7F7F7` (bg-secondary, footer, range band), `#F2F2F2` |
| Radii scale | 4, 8, 12, 16, 20, 24, 28, 32 px; listing card media **20 px**; search pill **32 px**; chips 24 px; badge 14 px |
| Elevation | primary `0 6px 20px rgba(0,0,0,.2)`, secondary `0 6px 16px rgba(0,0,0,.12)`, high `0 8px 28px rgba(0,0,0,.28)`, tertiary `0 2px 4px rgba(0,0,0,.18)` |
| Type scale | 12/16, 14/18, 16/20, 18/24, 22/26, 26/30, 32/36 (size/line-height px); weights 400/500/600/700; cards use **13/16** |
| Motion | standard `cubic-bezier(.2,0,0,1)`, enter `cubic-bezier(.1,.9,.2,1)`, exit `cubic-bezier(.4,0,1,1)`; spring "fast" ≈ 452 ms, "standard" ≈ 584 ms (`linear(...)` easings) |
| Spacing | 2/4/8/12/16/24/32/40/48/64/80 px |
| Breakpoints | 744, 950, 1128, 1440 px |

## Component measurements

| Component | Observed |
|---|---|
| Header | Sticky, z-index 100; height 80 px (96 px ≥1440); inline padding 24 / 32 (≥950) / 48 (≥1440); max width 1920. Home: a white→`#F8F8F8` gradient band holding the big search, closed by a 1 px `#EBEBEB` rule |
| Header on scroll / inner pages | Collapses to a compact pill "Anywhere \| Anytime \| Add guests" with a 32 px round search button, view-transition morph ~250 ms |
| Big search pill | Height 66 px, radius 32, max width 850, 3-segment grid (2fr / 1fr / 1fr); segment padding 15 × 32; label 12/16 medium, value 14/18 secondary; segment hover fill `#EBEBEB`; when a panel is open the bar fills `#EBEBEB` and the active segment turns white and raised; search button 48 px circle that widens into a "Search" pill while editing |
| Panels | White, radius 32, elevation high; destination panel ~425 px with 48 px icon tiles (radius 12); calendar panel spans the bar, 2 months, 48 px day cells, black selected circles and `#F7F7F7` range band; guest panel ~425 px, right-aligned, 32 px outlined steppers |
| Menu | ~240 px card, radius 16, elevation, grouped items 14 px, separators |
| Section header | h2 20/24 semibold (18/24 below 744) with 28 px arrow circle (hover scale 28/26); carousel prev/next 28 px circles, hover `scale(30/28)`, active `scale(26/28)`, 250 ms standard easing |
| Listing card | Media aspect **20:19**, radius 20; badge: 80 % white, radius 14, padding 5.5 × 9.5, semibold, elevation; heart 32 px with `drop-shadow(0 2px 6px rgba(0,0,0,.25))`, hover `scale(1.08)`, active `scale(.92)`, 250 ms; text 13/16, title medium; 7 cards per row at 1440, 4 at 820, ~2.2 on phones |
| Results | Filter chip bar (chips 12/16, min-height 32, radius 24, border `#DDDDDD`→`#C1C1C1` on hover, press shrinks 2 px); two-column card list + sticky rounded map with price pills; numbered pagination |
| Filters dialog | Centered, max width 720, radius 32, elevation; sticky header (title + close) and footer ("Clear all" link + dark "Show N places" button); price histogram with two-thumb slider |
| Listing page | Max content 1120; title 26/30; Share/Save underlined links; 5-photo mosaic radius 12, gap 8, "Show all photos"; sticky sub-nav (Photos, Amenities, Reviews, Location) after scrolling; booking card radius 12 with elevation, outlined date/guest box with 10 px uppercase labels, gradient Reserve (radius 8, 48 px) |
| Photo tour | Full-page overlay: back circle top-left, Share/Save top-right, thumbnails, photo groups |
| Mobile | "Start your search" pill (radius full, elevation); chip-style tabs; bottom tab bar (Explore, Wishlists, Log in) with brand-colored active item |
| Skeletons | Shimmer `background` keyframes `#EBEBEB`→`#F7F7F7` (25 %) over 1.3 s, staggered 100 ms per item |
| Dialogs on phones | Bottom sheet, radius 32 32 0 0, slide up from 100 % over 500 ms |
| Reduced motion | Every transition/animation has a `prefers-reduced-motion: reduce` override to `none` |

## Gap analysis (Kipstay round-1 build vs reference)

| Area | Kipstay before | Action |
|---|---|---|
| Tokens | shadcn neutral grays, 10 px radius, Inter | Adopt the measured neutrals, radii, elevation, motion; Figtree (open-source geometric sans close to the reference's proprietary face). Brand stays **teal** |
| Header | Single 80 px bar; search always shown | Home band + big search; collapse to compact pill on scroll; compact pill on inner pages that expands the full search |
| Search | Popovers with default styling | Restyle to the measured pill/panels; active-segment states; destination tiles; 48 px calendar days; outlined steppers |
| Category nav | Underlined icon tabs | Keep (it's Kipstay's equivalent of the reference's tab row), restyle to 14/18 medium + 2 px underline, 35 px gaps |
| Cards / home rows | 4-column grid, 20:19 crop already | Horizontal carousels with section arrow link + prev/next buttons; badge, heart, text sizes as measured |
| Results | Grid only, no map | Chip bar; list + **map** (Leaflet + OpenStreetMap tiles, no API key) with price pins; restyled Filters dialog with price histogram, range slider and live result count |
| Listing page | Functional but plain | Measured layout; sticky sub-nav; booking card restyle; rating hero; **all-reviews dialog**; **photo tour**; **Share** (copy link) |
| Host profiles | Host card only | **`/users/[id]` host profile** page (reference links "Go to host full profile") |
| Account | Read-only profile | **Edit name/bio, change password** (reference has account settings) |
| Footer | 3 columns | Inspiration tabs (destinations from the database) + columns + bottom bar, `#F7F7F7` background |
| Skeletons | Pulse | Reference shimmer timing |
| Motion | Ad-hoc | Measured easings/durations, press feedback, panel fades, sheet slide-up, header collapse; reduced-motion overrides |

**Not reproduced (deliberately):** the reference's logo, illustrations, 3D tab icons, laurel artwork, Cereal typeface and
pink "Rausch" brand gradient; the Experiences/Services verticals (Kipstay has no such inventory, so tabs for them would
be fake); "Flexible dates" (needs fuzzy-date search, see README); Google Maps (replaced by OpenStreetMap).

**Unknown / approximated:**
- Exact spring curves for the header morph (view transitions); approximated with 250–300 ms standard easing.
- Pixel values hidden behind runtime CSS variables set by JavaScript (e.g. carousel column counts); derived from screenshots.
- Hover-only states could not be triggered by REA (it has no hover action); they come from the CSS rules, not observation.

## What was implemented (branch `feature/reference-match`)

| Area | Change | Main files |
|---|---|---|
| Tokens | Measured neutrals, radii, elevation, easing, spacing; Figtree font; `page-gutter` (24/32/48 px); focus ring `0 0 0 2px #fff, 0 0 0 4px #222`; shimmer, panel, sheet and dialog keyframes; `prefers-reduced-motion` override | `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/button.tsx` (`brand`, `dark`, `xl`), `src/components/ui/skeleton.tsx` |
| Header | 80/96 px sticky header; home gradient band with the 66 px search; collapses to a compact pill after 40 px of scroll (but stays open while a panel is in use); compact pill on inner pages expands the full search over a dimmed page; 40 px grey icon buttons; restyled menu | `src/components/layout/header-shell.tsx`, `header-search.tsx`, `site-header.tsx`, `user-menu.tsx`, `brand/logo.tsx` |
| Search | Measured pill and segments, active/hover states, search button that widens to "Search"; 425 px destination panel with 48 px tiles; 2-month calendar with 48 px day cells, black selected circles, `#F7F7F7` band; outlined 32 px guest steppers; phone sheet with inline suggestions | `src/components/search/search-bar.tsx`, `destination-input.tsx`, `date-range-calendar.tsx`, `guest-picker.tsx` |
| Home | Full-width rows instead of a hero; carousels (2.2 / 4 / 5 / 6 / 7 columns) with arrow heading and 28 px prev/next; "Available in {city} this weekend" with real availability and 2-night totals; category tabs with an "All" tab (chips on phones) | `src/app/page.tsx`, `src/components/listings/listing-row.tsx`, `search/category-bar.tsx` |
| Cards | 20:19 media, 20 px radius, frosted badge, 32 px heart (1.08 / 0.92 scale, drop-shadow, save pop), photo arrows fading in on hover; compact (13/16) and full variants | `listings/listing-card.tsx`, `card-carousel.tsx`, `wishlist-button.tsx` |
| Results | Chip toolbar (Filters, categories, amenities); list + sticky rounded **map** with price pills, hover sync and popups; floating "Show map / Show list" below 1128 px; Filters dialog with recommended tiles, type chips, **price histogram + two-thumb slider**, bedrooms stepper, amenities, **live "Show N places" count** | `src/app/s/page.tsx`, `search/results-layout.tsx`, `results-map.tsx`, `filters.tsx`, `src/app/api/listings/count/route.ts` |
| Listing page | 1120 px layout; 26/30 title; Share (Web Share or clipboard) and Save; 1+4 mosaic; **photo tour** grouped by room plus fullscreen viewer; sticky **section sub-nav** with price/Reserve; booking card restyle and free-cancellation note; guest-favourite banner; **rating hero + distribution**; **all-reviews dialog** (paginated API); "Where you'll be" **map**; host card; "Things to know" dialogs | `src/app/rooms/[id]/page.tsx`, `listings/photo-gallery.tsx`, `pdp-subnav.tsx`, `booking-widget.tsx`, `reviews.tsx`, `location-map.tsx`, `share-button.tsx`, `info-dialog.tsx`, `src/lib/photos.ts`, `src/app/api/listings/[id]/reviews/route.ts` |
| Host profiles | New public `/users/[id]` page: host card, bio, listings carousel, recent reviews (only for users with published listings) | `src/app/users/[id]/page.tsx`, `src/lib/listings.ts` (`hostStats`) |
| Account | Edit name/bio; change password (verifies the current one, rate-limited, then signs out every other session) | `src/app/account/*`, `src/app/actions/account.ts`, `src/lib/auth.ts` (`rotateSessions`), `src/lib/validation.ts` |
| Footer | `#F7F7F7` footer with "Inspiration for future getaways" tabs built from database destinations, columns and bottom bar | `layout/site-footer.tsx`, `inspiration-tabs.tsx` |
| Other pages | Shared gutters and 32/36 headings for trips, wishlists, host, checkout; reference-style login card; brand-gradient CTAs; toasts styled as the reference toast | various |
| Data | 70 more fictional listings (neighbourhood variants) so rows fill like the reference; coordinates exposed to cards | `prisma/seed.ts` |

## Verification against the reference

REA captured Kipstay with the same tool and viewports used for the reference (`../investigation/v2/kip*`):

| Capture | Evidence | Result |
|---|---|---|
| Home 1440: band, calendar, guests, menu, scrolled | `ev_1395ba87…c937` | Layout, 7-up rows, pill and panels line up with `ev_c8a6…`/`ev_88de…`. The only console error is a `caret-color` hydration warning caused by Playwright's caret hiding during screenshots, which doesn't appear in a normal browser |
| Results 1440 + Filters | `ev_ca702725…a39f` | Chip bar, list/map split and pill pins match `ev_e170…` |
| Listing 1440: top, sub-nav, map/host, photo tour | `ev_009b62c2…b7e7` | Mosaic, booking card, sub-nav and photo tour match `ev_c410…` |
| Mobile 390 @2x / tablet 820 | `ev_14fbcc1b…5f34d` / `ev_e28882c5…1868` | "Start your search" pill, chips, 2.2-card rows and tab bar on phones; logo mark, full search and 4-up rows on tablets, as in `ev_3c04…`/`ev_95e9…` |

Broken links: a crawl of 9 pages (142 internal links) found no non-200 responses.

### Remaining differences

- Brand, logo, typeface (Figtree vs. proprietary Cereal), teal instead of the reference's pink/red, and Kipstay's own SVG artwork instead of photos. All of these are deliberate.
- No Experiences/Services verticals, "Flexible dates", messaging, map clustering or wishlist collections (see README).
- The header collapse is a CSS crossfade rather than the reference's view-transition morph of the search bar.
- Category ratings (cleanliness, accuracy and so on) aren't shown: Kipstay only stores an overall rating, and inventing sub-scores would be fake data.
