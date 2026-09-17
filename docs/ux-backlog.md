# UX backlog

Ergonomics findings from a read of the map, search, details-sheet and form
components (September 2026). Nothing here was verified by running the app —
the first section in particular describes behaviour inferred from stacking
and event handling, so check it on a real phone before acting.

Each item names the file and line it was found at. Line numbers drift — treat
them as a starting point, not a coordinate.

Ordered so the top of each section is the most worth doing. If only four get
done, make them the two map-and-card items, the route link, and page titles.

## Map and the details card

### An open card locks the map

`src/lib/components/objectDetails/background.svelte` — an invisible
`fixed inset-0` button covers the viewport whenever a card is open, so the map
underneath cannot be panned, zoomed, or tapped. Reaching the next object costs
a close, a pan, and a tap.

Most of the plumbing for the alternative already exists: `showObjectDetailsOverlay`
(`src/lib/state/objectDetailsOverlay.svelte.ts:83`) deliberately keeps the
card's position and mode when it is already open, which is exactly what
swapping contents under a standing card needs. The shape:

- the map stays interactive while a card is open;
- tapping another marker swaps the card's contents in place;
- tapping empty map closes the card, with the existing confirm dialog still
  guarding edit mode.

### Cards open full-height

`src/lib/state/objectDetailsOverlay.svelte.ts:22` — `defaultState()` opens at
`full`, which on a phone hides the marker that was just tapped.
`src/lib/services/map/detailsFocusOffset.ts:28` only offsets the map centre for
`peek`, which suggests peek was the intended default and never became one.

- open view and point-preview cards at `peek`, edit and create at `full`;
- the chevron in `detailsHeader.svelte:107` toggles full ↔ minimized and skips
  peek; it should step through all three positions;
- tapping the drag handle does nothing. Stepping the card up one position is
  the common gesture (`detailsSheet.svelte` settles a tap back to where it
  started, since nearest-position wins).

### Every map tap creates a draft point

`src/routes/(app)/+layout.svelte:53` — `handleMapClick` places a draft and
navigates to `/point`, which geocodes server-side. A sloppy tap, or a tap meant
to dismiss something, costs a draft plus a geocode call. Once the card no
longer blocks the map, the tap rule needs to be explicit: a tap that dismisses
a card must not also create a point.

## Search

### Enter does nothing and phones get no search key

`src/lib/components/search/searchBar.svelte:78` — the input is `type="text"`.
It wants `type="search"` with `enterkeyhint="search"`, and Enter should skip
the 400 ms debounce (`searchBar.svelte:29`) and open full results. Arrow-key
movement through the preview list is the natural follow-up; preview items are
already focusable buttons.

### "Искать в этой области" never appears after a zoom

`src/lib/components/search/search.svelte:19` — the centre is re-read on
`onDragEnd` only, so zooming out to widen the area never offers a re-search.
Listening to map idle instead covers both. The visibility check at
`search.svelte:72` also compares coordinate strings exactly, so a one-pixel
nudge is enough to show the button — it should compare by distance.

### Results carry no distance

`src/lib/components/search/searchItemCard.svelte` — every item has coordinates
and `searchState` holds the search centre, so "1,2 км" is cheap and is usually
the deciding factor between two similar results. On desktop, hovering a result
could also highlight its pin; `src/lib/services/map/markerFocus.ts` already
owns that state.

## Details card

### The route link navigates the tab away

`src/lib/components/objectDetails/viewMode/actions.svelte:28` and
`src/lib/components/objectDetails/pointPreview.svelte:35` assign
`window.location.href`. On desktop this replaces the app and loses the map
view. An `<a target="_blank" rel="noopener">` fixes desktop while phones still
hand off to the Maps app.

### No share or copy-link action

Shared links already work on the receiving side (`sharedMarker` state,
anonymous `/object/[id]`), but the sender has to copy the URL bar — which an
installed PWA does not show. `navigator.share` with a clipboard fallback, next
to the existing actions. The ID chip in `detailsHeader.svelte:67` copies the
`RA-n` id, not a link.

### Icon-only actions have no labels

`viewMode/actions.svelte:41-64` — edit, route and street view carry no
`aria-label` or `title`, while the same buttons in `pointPreview.svelte:52-71`
do. The two edit variants (`PenIcon` for full edit, `UserPenIcon` for
personal-only edit) are indistinguishable without one. The header's chevron
(`detailsHeader.svelte:107`) and close button
(`objectDetails/closeButton.svelte`) are unlabelled too.

### Every tab is titled "Радиоателье. Архив"

There is no `<svelte:head>` anywhere in `src/routes`, so object tabs, history
entries, bookmarks and the `og:title` of a shared link are all identical. The
object name in the title is a one-line change per route.

## Forms

### New-point form friction

`src/lib/components/objectDetails/objectForm/form.svelte`:

- no focus in the name field when the form opens (`:295`);
- `source` is `type="text"` (`:465`), so phones show a prose keyboard;
- the description textarea does not grow with its content (`:450`);
- no Cmd/Ctrl+Enter to save;
- the Save button (`:266`) only disables while submitting — progress lives in
  a toast at the top of the screen, far from the thumb. An inline spinner
  keeps the feedback where the tap was.

### The validation error does not say what is wrong

`form.svelte:100` — a client failure surfaces as "Что-то не так во введенных
данных" with no field and no scroll, in a form long enough to hide the
offender. Superforms can scroll to and focus the first invalid control; worth
checking that `TaxonomyField` (a button trigger, not an input) is marked
invalid in a way the error selector finds.

## Map controls and microinteractions

### No haptic tick when a marker drag arms

`src/lib/services/map/renderer/markerHold.ts:7` — the hold fires after 350 ms
with no confirmation until the marker moves. A short `navigator.vibrate` on
fire would confirm it (Android only; iOS Safari ignores it).

### Reduced motion is respected only on the login page

`src/routes/login/+layout.svelte:28` is the only place with `motion-reduce`
variants. The details sheet, search panel and first-run hint animate
regardless of the system setting.

## Deliberately excluded

Directions already settled in earlier reviews and not to be re-proposed here:
full-bleed cover images, extending the `glass` treatment, restyling the
position/orientation buttons away from Google's control language, firing the
Google search tab automatically, warm-palette overhauls, step wizards in the
object form, and anything that adds clicks to reach a form field.

Rejected from this list on review (September 2026), for adding nothing or for
contradicting how the app is actually used: returning focus to the search input
after clearing it, tap-to-copy on address and coordinates, replacing the delete
confirm with an undo toast, and changing what the location button centres on or
does to the zoom.
