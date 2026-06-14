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

## Route-driven vs client-driven

The full-list layout (`src/routes/(app)/(fullList)/+layout.svelte`) derives overlay content from two sources:

1. **Client state** — when `objectDetailsOverlay.isOpen`, mode and details come from overlay state.
2. **Route data** — when navigating directly (SSR), `page.data.activeObject` or `page.data.activePoint` seed the overlay.

```44:54:src/routes/(app)/(fullList)/+layout.svelte
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
2. `+layout.svelte` `handleMapClick` sets draft position, shows a loading overlay, and navigates to `/point?lat=&lng=` via `buildPointUrl`.
3. `point/+page.server.ts` loads address (reverse geocode) or Google Place details (`placeId` query param).
4. `point/+page.svelte` syncs SSR data into `showPointPreviewOverlay` (or `showPointCreateOverlay` if already in create mode).

URL helper: `src/lib/utils/pointRoute.ts` — `buildPointUrl({ latitude, longitude, placeId? })`.

## Dirty-state guard

`point/+page.svelte` avoids overwriting in-progress edits:

- If `objectDetailsOverlay.isDirty` and the active point id is unchanged, the effect returns early.
- Initial navigation and point-id changes always sync.

Switching from preview to create uses `showPointCreateOverlay` when `objectDetailsOverlay.mode === 'pointCreate'`.

## Object routes

| Route | Overlay behavior |
| ----- | ---------------- |
| `/object/[id]` | SSR loads `activeObject`; overlay opens in `objectView` |
| `/point?lat=&lng=` | SSR loads `activePoint` with `draft` + `preview` |
| `/point?lat=&lng=&placeId=` | Preview enriched from Google Place details |

`objects.create` runs from the `save` action in `point/+page.server.ts`.

## Overlay chrome

`objectDetails.svelte` handles minimize/close, Street View entry, and mode-specific child components. `isMinimized` collapses the panel (also set automatically when Street View opens).

## Related docs

- [street-view.md](./street-view.md) — opening panorama from object/point actions
- [map-architecture.md](./map-architecture.md) — map click constraints (Deck mode, debounce)
