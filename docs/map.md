# Map subsystem

The interactive map uses Google Maps with a provider abstraction, a marker pipeline for hundreds of points, and zoom-driven rendering modes.

## Layout

| Path | Role |
| --- | --- |
| `src/lib/interfaces/map.ts` | `MapProvider` contract |
| `src/lib/interfaces/marker.ts` | Marker types and `MarkerSource` |
| `src/lib/state/map.svelte.ts` | Global map singleton (provider, marker manager, Street View flag) |
| `src/lib/services/map/providers/google/` | Sole provider implementation |
| `src/lib/services/map/markerManager.ts` | Orchestrates repo → viewport → visibility → renderer |
| `src/lib/services/map/markerRepository.ts` | Marker cache and search-replacement policy |
| `src/lib/services/map/viewportIndex.ts` | Bounds query, distance sort, cap at 1000 markers |
| `src/lib/services/map/visibilityEngine.ts` | Chunked show/hide (50 markers per frame) |
| `src/lib/services/map/renderer/` | DOM and deck renderer implementations |
| `src/lib/components/map/` | Map mount, markers, Street View UI |

## Provider abstraction

`MapProvider` (`src/lib/interfaces/map.ts`) defines camera control, bounds, events, and marker handle creation. `GoogleMapsProvider` is the only implementation today; `map.svelte` instantiates it directly — there is no provider registry yet.

Street View, the minimap, and hybrid deck rendering still call Google-specific APIs (`getGoogleMap()`, `GoogleMapsProvider`). A second map provider would need to reimplement or stub those paths.

## Marker pipeline

```
<Marker> component → MarkerManager.addMarker()
  → MarkerRepository (upsert policy by source)
  → map idle → UpdateScheduler → ViewportIndex (max 1000, nearest first)
  → VisibilityEngine (chunks of 50) → MarkerRenderer show/hide
```

### Marker sources

`MarkerSource` drives lazy loading, viewport management, renderer routing, and upsert behavior.

| Source | Used for | Viewport-managed | Low-zoom renderer |
| --- | --- | --- | --- |
| `list` | Archive markers on the map | Yes | Deck (scatterplot) |
| `search` | Search result pins | Yes | DOM (inverted rose styling) |
| `share` | Shared object link | No | DOM (amber styling) |
| `draft` | Create-from-map draft pin | Yes | DOM (green styling) |
| `map` | Reserved | — | Would use deck |

Service markers (`share`, `search`, `draft`) always render as DOM Advanced Markers so they stay interactive and show icons. List markers switch to deck scatterplots at low zoom.

### Search marker replacement

When a search marker replaces an existing marker at the same ID, the old marker is hidden and stored in `replacedMarkers`. Removing the search marker restores the previous one via `maybeRestoreReplaced()`.

Non-search markers cannot overwrite an active search marker at the same ID.

## DOM vs deck rendering

Renderer mode switches on every map `idle` event when zoom crosses `config.deckZoomThreshold` (10 in `src/lib/config/index.ts`).

| Zoom | Renderer | Behavior |
| --- | --- | --- |
| > 10 | `DomMarkerRenderer` | Full icons, visited/removed styling, pop animations, per-marker hide |
| ≤ 10 | `HybridMarkerRenderer` | Service markers → DOM; list markers → deck.gl scatterplot |

**Deck mode constraints:**

- Icons are not rendered — only colored dots with optional visited outline.
- `DeckOverlayRenderer.show()` / `hide()` are no-ops; all `ensureCreated` markers stay in the GPU batch until `remove()`.
- Viewport culling hides DOM markers but does not remove deck markers from the scatterplot layer.

### Styling

- Colors and icon keys: `src/lib/services/map/markerStyling.data.ts` (9 OKLCH colors, 30 Lucide icon keys).
- Icon components: `src/lib/services/map/markerStyling.ts`.
- Category colors/icons flow from Convex → `(fullList)/+layout.svelte` → `<Marker>`.

Search and share markers use hardcoded colors in `src/routes/(app)/+layout.svelte`, not category styles.

## Gestures

| Gesture | Module | Notes |
| --- | --- | --- |
| Double-tap + vertical drag zoom | `pointerDragZoom.ts` | 500 ms double-tap window; ~50 px = 1 zoom level |
| Marker long-press drag | `renderer/dom/dragController.ts` | 300 ms hold; disables map drag |
| Map click suppression | `map.svelte` | Suppressed while `deckEnabled` or pointer-drag zoom is active |

Min zoom is computed from container size (`mapMinZoom.ts`, clamped 2–4) so the world cannot appear smaller than the viewport.

## Street View

Entry point: `getStreetView(lat, lng)` in `src/lib/services/map/streetView.svelte.ts`.

1. Looks up nearest panorama within 30 m via `StreetViewService`.
2. Applies location to the map-linked panorama and sets `mapState.streetViewVisible`.
3. Minimizes the object details overlay.

**Caching and rate limits:**

- Lookup cache keyed to 4 decimal places.
- Failure cache: 5 minutes (60 seconds for 429 / `over_query_limit`).
- Global cooldown: 60 seconds after a rate-limit error.

**Minimap** (`streetViewMinimap.svelte`): a separate small map synced to panorama center/heading. Dragging the minimap debounces a new Street View lookup while preserving POV. A generation counter prevents stale syncs during rapid drags.

## Adding a marker from UI

Use the Svelte wrapper:

```svelte
<Marker
    markerId={object.id}
    position={{ lat, lng }}
    icon={iconComponent}
    color={categoryColor}
    source="list"
    isVisited={visited}
    isRemoved={removed}
    onClick={handleClick}
/>
```

The user location dot (`locationMarker.svelte`) bypasses `MarkerManager` and creates a marker handle directly on the provider.

## Common pitfalls

- Using `source="map"` — defined but unused; use `list` for archive markers.
- Expecting viewport hide to remove deck markers — only DOM markers respond to per-marker hide.
- Calling Google-specific APIs through `MapProvider` — cast to `GoogleMapsProvider` or extend the interface first.
- DOM marker animations (`animate-popin`, `animate-popout`) are defined in `src/styles/app.css`; removing them breaks marker show/hide transitions.
