# Map & Markers

The map subsystem renders archive pins on Google Maps using a hybrid Deck.gl / DOM renderer, with per-user category styling and multiple marker sources.

## Components

```
map.svelte
  └── GoogleMapsProvider (MapProvider abstraction)
  └── MarkerManager
        ├── MarkerRepository (cache + source priority)
        ├── ViewportIndex (spatial culling)
        ├── VisibilityEngine (show/hide in chunks)
        ├── UpdateScheduler (debounced viewport updates)
        └── MarkerRenderer (DOM or Deck.gl hybrid)
```

Key paths:

| File | Role |
| --- | --- |
| `src/lib/components/map/map.svelte` | Map mount, renderer switching, click handling |
| `src/lib/services/map/markerManager.ts` | Orchestrates marker lifecycle |
| `src/lib/services/map/markerRepository.ts` | In-memory cache and source-priority policy |
| `src/lib/services/map/providers/google/` | Google Maps provider + hybrid Deck renderer |
| `src/lib/services/map/renderer/` | DOM and Deck marker renderers |
| `src/lib/state/map.svelte.ts` | Shared map state (`provider`, `markerManager`, `deckEnabled`) |

## Renderer switching

At zoom ≤ 10 (`config.deckZoomThreshold`), markers render via Deck.gl for performance. Above that threshold, markers switch to interactive DOM elements.

The switch happens on map idle events in `map.svelte`:

```typescript
mapState.markerManager?.setRendererMode(shouldUseDeck(provider) ? 'deck' : 'dom');
```

When Deck.gl is active, map clicks are suppressed (Deck handles its own click events).

## Marker sources

Each marker has a `source` that controls priority when multiple markers share the same ID:

| Source | Origin | Behavior |
| --- | --- | --- |
| `list` | `markers.list` query | Default archive pins |
| `search` | Search results | Replaces `list` marker at same ID; restored when search clears |
| `share` | Shared/off-list object | Single marker for share pages |
| `draft` | Point creation flow | Temporary pin while creating |
| `map` | Reserved | — |

Source priority logic in `MarkerRepository.upsertWithPolicy`:

- A `search` marker replaces an existing non-search marker (original is saved for restoration).
- A non-search marker is ignored if a `search` marker already occupies the ID.

## Category marker styling

Global defaults live on the `categories` table. Each user can override via `userCategoryMarkerStyles`:

| Field | Description |
| --- | --- |
| `markerColor` | One of the OKLCH values in `MARKER_COLORS` (`markerStyling.data.ts`) |
| `markerIcon` | One of the Lucide icon keys in `MARKER_ICON_KEYS` |
| `isHidden` | When true, markers of this category are not shown on the map |

The settings page (`/settings`) edits styles via `categories.updateStyles`. The `categories.list` query merges user overrides with global defaults.

Hidden categories are filtered client-side before markers are added to `MarkerManager`.

## Viewport culling

`MarkerManager` limits visible markers to the current viewport:

- Default `maxVisibleMarkers`: 1000
- Updates are chunked (50 markers per animation frame) via `VisibilityEngine`
- Viewport changes are debounced through `UpdateScheduler`

Markers marked as lazy are only created when they enter the viewport.

## Street View

Street View opens as an overlay controlled by `mapState.streetViewVisible`.

| File | Role |
| --- | --- |
| `src/lib/services/map/streetView.svelte.ts` | Panorama lookup with caching and rate-limit handling |
| `src/lib/components/map/streetView.svelte` | Panorama overlay |
| `src/lib/components/map/streetViewMinimap.svelte` | Minimap for navigation within Street View |

Lookups are cached by coordinate (4 decimal places). Rate-limit errors (HTTP 429 / `OVER_QUERY_LIMIT`) trigger a 60-second cooldown before retrying.

## Object details overlay

The overlay is a client-side state machine, not a separate route component:

| Mode | Trigger | Purpose |
| --- | --- | --- |
| `objectView` | Marker click, `/object/[id]` | Read-only details |
| `objectEdit` | Edit button | Modify object |
| `pointPreview` | Map click with geocoded address | Preview before creating |
| `pointCreate` | Confirm preview | Create form |

State is managed in `src/lib/state/objectDetailsOverlay.svelte.ts`. Routes like `/object/[id]` and `/point` sync URL navigation with overlay open/close.

## Map click behavior

- A 300 ms delay distinguishes clicks from double-tap zoom gestures.
- Dragging the map cancels pending click and marker reposition timeouts.
- Minimum zoom is restricted to prevent multiple map tile sets from appearing on screen.

## Configuration

Client-side map config in `src/lib/config/index.ts`:

| Key | Default | Purpose |
| --- | --- | --- |
| `googleMapsApiKey` | (hardcoded) | Maps JavaScript API |
| `googleMapsId` | (hardcoded) | Cloud-based map styling ID |
| `deckZoomThreshold` | `10` | Zoom level below which Deck.gl is used |
