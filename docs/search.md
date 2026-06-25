# Search

Search combines archive full-text lookup (Typesense) with Google Places. The UI has a compact preview dropdown and a full results panel with tabbed pagination.

## Convex actions

All search actions live in `src/convex/search.ts` and require an authenticated user.

| Action | Purpose | Pagination |
| ------ | ------- | ---------- |
| `search.preview` | Mixed local + Google results for the dropdown | Returns up to 5 local + 2 Google items; `hasMore` when either source has additional pages |
| `search.local` | Typesense object search | Offset-based (`offset` arg, page size 20) |
| `search.google` | Google Places text search | Token-based (`pageToken` arg, page size 20) |
| `search.googlePlaceDetails` | Place details for a selected Google result | Single fetch |

Coordinate queries (`"55.75, 37.61"`) bypass Typesense and Google; `preview` returns a synthetic local item at those coordinates.

## UI flow

```
search.svelte (bar + area button)
    ↓ query + map center
searchPreview.svelte → api.search.preview
    ↓ "Load more"
searchResults.svelte (Local | Google tabs)
    ↓ per tab
searchResultsList.svelte → SearchPageSource callback
```

### Preview dropdown

`searchPreview.svelte` calls `api.search.preview` whenever `searchState.query`, `lat`, and `lng` are set. It hides while an object details overlay is open (`objectDetailsOverlay.detailsId`).

Selecting a preview item calls `focusDetailsTarget` (same helper as the details overlay — zooms in when below `FOCUS_MIN_ZOOM`, then shifts center west for the overlay panel). Then:

- **Existing list marker** — triggers the marker's `onClick` (opens object details).
- **Known object id, no marker yet** — `showLoadingDetailsOverlay` + navigate to `/object/[id]`.
- **Google / coordinate hit without id** — upsert into `searchPointList`, show loading overlay, navigate to `/point?lat=&lng=&placeId=`.

Full results items (`searchResultsItem.svelte`) also call `focusDetailsTarget`, then fire the marker click when the result id is already on the map.

### Full results panel

`searchResults.svelte` defines two `SearchPageSource` callbacks:

- **Local tab** — `api.search.local` with numeric offset cursors.
- **Google tab** — `api.search.google` with opaque `pageToken` cursors.

Both tabs share `searchResultsList.svelte`, which handles initial load, append pagination, error states, and marker rendering.

## Map integration

When a results tab is active, `searchResultsList.svelte`:

1. Writes items into `searchPointList` (keyed by `googlePlaceId` or object id).
2. Calls `fitMarkerList` to frame all visible results, padding for the search panel on desktop and the preview sheet on mobile.

Search markers render in `src/routes/(app)/+layout.svelte` with `source="search"` — a magnifying glass for local hits and the Google logo for Places results.

## Shared types

`SearchItem`, `SearchPageSource`, and `SearchResultsPage` are defined in `src/lib/interfaces/object.ts`. A `SearchPageSource` is an async function `(cursor: string) => Promise<SearchResultsPage>`; the list component treats the cursor as opaque (starting with `''`).

## Related docs

- [object-details-overlay.md](./object-details-overlay.md) — point preview/create after selecting a search result
- [map-architecture.md](./map-architecture.md) — search marker source and map focus helpers
- [environment.md](./environment.md) — Typesense and Google API keys
