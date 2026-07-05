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

When the details overlay opens for a marker, the map recenters so the pin sits in the visible area beside the panel:

- `focusDetailsTarget(lat, lng)` (`src/lib/services/map/map.svelte.ts`) zooms in if below `FOCUS_MIN_ZOOM` (13), then shifts the center west by half the overlay width (`DETAILS_OVERLAY_WIDTH = 424px`).
- On narrow viewports where less than 400 px of map remains beside the overlay, the offset is skipped and the marker is centered normally.
- `marker.svelte` calls `focusDetailsTarget` when `objectDetailsOverlay.detailsId` matches the marker.
- `map.svelte` registers `onMarkerShown: focusDetailsMarker` on `MarkerManager` so share/deep-link pages focus the correct marker once it enters the viewport.

Search result selection (`searchPreviewItem.svelte`, `searchResultsItem.svelte`) uses the same `focusDetailsTarget` helper as overlay focus — conditional zoom to `FOCUS_ZOOM` (15) when below `FOCUS_MIN_ZOOM` (13), plus the westward overlay offset when enough map width remains beside the panel.

## Marker styling on the map

Archive marker color and icon come from the object's category, merged with per-user overrides from `api.categories.list`. See [category-settings.md](./category-settings.md).

## Related docs

- [street-view.md](./street-view.md) — panorama overlay and minimap (requires `GoogleMapsProvider`)
- [object-details-overlay.md](./object-details-overlay.md) — map click → `/point` create flow
- [search.md](./search.md) — search result markers and map focus
