# Object details overlay

The object details panel is a bottom overlay used to view, edit, and create archive entries. It spans client-side state, SvelteKit routes, and SSR hydration.

## Overlay modes

`ObjectDetailsOverlayMode` (`src/lib/state/objectDetailsOverlay.svelte.ts`):

| Mode | UI component | Purpose |
| ---- | ------------ | ------- |
| `objectView` | `viewMode.svelte` | Read an existing object |
| `objectEdit` | `objectEdit.svelte` | Edit an existing object |
| `pointPreview` | `pointPreview.svelte` | Preview a map coordinate or Places result before creating |
| `pointCreate` | `pointCreate.svelte` | Create form for a new point |

State helpers: `showObjectDetailsOverlay`, `showPointPreviewOverlay`, `showPointCreateOverlay`, `showLoadingDetailsOverlay`, `closeDetailsOverlay`.

Mode transitions: `enterEditMode`, `returnToViewMode`, `returnToPointPreview`.

## State model

Overlay state is a single `$state` object exposed through read-only getters on `objectDetailsOverlay`. All writes go through **transition functions** that merge partial updates onto a fresh default state, so opening a new overlay clears leftovers from the previous one (loading flags, point details, minimized state).

Notable behaviors:

- `showObjectDetailsOverlay` keeps the previous `details` when called without `initialValues`, avoiding a flash while Convex re-fetches.
- When the overlay is already open, reopening the same object preserves `mode` and `isMinimized` (e.g. staying in edit mode after a refresh).
- `closeDetailsOverlay({ preserveDetails: true })` keeps `details` in memory for anonymous users who close the panel without losing SSR values.

## Route-driven vs client-driven

The full-list layout (`src/routes/(app)/(fullList)/+layout.svelte`) derives overlay content from two sources:

1. **Client state** — when `objectDetailsOverlay.isOpen`, mode and details come from overlay state.
2. **Route data** — when navigating directly (SSR), `page.data.activeObject` or `page.data.activePoint` seed the overlay.

```51:61:src/routes/(app)/(fullList)/+layout.svelte
    const overlayMode = $derived.by(() => {
        if (objectDetailsOverlay.isOpen) {
            return objectDetailsOverlay.mode;
        }

        if (page.data.activePoint) {
            return 'pointPreview';
        }

        return 'objectView';
    });
```

`isServerRequest` (from `+page.server.ts` via `!isDataRequest`) skips the fly-in animation on first paint (`disableOverlayIntro`).

## Map click → point preview

Authenticated users can create objects from the map:

1. `map.svelte` fires `onClick` after a 300 ms debounce (not in Deck mode).
2. `src/routes/(app)/+layout.svelte` `handleMapClick` sets draft position, shows a loading overlay, and navigates to `/point?lat=&lng=` via `buildPointUrl`.
3. While `/point` is loading, `setOverlayAddressLoading(true)` shows address spinners (geocoding runs server-side).
4. `point/+page.server.ts` loads address (reverse geocode) or Google Place details (`placeId` query param).
5. `point/+page.svelte` syncs SSR data into `showPointPreviewOverlay` (or `showPointCreateOverlay` if already in create mode).

URL helper: `src/lib/utils/pointRoute.ts` — `buildPointUrl({ latitude, longitude, placeId? })`.

## Route sync guard

`point/+page.svelte` avoids clobbering an open overlay while the user is editing:

- Sync runs when the overlay is open **or** when the active point id changes (initial navigation or a new coordinate).
- If the overlay is closed and the point id is unchanged, the effect returns early.

Switching from preview to create uses `showPointCreateOverlay` when `objectDetailsOverlay.mode === 'pointCreate'`.

Search results enrich the preview: when `googlePlaceId` is present, fields from `searchPointList` merge into SSR preview data before the overlay opens.

## Unsaved-changes guard

Closing the overlay (close button, backdrop, or Esc) runs through `requestClose` in `objectDetails.svelte`. Edit and create forms register a taint check via `registerCloseConfirmationCheck`; when Superforms reports `isTainted()`, an alert dialog asks for confirmation before discarding changes.

## Object routes

| Route | Overlay behavior |
| ----- | ---------------- |
| `/object/[id]` | SSR loads `activeObject`; overlay opens in `objectView` |
| `/point?lat=&lng=` | SSR loads `activePoint` with `draft` + `preview` |
| `/point?lat=&lng=&placeId=` | Preview enriched from Google Place details |

`objects.create` runs from the `save` action in `point/+page.server.ts`.

## Shared deep links

When a user opens `/object/[id]` for an object they **do not own** and that object is **not** in their marker list (`api.markers.list`), the full-list layout sets `sharedMarker` and renders a `source="share"` marker in the app layout. The share marker is cleared when the object joins the user's list or when the viewer is the owner (owners always use list markers, never share markers).

## Overlay chrome

`objectDetails.svelte` handles minimize/close, Street View entry, and mode-specific child components. `isMinimized` collapses the panel (also set automatically when Street View opens). The header shows `internalId` as a copyable badge when present.

## Related docs

- [street-view.md](./street-view.md) — opening panorama from object/point actions
- [map-architecture.md](./map-architecture.md) — map click constraints, marker focus offset
- [search.md](./search.md) — search → point preview flow
