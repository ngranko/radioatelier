# Search

Search combines archive full-text lookup (Typesense) with Google Places. The UI has a compact preview dropdown and a full results panel with tabbed pagination.

## Convex actions

All search actions live in `src/convex/search.ts` and require an authenticated user.

| Action                      | Purpose                                       | Pagination                                                                                |
| --------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `search.preview`            | Mixed local + Google results for the dropdown | Returns up to 5 local + 2 Google items; `hasMore` when either source has additional pages |
| `search.local`              | Typesense object search                       | Offset-based (`offset` arg, page size 20)                                                 |
| `search.google`             | Google Places text search                     | Token-based (`pageToken` arg, page size 20)                                               |
| `search.googlePlaceDetails` | Place details for a selected Google result    | Single fetch                                                                              |

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

Selecting a preview item calls `focusDetailsTarget` (same helper as the details overlay — zooms in when below `FOCUS_MIN_ZOOM`, then applies the viewport-aware overlay offsets from `detailsFocusOffsets`). Then:

- **Existing list marker** — triggers the marker's `onClick` (opens object details).
- **Known object id, no marker yet** — `showLoadingDetailsOverlay` + navigate to `/object/[id]`.
- **Google / coordinate hit without id** — upsert into `searchPointList`, show loading overlay, navigate to `/point?lat=&lng=&placeId=`.

Full results items (`searchResultsItem.svelte`) also call `focusDetailsTarget`, then fire the marker click when the result id is already on the map.

### Full results panel

`searchResults.svelte` defines two `SearchPageSource` callbacks:

- **Local tab** — `api.search.local` with numeric offset cursors.
- **Google tab** — `api.search.google` with opaque `pageToken` cursors.

Both tabs share `searchResultsList.svelte`, which handles initial load, append pagination, error states, and marker rendering.

### Empty local results

When the **Local** tab returns no items, `searchResultsList.svelte` shows a centered empty state with a "Поискать в Google" button. `searchResults.svelte` passes `emptyAction` only on the local tab; clicking it switches `currentTab` to `google` so users can retry the same query against Places without retyping.

## Map integration

When a results tab is active, `searchResultsList.svelte`:

1. Writes items into `searchPointList` (keyed by `googlePlaceId` or object id).
2. Calls `fitMarkerList` to frame all visible results, padding for the search panel on desktop and the preview sheet on mobile.

Search markers render in `src/routes/(app)/+layout.svelte` with `source="search"` — a magnifying glass for local hits and the Google logo for Places results.

### Preview pins vs result-list pins

`searchPointList.svelte.ts` tracks temporary preview pins for Google/coordinate hits that do not yet have an object id. Only one preview pin is active at a time:

- **`selectSearchPoint`** — adds a preview pin for a new place/coordinate hit. If the key already exists in the list (e.g. the full results tab already rendered it), selection does not take ownership — the existing pin outlives the preview.
- **`clearSelectedSearchPoint`** — removes the current preview pin when selecting an existing object from the preview dropdown (that object has its own list marker).

Preview selection (`searchPreviewItem.svelte`) clears any preview pin before opening an existing object id; place-only hits call `selectSearchPoint` then navigate to `/point`.

## Shared types

`SearchItem`, `SearchPageSource`, and `SearchResultsPage` are defined in `src/lib/interfaces/object.ts`. A `SearchPageSource` is an async function `(cursor: string) => Promise<SearchResultsPage>`; the list component treats the cursor as opaque (starting with `''`).

## Typesense indexing

Search reads go through `src/convex/search.ts` → Typesense. **Writes** are scheduled by the object writer seam — not by search actions directly:

- `createObjectRecords` enqueues `typesense.createInTypesense` after insert (covers interactive create, CSV import, and inbound Notion create).
- `patchObjectRecords` enqueues `typesense.updateInTypesense` when name, location, category, or visibility fields change.
- `objects.delete` and inbound delete enqueue `typesense.removeFromTypesense`.

The scheduled record is built from post-write object + map point + category name via `buildObjectSearchRecord`. See [object-backend.md](./object-backend.md).

### Backfill reconcile

Runtime writes are scheduled per mutation and are not retried, so the index drifts after a bulk migration or whenever Typesense was unreachable while an object changed. The reconcile backfill repairs that drift:

```bash
bun scripts/typesense/backfill.ts \
  --convex-url "$PUBLIC_CONVEX_URL" \
  --backfill-key "$TYPESENSE_BACKFILL_KEY" \
  --typesense-url "$TYPESENSE_URL" \
  --typesense-admin-key "$TYPESENSE_ADMIN_KEY"
```

The script exports existing Typesense documents, fetches all objects from Convex via `typesense:getBackfillPage`, then plans **create**, **update**, **unchanged**, and **delete** operations. Unreadable Typesense rows are treated as deletes. Use `--dry-run` to inspect the plan without applying; use `--max-deletes <n>` to abort when too many stale documents would be removed. Run `bun scripts/typesense/setup.ts` first if the collection does not exist. Env var details are in [environment.md](./environment.md).

### Running the backfill against production

The script only makes HTTP calls to Convex and Typesense — it never runs on the app server, so lack of shell access to Railway does not matter. Run it from a local machine with production values.

Production Typesense is self-hosted on Railway at `https://search.radioatelier.one`, so there is no admin-key UI. The admin key is the server's bootstrap key, stored as `TYPESENSE_API_KEY` on the Railway Typesense service (dashboard → Variables, or `railway variables --service <name>`). The scoped `TYPESENSE_SYNC_KEY` cannot stand in for it: the script calls `collections(name).exists()`, which needs collection read access that the `documents:*` scope lacks.

1. Set a backfill secret on prod Convex. `typesense:getBackfillPage` rejects every call while it is unset:

    ```bash
    BACKFILL_KEY=$(openssl rand -hex 32)
    npx convex env set --prod TYPESENSE_BACKFILL_KEY "$BACKFILL_KEY"
    ```

2. Run the command above with production values and `--dry-run`, then run it again without `--dry-run` and with `--max-deletes` set to the delete count the dry run reported.
3. Remove the secret afterwards: `npx convex env remove --prod TYPESENSE_BACKFILL_KEY`. The action is public and returns every object, private ones included; it is only guarded by that shared secret.

**Pass all four flags explicitly.** Bun auto-loads `.env.local`, and `parseArgs` falls back to those values for any flag left out, so one missing flag silently mixes environments — pushing prod objects into the dev index and queueing dev-only documents for deletion.

Run it while nobody is editing. The script snapshots Typesense before Convex, so an object created or deleted between the two reads collides with its own scheduled write and aborts the run (`Typesense rejected …` or `deleted X of Y`). Nothing is corrupted; rerun it.

## Related docs

- [object-details-overlay.md](./object-details-overlay.md) — point preview/create after selecting a search result
- [object-backend.md](./object-backend.md) — writer seam that keeps Typesense in sync
- [map-architecture.md](./map-architecture.md) — search marker source and map focus helpers
- [environment.md](./environment.md) — Typesense and Google API keys
