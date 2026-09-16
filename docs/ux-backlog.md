# UX backlog

Ergonomics findings from a read of the map, search, details-sheet and form
components (September 2026). Nothing here was verified by running the app —
the first section in particular describes behaviour inferred from stacking
and event handling, so check it on a real phone before acting.

Each item names the file and line it was found at. Line numbers drift — treat
them as a starting point, not a coordinate.

Ordered so the top of each section is the most worth doing. If only four get
done, make them the two map-and-card items, the route link, and page titles.

## Already done

Listed so the list stays reconstructable, not as work to redo.

- **Share an object link.** The card's action row now opens the system share
  sheet and falls back to the clipboard (`utils/share.ts`,
  `viewMode/shareButton.svelte`).
- **Labels on icon-only controls.** The edit, route and street-view buttons in
  `viewMode/actions.svelte`, the sheet's position chevron, and the close
  button now carry an `aria-label` and a `title`. The two edit variants (own
  object vs. personal marks only) name themselves apart.
- **Keyboard and phone-keyboard handling in search.** The field is a
  `type="search"` input with `enterkeyhint="search"`; Enter outruns the
  debounce, opens the full list and drops the on-screen keyboard; the arrow
  keys walk the preview list (`search/resultFocus.ts`).
- **"Искать в этой области" follows the map.** The prompt is driven by map
  idle rather than drag end, so a zoom raises it too, and it compares the
  viewport the results belong to with the one on screen by distance and by
  how much wider or narrower it got (`search/searchArea.ts`).
- **Distance on search results.** Each result carries its distance from the
  point the search ran at, so the list keeps agreeing with itself while the map
  moves (`utils/distance.ts`).

---

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

### Hovering a result does not highlight its pin

`src/lib/services/map/markerFocus.ts` — the one highlight the app has both
recentres the map and reaches for the marker's DOM element, which markers drawn
by the GPU renderer do not have. Pointing at a result from the list would need
a highlight both renderers can draw and that leaves the viewport alone.

## Details card

### The route link navigates the tab away

`src/lib/components/objectDetails/viewMode/actions.svelte:28` and
`src/lib/components/objectDetails/pointPreview.svelte:35` assign
`window.location.href`. On desktop this replaces the app and loses the map
view. An `<a target="_blank" rel="noopener">` fixes desktop while phones still
hand off to the Maps app.

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
