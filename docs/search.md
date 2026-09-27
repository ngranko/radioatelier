# Search

Search combines Typesense archive results with Google Places. The browser uses authenticated Convex actions; it does not receive Typesense credentials.

## Actions and results

All actions are defined in `src/convex/search.ts` and require a current app user.

| Action                      | Result                                    | Pagination        |
| --------------------------- | ----------------------------------------- | ----------------- |
| `search.preview`            | Up to five archive and two Places results | `hasMore`         |
| `search.local`              | Archive results, 20 per page              | Numeric offset    |
| `search.google`             | Places results, 20 per page               | Google page token |
| `search.googlePlaceDetails` | Details for one place                     | None              |

A valid latitude/longitude query, such as `55.75, 37.61`, returns one synthetic coordinate result from preview without calling either search provider. Google preview failures are logged and leave archive results available; a failed archive lookup fails preview.

Typesense searches name, address, city, country, and category. It filters to the viewer's own objects or public objects, then sorts by text match and distance from the supplied center. It fetches an extra row to determine `hasMore`.

## UI flow

`src/lib/components/search/search.svelte` hosts the search bar and area-search control. `searchPreview.svelte` requests mixed results and hides while object details are selected.

Selecting an archive preview result focuses its marker and opens `/object/[id]`, using a loading overlay if the marker is not yet available. Selecting a Places or coordinate result opens `/point` with coordinates and an optional `placeId`.

The expanded results panel has archive and Google tabs. Both use `searchResultsList.svelte` for loading, pagination, errors, and map pins. Selecting a full-list result focuses its location and invokes its registered marker click handler when available. An empty archive result offers a button to switch the same query to Google. Moving the map can offer an explicit area re-search through `searchArea.svelte.ts`.

`SearchItem`, `SearchPageSource`, and `SearchResultsPage` live in `src/lib/interfaces/object.ts`. The list treats each page cursor as opaque; the tab callback translates it to an offset or page token.

Search URLs use `/?q=<query>&lat=<latitude>&lng=<longitude>`. Valid query and center values restore the full results panel; see [Browser state](browser-state.md#url-and-transient-state).

## Map integration

Results enter `searchPointList` and `fitMarkerList` frames them with panel padding. The app layout renders search pins as DOM markers. Selection shares the overlay's focus and zoom helper.

`selectSearchPoint` tracks a single temporary preview pin. If the selected item already belongs to the results list, closing the preview does not remove that list-owned pin. Selecting an existing object clears any temporary preview pin.

See [Map architecture](map-architecture.md) and [Object details overlay](object-details-overlay.md) for rendering and route behavior.

## Index writes

`helpers/objectWriter.ts` schedules a Typesense create after object creation and an update after any nonempty stored-field patch. No-op patches schedule nothing. Interactive removal and inbound sync deletion schedule `typesense.removeFromTypesense`.

Index actions are asynchronous, so a successful object write does not mean its search result is already available. There is no application-level retry queue for failed index actions. The backfill script reconciles drift after failures or migrations.

## Typesense setup

Run the local setup script with the intended server and collection:

```bash
bun scripts/typesense/setup.ts \
  --url '<typesense-url>' \
  --admin-key '<admin-key>' \
  --collection objects
```

For a new collection it creates the schema and prints a sync key with `documents:*` access and a search key with `documents:search` access. Set them as `TYPESENSE_SYNC_KEY` and `TYPESENSE_SEARCH_KEY` on Convex, along with the URL and collection name.

If the collection already exists, setup exits without changing the schema or issuing keys. Rerunning it is not a schema migration or key-rotation procedure. The backfill also needs an admin key because it checks collection existence and exports documents.

## Running the backfill against production

The script runs locally and calls Convex and Typesense over HTTP. It needs no app-server shell access. Obtain the target Typesense admin key from the service configuration; a document-sync key is insufficient.

1. Configure a temporary `TYPESENSE_BACKFILL_KEY` on the target Convex deployment. For production:

    ```bash
    npx convex env set --prod TYPESENSE_BACKFILL_KEY '<temporary-secret>'
    ```

2. Pause editing and run a dry run with explicit target values:

    ```bash
    bun scripts/typesense/backfill.ts \
      --convex-url '<production-convex-url>' \
      --backfill-key '<temporary-secret>' \
      --typesense-url '<production-typesense-url>' \
      --typesense-admin-key '<production-admin-key>' \
      --collection objects \
      --dry-run
    ```

3. Review create, update, unchanged, and delete counts. Unreadable existing index rows are included in deletion candidates.
4. Repeat with the same values, replace `--dry-run` with `--max-deletes <reviewed-count>`, and inspect the result. `--batch-size` defaults to 200.
5. Remove the temporary endpoint credential:

    ```bash
    npx convex env remove --prod TYPESENSE_BACKFILL_KEY
    ```

Supply the collection explicitly as well as all four connection/credential flags. Omitted values fall back to the local environment, so a partially specified command can mix development and production.

The script snapshots Typesense before reading Convex and applies changes in batches. Concurrent edits can conflict with scheduled index writes, and a failed run may have applied earlier batches. After resolving the cause, repeat the dry run before applying again. The delete limit is checked before applying; it is not a rollback mechanism.

Source files are `scripts/typesense/backfill.ts`, `backfillConfig.ts`, `backfillDocuments.ts`, and `backfillSync.ts`. Environment details are in [Environment](environment.md).
