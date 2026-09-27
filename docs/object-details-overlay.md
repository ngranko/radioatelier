# Object details overlay

The shared details panel displays archive objects and turns map coordinates or Google Places results into new objects. Routes provide initial data; reactive state controls subsequent transitions.

## Routes and modes

| Route                       | Initial content                                               |
| --------------------------- | ------------------------------------------------------------- |
| `/object/[id]`              | `activeObject`, loaded through `objects.getDetails`           |
| `/point?lat=&lng=`          | `activePoint`, including a draft and reverse-geocoded preview |
| `/point?lat=&lng=&placeId=` | Point preview enriched with Google Place details              |

`src/lib/state/objectDetailsOverlay.svelte.ts` defines four modes:

| Mode           | Component             | Purpose                                               |
| -------------- | --------------------- | ----------------------------------------------------- |
| `objectView`   | `viewMode.svelte`     | Read an existing object                               |
| `objectEdit`   | `objectEdit.svelte`   | Edit full or personal fields according to permissions |
| `pointPreview` | `pointPreview.svelte` | Inspect a coordinate or place                         |
| `pointCreate`  | `pointCreate.svelte`  | Fill in a new object                                  |

Use the state module's transition functions to open, load, edit, return, and close. They reset unrelated state between selections. Reopening the same open object preserves mode and position. `showObjectDetailsOverlay` can retain existing details when no initial values are supplied.

## Panel position

Height is independent of mode.

| Position    | Height                      | Entry points                             |
| ----------- | --------------------------- | ---------------------------------------- |
| `minimized` | 56 px header                | Chevron, drag, or opening Street View    |
| `peek`      | 42% of viewport height      | Drag snap                                |
| `full`      | Viewport height minus 16 px | Default open position and expand control |

`detailsSheet.svelte` implements dragging and delegates snap decisions to `sheetSnap.ts`. Position changes feed marker focus so a selected pin stays visible beside or above the panel. Street View minimizes the panel on open and restores `full` on close.

## Map and search selection

1. An authenticated map click sets the draft position and opens a loading overlay.
2. `buildPointUrl` in `src/lib/utils/pointRoute.ts` creates the `/point` URL.
3. The server loader resolves address or Place details while the overlay shows address loading state.
4. `point/+page.svelte` merges route data with any selected search-point data and opens preview or preserves create mode.
5. The `save` form action calls `objects.create`.

Map click suppression and renderer behavior are documented in [Map architecture](map-architecture.md#focus-and-gestures).

The point route avoids reopening a closed overlay when the point ID has not changed. Search maintains its temporary pins separately; see [Search](search.md#map-integration).

## Address lookup and form submission

The point loader validates URL coordinates through `src/lib/utils/coordinates.ts`; invalid or missing values redirect to `/`. A point with `placeId` requests Google Place details, while an ordinary point uses `locations.getAddress` for reverse geocoding. Lookup failures are caught, leaving a usable draft with empty address fields. A failed Places request does not trigger a second reverse-geocoding request.

`src/convex/utils/googleAddress.ts` extracts street, locality, and country. It chooses street/house-number order using country code or a normalized country-name fallback. The separate `helpers/geocode.ts` converts an address to coordinates for Notion creation and times out after five seconds.

New drafts default to private, unvisited, and not removed. The create form applies a late address result only once and only if the user has not already entered address text. Existing-object edit forms retain their loaded address.

`src/lib/schema/objectSchema.ts` supplies the Zod schema used by Superforms client validation and server actions. `toFormDefaults` converts category, tag, and cover records into IDs.

| Interactive form field           | Validation                                            |
| -------------------------------- | ----------------------------------------------------- |
| Name                             | Required, at most 255 characters                      |
| Category                         | Required ID                                           |
| Coordinates                      | Numeric latitude within ±90 and longitude within ±180 |
| Address                          | At most 128 characters                                |
| City and country                 | At most 64 characters each                            |
| Installation and removal periods | At most 20 characters each                            |
| Source                           | Empty or an HTTP/HTTPS URL                            |

Empty optional text becomes `null`. These form limits differ from [CSV import limits](import.md#column-mapping); the backend Convex validators are a separate validation layer.

The point `save` action creates an object; the object page's `save` and `delete` actions update or remove it. Invalid form submissions return status 400 with form errors. The enhanced form shows progress and result toasts without invalidating every loader. Cover upload and cropping follow the separate [image lifecycle](images.md).

## Server rendering and shared links

The full-list layout takes values from overlay state, then falls back to `activeObject` or `activePoint` route data. `isServerRequest` prevents the initial server-rendered panel from flying in again during hydration.

Owners and signed-in viewers of public objects use list markers, including a temporary active entry while the catalog catches up. Anonymous viewers and non-owner private-link recipients use a share marker. This choice depends on ownership, visibility, and authentication, not merely whether the catalog has finished loading.

Anonymous object pages are read-only. Closing with `preserveDetails: true` retains their server-loaded values. See [Authentication](authentication.md) for the full permission rules.

## Sharing

`viewMode/shareButton.svelte` builds `/object/<id>` on the current origin and passes it to `src/lib/utils/share.ts`. On supported mobile devices, including iPads identifying as Macs, the helper opens the native share sheet. Desktop browsers use clipboard copying.

Cancelling the native sheet returns `dismissed` and does not copy anything. Other share failures fall back to the clipboard. The button shows a success toast for copying and an error only when sharing and copying fail. Shared links use the access rules in [Authentication](authentication.md#object-permissions).

## Unsaved changes and nested sheets

`objectDetails.svelte` routes close-button, backdrop, and Escape requests through `requestClose`. Create and edit forms register a taint check; unsaved changes open `closeConfirmDialog.svelte` before discard.

The taxonomy sheet uses the `data-details-sheet` portal target on the panel shell so its backdrop covers the header and form. Dismissing taxonomy keeps its live-bound selections in the parent form; saving the object persists them.

## Component responsibilities

All components below live in `src/lib/components/objectDetails/`.

| Component                                     | Responsibility                                        |
| --------------------------------------------- | ----------------------------------------------------- |
| `objectDetails.svelte`                        | Coordinate modes, permissions, and close confirmation |
| `detailsSheet.svelte`, `detailsHeader.svelte` | Panel shell, sizing, and header                       |
| `detailsContent.svelte`                       | Select content for the active mode                    |
| `background.svelte`, `closeButton.svelte`     | Request closure                                       |
| `objectForm/`                                 | Editable fields, taxonomy, and delete control         |
| `viewMode/`                                   | Read-only metadata, sharing, and Street View actions  |

See [Category settings](category-settings.md) for taxonomy selection and [Object backend](object-backend.md) for persistence.
