# Street View

Object actions and point previews open a Google Street View panorama through `getStreetView` in `src/lib/services/map/streetView.svelte.ts`. The active provider must be an initialized `GoogleMapsProvider`.

## Open and close

1. Resolve a panorama within 30 metres of the selected coordinates.
2. Set its panorama ID, or position if no ID is present, and make it visible.
3. Minimize the details panel.

`mapState.streetViewVisible` tracks visibility. The close control calls the provider's `closeStreetView`; the panorama's `visible_changed` listener restores the details panel to `full`.

The browser uses `PUBLIC_GOOGLE_MAPS_API_KEY`, shared with the map. See [Environment](environment.md).

## Lookup policy

`resolveStreetViewLocation` keeps module-level caches for the browser session.

| Mechanism         | Behavior                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Coordinate key    | Latitude and longitude rounded to four decimal places                                      |
| Successful lookup | Reused for the session                                                                     |
| Failed lookup     | Cached for five minutes, or 60 seconds for a rate-limit error                              |
| Concurrent lookup | Requests for the same key share one promise                                                |
| Global cooldown   | New requests pause for 60 seconds after `429`, `over_query_limit`, or `resource_exhausted` |

## Minimap

`streetViewMinimap.svelte` uses the main map's Map ID. Panorama position and heading update the minimap. Dragging the minimap starts a lookup after a 300 ms debounce and preserves panorama heading when moving to the new location.

A generation counter ignores stale asynchronous results when the user drags again. Expanding or collapsing the minimap triggers a map resize.

## Source guide

| File under `src/lib/`                     | Responsibility                           |
| ----------------------------------------- | ---------------------------------------- |
| `services/map/streetView.svelte.ts`       | Lookup, caches, rate limits, and opening |
| `components/map/streetView.svelte`        | Panorama host and visibility events      |
| `components/map/streetViewOverlay.svelte` | Overlay close control                    |
| `components/map/streetViewMinimap.svelte` | Minimap and panorama synchronization     |

See [Map architecture](map-architecture.md) for the provider and [Object details overlay](object-details-overlay.md) for panel positions.
