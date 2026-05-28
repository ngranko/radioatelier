# Object details overlay

Archive entries open in a bottom-sheet overlay driven by URL routes and client-side mode state. The overlay supports viewing, editing, and creating objects from map clicks or search results.

## Layout

| Path | Role |
| --- | --- |
| `src/lib/state/objectDetailsOverlay.svelte.ts` | Overlay lifecycle, modes, dirty/loading flags |
| `src/lib/components/objectDetails/objectDetails.svelte` | Shell (header, minimize, close) and mode router |
| `src/lib/components/objectDetails/viewMode/` | Read-only object view |
| `src/lib/components/objectDetails/objectEdit.svelte` | Edit wrapper (full or light form) |
| `src/lib/components/objectDetails/pointPreview.svelte` | Read-only preview before create |
| `src/lib/components/objectDetails/pointCreate.svelte` | Create form wrapper |
| `src/lib/components/objectDetails/objectForm/form.svelte` | Shared create/edit form |
| `src/routes/(app)/(fullList)/+layout.svelte` | Mounts overlay, merges route + overlay data |
| `src/routes/(app)/(fullList)/object/[id]/` | Existing object route |
| `src/routes/(app)/(fullList)/point/` | New point preview/create route |
| `src/lib/utils/pointRoute.ts` | `buildPointUrl()` helper |

## Modes

```typescript
type ObjectDetailsOverlayMode =
  | 'objectView'
  | 'objectEdit'
  | 'pointPreview'
  | 'pointCreate';
```

| Mode | Route | Component | Object ID |
| --- | --- | --- | --- |
| `objectView` | `/object/[id]` | `viewMode.svelte` | Convex `Id<'objects'>` |
| `objectEdit` | `/object/[id]` (same URL) | `objectEdit.svelte` → `Form` | Convex id required |
| `pointPreview` | `/point?lat=&lng=&placeId?` | `pointPreview.svelte` | `null` in draft |
| `pointCreate` | `/point?...` (same URL) | `pointCreate.svelte` → `Form` | `null` in draft |

Edit mode is entered by setting `objectDetailsOverlay.mode = 'objectEdit'` directly (for example from the edit button in `viewMode/actions.svelte`). There is no dedicated `showObjectEditOverlay` helper.

## State helpers

| Function | Sets mode | Use when |
| --- | --- | --- |
| `showLoadingDetailsOverlay(id)` | `objectView` + loading | Navigating to an object |
| `showObjectDetailsOverlay(id, values?)` | `objectView` | Object data loaded |
| `showPointPreviewOverlay(id, draft, pointDetails)` | `pointPreview` | Showing unsaved point |
| `showPointCreateOverlay(id, draft, pointDetails?)` | `pointCreate` | Create form open |
| `closeDetailsOverlay()` | reset | Full teardown |

### `detailsId` contract

The overlay uses `detailsId` to sync with the active map marker:

- Existing objects: Convex `Id<'objects'>`
- Points: `googlePlaceId` or `"lat,lng"` (see `buildPointDetailsId` in `point/+page.server.ts`)
- Ephemeral loading: timestamp or `crypto.randomUUID()` during navigation

Keep IDs consistent between overlay state, marker components, and `visibilityEngine.ts` (share-page marker activation).

## Workflows

### View existing object

1. Marker or search click → `showLoadingDetailsOverlay(id)` + `goto(/object/${id})`
2. `object/[id]/+page.server.ts` loads `activeObject` (supports share-id redirect)
3. `object/[id]/+page.svelte` calls `showObjectDetailsOverlay(objectId, data)`
4. Edit button sets `mode = 'objectEdit'` without changing the URL
5. Save/delete posts to the current route's `?/save` / `?/delete` actions

### Point preview (map click or Google place)

**Map click** (`src/routes/(app)/+layout.svelte`):

1. Requires authentication
2. Sets draft marker position via `setCreateDraftPosition`
3. Navigates to `buildPointUrl({ latitude, longitude })`

**Server** (`point/+page.server.ts`):

- Validates `lat` / `lng`; redirects to `/` on invalid input
- With `placeId`: fetches Google Place Details
- Without `placeId`: reverse-geocodes via `api.locations.getAddress`
- Returns `{ activePoint: { id, draft, preview }, form }`

**Client** (`point/+page.svelte`):

- Merges cached search item from `searchPointList` when available
- Calls `showPointPreviewOverlay` (preserves `pointCreate` if already in that mode)
- Skips re-sync when `isDirty` and the same point is active

Preview UI is read-only. "Create point" advances to `pointCreate` on the same `/point` URL.

### Point create

1. `pointCreate.svelte` renders `Form` with draft `initialValues`
2. Form posts to `point/+page.server.ts` `save` → `api.objects.create`
3. On success, `handleSaveSuccess` navigates to `/object/${newId}` and shows loading overlay

### Close overlay

`objectDetails.svelte` `handleClose`:

- Clears draft position, deactivates marker, closes Street View
- Logged-in users: `goto(getActiveSearchUrl())` (search URL or `/`)
- Anonymous users: preserves `details` after close (share-page behavior)

## Data merging

`(fullList)/+layout.svelte` resolves display values when overlay state and route data differ:

```typescript
overlayValues = objectDetailsOverlay.details
  ?? page.data.activeObject
  ?? page.data.activePoint?.draft
  ?? null;

overlayPointDetails = objectDetailsOverlay.pointDetails
  ?? page.data.activePoint?.preview
  ?? null;
```

When `objectDetailsOverlay.isOpen` is false but `page.data.activePoint` exists, the layout defaults to `pointPreview` mode for SSR first paint.

## Permissions

Derived in `(fullList)/+layout.svelte`:

- `canEditAll` — owner, or no rendered object yet (loading)
- `canEditPersonal` — non-owner on a public object → `LightForm` (private tags, visited only)

## `buildPointUrl`

```typescript
buildPointUrl({ latitude, longitude, placeId? })
// → /point?lat=...&lng=...[&placeId=...]
```

Used from map clicks, search items without a database ID, and search-source marker clicks. Server-side `buildPointDetailsId` uses the same ID scheme but lives separately in `point/+page.server.ts`.

## Form actions

`Form` posts to `?/save` on whichever route is active:

| Route | Action | Backend |
| --- | --- | --- |
| `/point` | create | `api.objects.create` |
| `/object/[id]` | update | `api.objects.update` |

The same form component handles both; route context determines server behavior.

## Common pitfalls

- **`objectEdit` requires a real object id** — point flows use `pointCreate`, not `objectEdit`.
- **`isDirty` guard on `/point`** — re-sync from server is skipped while the user is editing; do not call overlay helpers unconditionally in `$effect`.
- **Edit mode is a direct mutation** — use `objectDetailsOverlay.mode = 'objectEdit'`, not a named show helper.
- **`isHidden` categories** — hidden in the form combobox only; map markers still use category styles.
- **Anonymous close** — overlay values may persist after close on share pages; see TODO in `objectDetails.svelte`.
