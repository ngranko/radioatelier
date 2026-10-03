# UX backlog

Ergonomics findings from a read of the map, search, details-sheet and form
components (September 2026). Nothing here was verified by running the app —
the first section in particular describes behaviour inferred from stacking
and event handling, so check it on a real phone before acting.

Each item names the file and line it was found at. Line numbers drift — treat
them as a starting point, not a coordinate.

Ordered so the top of each section is the most worth doing. If only three get
done, make them the two map-and-card items and page titles.

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
  how much wider or narrower it got (`state/searchArea.svelte.ts`).
- **Distance on search results.** Each result carries its distance from the
  point the search ran at, so the list keeps agreeing with itself while the map
  moves (`utils/distance.ts`).
- **A haptic tick when a marker hold arms.** The hold fires on its own timing
  with nothing on screen to show for it, so it now ticks against the finger
  (`utils/haptics.ts`; Android only, iOS Safari has no web equivalent).
- **Reduced motion outside the login page.** The sheet, the results panel and
  the first-run hint collapse their transitions when the system asks for less
  motion (`utils/motion.ts` plus `motion-reduce:` variants). `app.css` shortens
  the marker pop, drops the endless pulse under a dragged marker and keeps only
  the fade of dialogs, menus and popovers; the GPU sprites pop in a millisecond,
  and the camera jumps instead of gliding on `setCenter` and `fitBounds`.
- **The source link names its site.** It reads "Источник · pastvu.com", with
  the hostname taken from the URL (`utils/url.ts`).
- **The route link opens a new tab.** The route buttons on the card and the
  point preview are `target="_blank"` links rather than a `window.location`
  assignment, so desktop keeps the map and phones still hand off to Maps.
- **Save waits for a photo upload.** The image field exposes its upload state
  and the form keeps Save disabled until the resize and upload settle, so a
  mid-upload save can no longer go out without the new `cover`.
- **The periods as two labelled columns.** "Появилась" and "Пропала" are muted
  labels over the value, each column wrapping on its own, and "Пропала" shows
  only while the object is marked removed. The block stays below the
  description by choice.
- **The empty cover shows the category.** The box keeps its 2:1 shape but is
  tinted with the category's marker colour behind a large, faint category icon
  (`imageUpload/emptyPlaceholder.svelte`). For anyone who can edit, it is an
  "Добавить фото" button: the file picker opens from the tap itself, and the
  picked file rides into edit mode, where the form starts uploading it
  (`viewMode/addCoverButton.svelte`, `pendingCoverFile` in the overlay state).

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

### Results lead with the address, not the name

`src/lib/components/search/searchItemCard.svelte:90` — a row reads address
(muted, `text-xs`), then category, then the name in plain `text-sm` last. The
name is what the eye scans a list for. Put it first at medium weight, and fold
category and address into one muted line under it, distance on the right. Rows
get shorter as well as easier to scan.

### Hovering a result does not highlight its pin

`src/lib/services/map/markerFocus.ts` — the one highlight the app has both
recentres the map and reaches for the marker's DOM element, which markers drawn
by the GPU renderer do not have. Pointing at a result from the list would need
a highlight both renderers can draw and that leaves the viewport alone.

## Details card

### The address outranks the description

`src/lib/components/objectDetails/viewMode/address.svelte:25` renders the
address at `text-base` in full foreground, while the description — the actual
archive content — sits at `text-sm` and 80% opacity
(`viewMode/viewMode.svelte:79`). Demote the address to muted `text-sm` with a
small map-pin icon and let the description be the body text.

### Flags are icons explained only by tooltips

`src/lib/components/objectDetails/viewMode/flags.svelte` — lock, user-check
and ghost carry their meaning in tooltips, which never open on a phone. The
form's toggle chips already settled on icon + text; small muted chips in view
mode would match them. Showing only the flags that are set, instead of a lock
on every card, cuts the noise further.

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

## Surfaces and loading

### The card and the results panel have no edge

`src/lib/components/objectDetails/detailsSheet.svelte:84` and
`src/lib/components/search/searchResults.svelte:46` are opaque surfaces with
no shadow or ring, so they sit flat on the map — in dark mode the card's
background is close to the tiles themselves. `map/firstRunHint.svelte` already
has the treatment: `shadow-lg ring-1 ring-black/[0.08] dark:ring-white/[0.12]`.

### The search preview is glass, the results panel is not

`src/lib/components/search/searchPreview.svelte:64` uses `.glass` while the
full results panel one step later uses `bg-background`, so the same list
changes surface as it expands. Moving the preview to the opaque surface
continues the glass removal; the search bar and the avatar button still carry
`.glass` too.

### The top bar assembles itself on load

The search bar only renders once the map is ready
(`src/routes/(app)/+layout.svelte`), and the avatar has no Clerk loading state
(`src/lib/components/userMenu/userMenu.svelte:7`), so both pop in separately.
Reserving their space, or rendering them disabled until ready, keeps the top
of the screen still.

### The Typekit stylesheet has no preconnect

`src/app.html` — a `<link rel="preconnect" href="https://use.typekit.net"
crossorigin>` ahead of the stylesheet shortens the wait before text switches
to Sofia Pro.

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

Also rejected (late September 2026): hiding the empty cover placeholder in view
mode, because the card then jumps by a third of its height when edit mode puts
the box back; and collapsing the installed and removal periods into one
"from – to" line, because each end can itself be a range ("1965–1969 –
2019–2021") and the result stops being readable.
