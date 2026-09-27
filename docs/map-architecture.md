# Map architecture

Google Maps is the only implemented map provider. A shared marker manager connects reactive marker data to DOM and Deck.gl renderers.

## Data and rendering flow

```text
Convex marker catalog + visited IDs
  -> full-list layout merges viewer state and category styles
  -> Marker components register with MarkerManager
  -> repository + viewport selection + visibility updates
  -> DOM or Deck.gl renderer
  -> GoogleMapsProvider
```

| Responsibility                                 | Source                                         |
| ---------------------------------------------- | ---------------------------------------------- |
| Provider contract                              | `src/lib/interfaces/map.ts`                    |
| Google Maps and Deck overlay host              | `src/lib/services/map/providers/google/`       |
| Initialization and event wiring                | `src/lib/components/map/map.svelte`            |
| Marker repository, renderer selection, updates | `src/lib/services/map/markerManager.ts`        |
| Renderer factory                               | `src/lib/services/map/createMarkerRenderer.ts` |
| Map state                                      | `src/lib/state/map.svelte.ts`                  |
| Archive marker feed                            | `src/routes/(app)/(fullList)/+layout.svelte`   |
| Search, share, and draft markers               | `src/routes/(app)/+layout.svelte`              |

## Catalog and personal state

The full-list layout subscribes to two authenticated Convex queries:

- `markers.list` reads the user's private markers and all public markers from the compact `markers` table.
- `markers.listVisitedIds` reads the user's visited object IDs from `userVisitedChunks`.

The layout merges visited IDs into the catalog. Keeping them separate prevents a visit toggle from invalidating the entire marker payload. Category colors and icons come from the merged [category settings](category-settings.md).

Both queries pass the Clerk user ID, which the backend checks against the session. `keepPreviousData` retains results during reconnects; client identity and `isStale` guards decide when those results can render. The layout waits for usable visited data before rendering the merged list. Neither query seeds an empty initial result, so first-load state remains distinguishable from an empty catalog.

An active object can supply a temporary list entry while its catalog row catches up, if the viewer owns it or is signed in and it is public. Anonymous viewers and non-owner private-link recipients use a separate `share` marker. Share IDs use a `share-` prefix to avoid collisions.

This is a full accessible-catalog subscription, not a viewport query. [Collection access](collection-access-control.md) remains a proposal.

## Renderer selection

The PostHog flag `map-gpu-clustered-renderer` selects a strategy once per map instance. Despite the flag name, the GPU renderer does not cluster markers. A disabled, missing, failed, or timed-out flag selects the legacy strategy; the timeout is 1.5 seconds.

| Strategy                | Archive markers                               | Service markers |
| ----------------------- | --------------------------------------------- | --------------- |
| Legacy, zoom at most 10 | Deck.gl through `HybridMarkerRenderer`        | DOM             |
| Legacy, zoom above 10   | `DomMarkerRenderer`                           | DOM             |
| GPU, every zoom         | Composite sprites through `GpuHybridRenderer` | DOM             |

The threshold lives in `src/lib/config/index.ts`. `MarkerManager.syncRendererWithViewport` switches legacy renderers on map idle, suppressing visibility updates while rebuilding. GPU mode keeps one renderer across zoom levels.

Service markers are `search`, `share`, and `draft`. `list` and `map` use the archive renderer. Every source except `share` participates in viewport selection.

## Viewport updates

`selectVisibleMarkerIds` tests numeric bounds, including antimeridian crossings. When candidates exceed the default limit of 1,000, it ranks them by distance from the viewport center. Share markers bypass the cap and bounds filtering.

`VisibilityEngine` applies only the difference from the visible set. Its default frame budget is 8 ms; large changes continue on animation frames. `UpdateScheduler` coalesces update requests. DOM list markers defer creation until needed; Deck renderers maintain batched marker data.

## Focus and gestures

`markerFocus.ts` owns focused-marker registration, highlighting, and recentering. The map component bridges the overlay's `detailsId` and sheet position into it. Search selection uses the same `focusDetailsTarget` helper.

Focus zooms to 15 when the current zoom is below 13. `detailsFocusOffset.ts` shifts the center for a 424 px side panel when at least 400 px of map remains. On narrower screens, only the `peek` sheet adds a vertical offset.

A GPU marker temporarily gains a DOM copy when focused or held for dragging. The sprite remains until that copy paints, then returns when the copy retires. `markerLifecycle.ts` tracks pending rendering work during these handoffs.

Repositioning requires an owner-draggable marker. `MarkerHold` arms after 350 ms within an 8 px tolerance and cancels on release, larger movement, a second pointer, wheel input, or lost window/tab focus. Map gestures also cancel active holds. `saveReposition` persists the move, restores the previous position on failure, and offers a 10-second undo action after success.

Map clicks wait 300 ms before opening a point preview. Legacy Deck mode suppresses point creation. GPU picking pairs renderer clicks with Google Maps clicks so selecting a sprite does not also create a point. Double-tap drag-zoom suppresses point creation as well.

## Animation ownership

DOM entrance animation lives in `renderer/dom/popAnimation.ts`. `RevealWatcher` waits until Maps positions the element in view before starting, with a timeout fallback. Animation events control completion, and hiding or removing a marker cancels pending entrance work.

GPU animation lives in `renderer/gpu/`:

- `spritePopExtension.ts` and `spritePopTimes.ts` grow sprites using shader timing.
- `spriteExits.ts` retains removed sprite data until its exit finishes.
- `spriteFades.ts` crossfades style and state changes.

Viewport hiding is immediate. Removal uses an exit animation. These are separate operations because culling and renderer switching should not produce visible exit effects.

## Controls and persisted state

Initial centering, the location watch, and local-storage lifetimes are documented in [Browser state](browser-state.md#initial-location-and-live-tracking). Map idle stores the viewport in `localStorage.lastCenter`. Geolocation stores `lastPosition`, which the position button uses to recenter. The compass button uses device orientation where supported and requests permission where required. The provider calculates minimum zoom from container size to avoid repeated world tiles.

The first-run hint appears only after marker data loads, for a signed-in user with no owned markers, while the map is ready and the details overlay is closed. Dismissal persists under `firstRunHintDismissed`.

See [Object details overlay](object-details-overlay.md), [Search](search.md), [Street View](street-view.md), and [Analytics](analytics.md) for the related flows.
