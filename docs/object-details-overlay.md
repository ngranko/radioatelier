# Object details overlay

The object details panel is a bottom overlay used to view, edit, and create archive entries. It spans client-side state, SvelteKit routes, and SSR hydration.

## Overlay modes

`ObjectDetailsOverlayMode` (`src/lib/state/objectDetailsOverlay.svelte.ts`):

| Mode           | UI component          | Purpose                                                   |
| -------------- | --------------------- | --------------------------------------------------------- |
| `objectView`   | `viewMode.svelte`     | Read an existing object                                   |
| `objectEdit`   | `objectEdit.svelte`   | Edit an existing object                                   |
| `pointPreview` | `pointPreview.svelte` | Preview a map coordinate or Places result before creating |
| `pointCreate`  | `pointCreate.svelte`  | Create form for a new point                               |

State helpers: `showObjectDetailsOverlay`, `showPointPreviewOverlay`, `showPointCreateOverlay`, `showLoadingDetailsOverlay`, `closeDetailsOverlay`.

Mode transitions: `enterEditMode`, `returnToViewMode`, `returnToPointPreview`.

Position helpers: `setOverlayPosition` (used by the sheet, chevron, and Street View open/close).

## State model

Overlay state is a single `$state` object exposed through read-only getters on `objectDetailsOverlay`. All writes go through **transition functions** that merge partial updates onto a fresh default state, so opening a new overlay clears leftovers from the previous one (loading flags, point details, minimized state).

### Sheet positions

`ObjectDetailsOverlayPosition` adds a third height between minimized and full:

| Position    | Height                      | How to reach                                   |
| ----------- | --------------------------- | ---------------------------------------------- |
| `minimized` | 56 px header only           | Chevron button, drag snap, or Street View open |
| `peek`      | ~42% viewport               | Drag snap                                      |
| `full`      | Viewport minus 16 px margin | Default on open; chevron from minimized/peek   |

`isMinimized` is derived (`position === 'minimized'`). Street View calls `setOverlayPosition('minimized')` on open and `setOverlayPosition('full')` when the panorama closes.

Notable behaviors:

- `showObjectDetailsOverlay` keeps the previous `details` when called without `initialValues`, avoiding a flash while Convex re-fetches.
- When the overlay is already open, reopening the same object preserves `mode` and `position` (e.g. staying in edit mode or peek height after a refresh).
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

| Route                       | Overlay behavior                                        |
| --------------------------- | ------------------------------------------------------- |
| `/object/[id]`              | SSR loads `activeObject`; overlay opens in `objectView` |
| `/point?lat=&lng=`          | SSR loads `activePoint` with `draft` + `preview`        |
| `/point?lat=&lng=&placeId=` | Preview enriched from Google Place details              |

`objects.create` runs from the `save` action in `point/+page.server.ts`.

## Shared deep links

When a user opens `/object/[id]` for an object they **do not own** and that object is **not** in their marker list (`api.markers.list`), the full-list layout sets `sharedMarker` and renders a `source="share"` marker in the app layout. The share marker is cleared when the object joins the user's list or when the viewer is the owner (owners always use list markers, never share markers).

## Component layout

`objectDetails.svelte` is a thin orchestrator; chrome and content live in dedicated modules:

| Component                   | Role                                                                |
| --------------------------- | ------------------------------------------------------------------- |
| `background.svelte`         | Backdrop click → `requestClose`                                     |
| `closeConfirmDialog.svelte` | Unsaved-changes alert (edit/create taint check)                     |
| `detailsSheet.svelte`       | Bottom sheet shell, drag-to-resize, position snap                   |
| `detailsHeader.svelte`      | Drag handle, `internalId` badge, minimized title row, chevron/close |
| `detailsContent.svelte`     | Mode router → view/edit/preview/create children                     |

### Sheet drag gestures

`detailsSheet.svelte` exposes pointer handlers to the header via a snippet. Dragging the header resizes the sheet live; on release, height snaps to the nearest of `minimized`, `peek`, or `full`. Button clicks inside the header do not start a drag (`closest('button')` guard).

Snap math lives in `sheetSnap.ts` (unit-tested in `sheetSnap.test.ts`):

| Constant                | Value  | Role                                  |
| ----------------------- | ------ | ------------------------------------- |
| `MINIMIZED_HEIGHT`      | 56 px  | Minimized header height               |
| `PEEK_HEIGHT_RATIO`     | 0.42   | Peek height as a fraction of viewport |
| `SHEET_MARGIN`          | 16 px  | Top margin for full height            |
| `INERTIA_PROJECTION_MS` | 220 ms | Velocity projection window on release |
| `MAX_INERTIA_DELTA`     | 220 px | Cap on projected flick distance       |

On pointer release, `getSettledPosition` projects release height from the last two drag samples (height + timestamp). A fast flick can settle one snap position past where the finger stopped — e.g. a downward flick from near-full can land on `peek` instead of `full`. Slow drags snap to the nearest position without inertia. During drag, CSS height transitions are disabled (`transition-none`); settled position restores Tailwind height classes via `setOverlayPosition`.

Settling on a new position also recenters the active map marker via `focusDetailsTarget`. On narrow viewports, `peek` applies a vertical offset of half the peek sheet height (same uncovered-area centering as the desktop side-panel offset); `full` and `minimized` center with no offset. Wide viewports keep the existing westward side-panel offset regardless of sheet position — see [map-architecture.md](./map-architecture.md).

### Header chrome

- **Drag handle** — centered pill at the top of the header.
- **`internalId`** — outline badge; click copies to clipboard (`toast` on success/failure).
- **Minimized row** — when `position === 'minimized'`, shows `CategoryBadge` (icon only) and object name beside the id badge.
- **Chevron** — from `full`, collapses to `minimized`; from `minimized` or `peek`, expands to `full` (`handleMinimizeClick` in `objectDetails.svelte`).

### View mode cover image

In `viewMode.svelte`, the cover uses `ImageUpload` in read-only mode (`disabled`). When a cover URL exists, the image is a `cursor-zoom-in` button that opens `ImageViewer` for the full-resolution `url` (hover scales the preview slightly). Upload/remove controls are hidden while disabled.

### View mode description text

Descriptions may arrive with literal escape sequences (`\n`, `\r\n`, `\r`) from CSV import or Notion sync rather than real line breaks. `viewMode.svelte` normalizes these to newline characters before render and uses `whitespace-pre-line` so multi-line descriptions display correctly in read-only view.

## Related docs

- [street-view.md](./street-view.md) — opening panorama from object/point actions
- [map-architecture.md](./map-architecture.md) — map click constraints, marker focus offset, first-run hint
- [search.md](./search.md) — search → point preview flow
- [analytics.md](./analytics.md) — PostHog setup and event catalog
- [category-settings.md](./category-settings.md) — `CategoryBadge` reads merged category styles
