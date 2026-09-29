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
- **Flags as labelled chips.** "посещена", "утрачена" and "публичная" are small
  outlined chips with the form's icons, shown only when set; the lock for a
  private object is gone. They lead the tag row rather than sharing a line
  with the category, so the two wrap together as one row.
- **The description outranks the address.** The address is muted `text-sm`
  behind a map pin (`viewMode/address.svelte`, also in the point preview), and
  the description is full-foreground `text-base` body text.
- **Tabs carry the object name.** `documentHead.svelte`, mounted once in the
  root layout, sets `<title>` and `og:title` from the open object, falling back
  to the page data on the server render that link previews read. It owns the
  title for every route because Svelte leaves `document.title` as it was when a
  page's own `<title>` unmounts.
- **Results lead with the name.** Each row is the name at medium weight with
  the distance on the right, then one muted line of category · address
  (`search/searchItemCard.svelte`); a result without a name shows its address
  as the title instead.
- **New-point form friction.** A new point's form opens with the name field
  focused; the source field asks phones for a URL keyboard (`inputmode="url"`,
  no autocapitalise or spellcheck); Cmd/Ctrl+Enter saves; and Save shows its own
  spinner while the save runs. The description already grew with its content
  through `field-sizing-content` in the shared `Textarea` — everywhere but
  Firefox, which has no `field-sizing` yet.
- **Validation errors name the field.** A failed save in either object form
  toasts the first field error ("Нужно выбрать категорию") instead of a generic
  line (`utils/formErrors.ts`). Scrolling to and focusing the offender was
  already superforms' default; `TaxonomyField` spreads the control props onto
  its trigger, so it carries the `aria-invalid` the error selector looks for.
- **The card and the results panel have an edge.** Both now carry the first-run
  hint's shadow and hairline ring, shared as `.surface-edge` in `app.css`, so
  they lift off the map — the ring is what separates them from dark tiles.
- **Typekit preconnect.** `app.html` opens the crossorigin connection the font
  files need before the stylesheet arrives to name them.
- **The top bar no longer assembles itself.** The search bar renders with the
  page, disabled until the map is ready; only its map-dependent setup waits
  (`search/search.svelte`). The avatar never popped in: `Show` resolves from
  the server's `initialState`, so it is in the server-rendered HTML.
- **The search preview is opaque.** It shares the results panel's
  `bg-background` and `.surface-edge`, so the list keeps its surface as it
  expands. The search bar, the avatar and the area-search button keep `.glass`:
  they are small, and a blur costs by area.
- **Pointing at a result highlights its pin.** Hovering or keyboard-focusing a
  row in the results list scales its pin like the focus highlight does and
  raises it over its neighbours, without moving the map
  (`services/map/markerHover.ts`). The GPU renderer never mattered here: every
  row's pin is a search marker, and those are DOM markers in every renderer.
  The preview list has no pins, so it has nothing to highlight.

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

## Details card

## Forms

## Surfaces and loading

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
