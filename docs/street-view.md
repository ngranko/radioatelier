# Street View

Street View opens as a panorama on the main Google map. A minimap overlay lets users reposition the panorama without leaving the view.

## Requirements

Street View is tied to `GoogleMapsProvider`:

- `getStreetView()` rejects if the active provider is not `GoogleMapsProvider` or the map is not initialized.
- Uses `PUBLIC_GOOGLE_MAPS_API_KEY` (browser) — see [environment.md](./environment.md).

## Opening Street View

Entry points call `getStreetView(lat, lng)` from `src/lib/services/map/streetView.svelte.ts`:

- Object view actions (`viewMode/actions.svelte`)
- Point preview (`pointPreview.svelte`)

Flow:

1. `resolveStreetViewLocation` queries `google.maps.StreetViewService` (30 m radius).
2. `applyStreetViewLocation` sets pano or position on the map's `StreetViewPanorama`.
3. `setOverlayPosition('minimized')` so the details panel stays out of the way.

Components: `streetView.svelte` (panorama host), `streetViewOverlay.svelte` (close control), `streetViewMinimap.svelte` (position minimap).

## Lookup caching and rate limits

`resolveStreetViewLocation` deduplicates and caches lookups:

| Mechanism           | Behavior                                                           |
| ------------------- | ------------------------------------------------------------------ |
| Coordinate key      | Rounded to 4 decimal places                                        |
| Success cache       | Stored in `lookupCache` for the session                            |
| Failure cache       | 5 minutes (60 seconds after a 429)                                 |
| Pending dedup       | Concurrent requests for the same key share one promise             |
| Rate-limit cooldown | 60 seconds after `429` / `over_query_limit` / `resource_exhausted` |

## Minimap behavior

`streetViewMinimap.svelte` renders a small Google map synced with the panorama:

- **Panorama → minimap** — heading and position update the minimap center on panorama moves.
- **Minimap → panorama** — after drag ends, a 300 ms debounced lookup moves the panorama to the minimap center while preserving POV heading.
- **Expand/collapse** — toggles minimap size; triggers `resize` on the mini map.
- **Concurrency** — `syncGeneration` cancels stale syncs if the user drags again mid-flight.

The minimap uses the same `mapId` as the main map (`config.googleMapsId`).

## Visibility state

`mapState.streetViewVisible` tracks whether the Street View overlay is shown. Closing Street View calls `mapState.provider.closeStreetView()`.

When the panorama hides (`streetView.svelte` listens to `visible_changed`), the details overlay restores to `setOverlayPosition('full')` so the object panel is usable again. Opening Street View still collapses the sheet to `minimized` via `getStreetView` in `streetView.svelte.ts`.

## Related docs

- [map-architecture.md](./map-architecture.md) — `GoogleMapsProvider` and map state
- [object-details-overlay.md](./object-details-overlay.md) — overlay minimize on Street View open
