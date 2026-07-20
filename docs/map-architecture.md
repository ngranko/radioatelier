# Map architecture

The interactive map is built around a provider abstraction, a marker pipeline, and zoom-based renderer switching. Today only Google Maps is implemented.

## Layer overview

```
MapProvider (GoogleMapsProvider)
    ↓
MarkerManager (viewport culling, scheduling)
    ↓
MarkerRenderer (DomMarkerRenderer | HybridMarkerRenderer)
    ↓
Marker components in +layout.svelte (data from api.markers.list)
```

Key entry points:

| Layer | File | Role |
| ----- | ---- | ---- |
| Provider contract | `src/lib/interfaces/map.ts` | `MapProvider`, `MarkerHandle`, `MapBounds` |
| Google provider | `src/lib/services/map/providers/google/provider.ts` | Map init, events, marker handles, Street View |
| Map shell | `src/lib/components/map/map.svelte` | Bootstraps provider + `MarkerManager` |
| Global state | `src/lib/state/map.svelte.ts` | `mapState.provider`, `deckEnabled`, `streetViewVisible` |
| Marker pipeline | `src/lib/services/map/markerManager.ts` | Add/update/remove markers, renderer mode |
| Data feed | `src/routes/(app)/(fullList)/+layout.svelte` | Renders `<Marker>` per merged marker list row |

## Marker list data feed

The map marker catalog is loaded client-side from two Convex queries in `(fullList)/+layout.svelte`:

| Query | Returns | Why split |
| ----- | ------- | --------- |
| `api.markers.list` | Owner private markers + all public markers | Stable catalog payload for map rendering |
| `api.markers.listVisitedIds` | Flat list of visited object ids for the user | Visited toggles change often; isolating them avoids invalidating the full marker list |

`markers.list` reads the compact `markers` table (not full `objects` rows):

- Owner markers: index `byCreatedByIdAndIsPublic` with `isPublic: false`
- Public markers: index `byIsPublic` with `isPublic: true`

The layout merges visited state in a `$derived` block: each list item gets `isVisited` from a `Set` built from `listVisitedIds`. Marker list data is **not** SSR-prefetched (no server load for markers); authenticated clients subscribe via `useQuery` with `initialData: []`.

When the user opens `/object/[id]` for an object that is not already in the catalog (e.g. a newly shared private object they can view), `getActiveListMarker()` injects a synthetic list entry so the pin still renders. Share-only deep links use the separate share marker path in `(app)/+layout.svelte` instead — see **Share markers** below.

Future collection-based access control is planned in [collection-access-control.md](./collection-access-control.md); the current query shape above is the production behavior today.

## Provider abstraction

`MapProvider` (`src/lib/interfaces/map.ts`) hides map-vendor details behind a small interface: zoom/center/bounds, drag/click/idle events, and DOM-based marker handles.

`GoogleMapsProvider` is the only implementation. It also exposes `getGoogleMap()` for Google-specific features (Deck.gl overlay, Street View panorama). Adding another provider means implementing `MapProvider` and wiring it in `map.svelte` instead of `GoogleMapsProvider`.

## DOM vs Deck.gl rendering

Renderer mode switches on map idle based on zoom:

- **Zoom ≤ 10** (`config.deckZoomThreshold`): Deck.gl via `HybridMarkerRenderer`
- **Zoom > 10**: pure DOM via `DomMarkerRenderer`

```148:150:src/lib/components/map/map.svelte
    function shouldUseDeck(provider: MapProvider): boolean {
        return provider.getZoom() <= config.deckZoomThreshold;
    }
```

At low zoom, list markers (`source: 'list'`) batch-render on a Deck.gl overlay for performance. Service markers always use DOM even in deck mode.

## Marker sources

`MarkerSource` (`src/lib/interfaces/marker.ts`) controls rendering and viewport behavior:

| Source | Renderer | Viewport-managed | Typical use |
| ------ | -------- | ---------------- | ----------- |
| `list` | Deck (at low zoom) | Yes | Archive objects on the map |
| `map` | Same as list | Yes | Legacy / map-origin markers |
| `search` | DOM | Yes | Google Places search result |
| `share` | DOM | No | Deep-linked object not in marker list |
| `draft` | DOM | Yes | Point being created |

Service markers (`search`, `share`, `draft`) call `usesDomRenderer()` and render as DOM overlays inside `HybridMarkerRenderer` so they stay interactive above the Deck layer.

**Share markers** render in `src/routes/(app)/+layout.svelte` when a deep-linked object is not in the user's marker list. They use a distinct star icon and `source="share"`. The marker id is prefixed with `share-` so it does not collide with list markers for the same object id.

## Viewport culling

`MarkerManager` keeps only visible markers rendered:

- `ViewportIndex` — spatial index for bounds queries
- `VisibilityEngine` — decides show/hide per marker
- `UpdateScheduler` — debounces viewport recalculations on map idle

List markers are lazy: they are created in the renderer only when entering the viewport. `maxVisibleMarkers` defaults to 1000.

## Map interactions

- **Click** — 300 ms debounce; suppressed while Deck mode is active or during double-tap drag-zoom (`PointerDragZoomController`).
- **Drag** — cancels pending marker-reposition timeouts (`removeDragTimeout`).
- **Idle** — persists center/zoom to `localStorage` (`lastCenter`), switches renderer mode, schedules viewport update.
- **Min zoom** — computed from container size so the map cannot zoom out far enough to show duplicate tile instances (`computeMinZoomForContainer` in the Google provider).

## Focus and overlay offset

When the details overlay opens for a marker (and when the bottom sheet snaps between positions), the map recenters so the pin stays in the visible map area:

- `focusDetailsTarget(lat, lng)` (`src/lib/services/map/map.svelte.ts`) zooms in if below `FOCUS_MIN_ZOOM` (13), then applies offsets from `detailsFocusOffsets` (`src/lib/services/map/detailsFocusOffset.ts`).
- **Wide viewports** (at least 400 px left beside a 424 px panel): shift the center west by half `DETAILS_OVERLAY_WIDTH` (424 px). Sheet position does not change this.
- **Narrow viewports** (mobile bottom-sheet layout):
  - `peek` — shift the center south by half the peek overlay height so the pin sits in the uncovered map above the sheet
  - `full` / `minimized` — center on the marker with no offset
- `marker.svelte` calls `focusDetailsTarget` when `objectDetailsOverlay.detailsId` matches the marker, and re-runs when `position` changes so flicking to peek recenters with the vertical offset.
- `map.svelte` registers `onMarkerShown: focusDetailsMarker` on `MarkerManager` so share/deep-link pages focus the correct marker once it enters the viewport.

Search result selection (`searchPreviewItem.svelte`, `searchResultsItem.svelte`) uses the same `focusDetailsTarget` helper as overlay focus — conditional zoom to `FOCUS_ZOOM` (15) when below `FOCUS_MIN_ZOOM` (13), plus the viewport-aware overlay offsets above.

## Map controls

Floating controls in `src/routes/(app)/+layout.svelte` (bottom-right stack):

| Control | File | Behavior |
| ------- | ---- | -------- |
| Last position | `positionButton.svelte` | Reads `localStorage` key `lastPosition` (updated by geolocation polling in `geolocation.ts`). If unset or `{lat:0,lng:0}`, shows `toast.info` instead of panning. Otherwise zooms to 15 and centers. Distinct from `lastCenter`, which stores the map viewport on idle. |
| Compass orientation | `orientationButton.svelte` | Shown only when `DeviceOrientationEvent` exists and either iOS permission API is present or `navigator.maxTouchPoints > 0`. Requests permission on first enable; denied/explicit tap failures show `toast.error`. Silent auto-enable on mount may fail on iOS (no user gesture) without surfacing a toast. |

Controls use `--map-control*` CSS tokens from `src/styles/app.css` (`bg-map-control`, `text-map-control-active-foreground`, etc.) so they stay readable over the map in light and dark themes.

## First-run onboarding

`firstRunHint.svelte` shows a dismissible chip above the map: "Нажмите на карту, чтобы добавить точку". It appears in `(fullList)/+layout.svelte` when **all** of:

- Map is ready (`mapState.isReady`)
- User is signed in
- Marker list has loaded (`objects.data !== undefined`)
- User owns no markers yet (`!rawMarkerPoints.some(point => point.isOwner)`)
- Details overlay is closed

Dismissal persists in `localStorage` under `firstRunHintDismissed`. The component starts hidden and reads storage in `onMount` to avoid a flash for returning users.

## Marker styling on the map

Archive marker color and icon come from the object's category, merged with per-user overrides from `api.categories.list`. See [category-settings.md](./category-settings.md).

## Related docs

- [street-view.md](./street-view.md) — panorama overlay and minimap (requires `GoogleMapsProvider`)
- [object-details-overlay.md](./object-details-overlay.md) — map click → `/point` create flow
- [search.md](./search.md) — search result markers and map focus
- [analytics.md](./analytics.md) — PostHog setup and event catalog
