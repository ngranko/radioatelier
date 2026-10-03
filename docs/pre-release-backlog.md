# Pre-release backlog

Findings from a pre-release audit (security, scale, leaks, hygiene). The four
release blockers found in the same pass are already fixed; what follows is the
remainder, ordered so the top of each section is the most worth doing.

Each item names the file and line it was found at. Line numbers drift — treat
them as a starting point, not a coordinate.

## Already fixed

Listed so the audit is reconstructable, not as work to redo.

- **Stored XSS via the object `source` link.** `z.url()` accepts `javascript:`
  URIs, the mutation validator did not check the value at all, and
  `viewMode.svelte` renders it into an `href`. Now: the form schema requires an
  `http`/`https` protocol, and `dropUnsafeSource` in `objectRecordPatch.ts`
  clears an unsafe value at the writer seam, covering all three write adapters
  (form, Notion sync, import).
- **IDOR in `images.updatePreview`.** Auth was checked, ownership was not, and
  cover ids are handed to every viewer — so any signed-in user could repoint
  another user's image preview and delete the file behind the old one. Images
  now carry `createdById` and the mutation checks it. Before deploying, run
  `npx convex run migrations:run '{"fn": "migrations:backfillImageOwners"}'` so
  legacy covers inherit their Object's author; the migration logs every image
  it cannot resolve to exactly one owner, and those stay locked until assigned
  by hand.
- **Clerk session cookie forwarded to PostHog.** The `/ingest` proxy copied
  request headers verbatim; `cookie` and `authorization` are now stripped.
- **`.dockerignore` did not exclude env files**, so `COPY . .` could bake
  `CLERK_SECRET_KEY` into an image layer.
- **A dropped promise in the object load could kill the server.** The
  `/object/[id]` load started `getDetails` on every request but awaited it only
  on full-page loads. On data requests a rejection went unhandled, and Node
  exits on those. The query now starts only on the branch that awaits it.
  `resolveShareId` returns `null` for a well-formed id whose object is gone, so
  deleted ids get a 404 on both full-page and data requests. `getDetails` still
  throws when the object is missing.
- **The Notion discrepancy report was a public action.** Anyone with the Convex
  URL could run a full Notion scan on our API quota and read back the id and
  name of every synced object, private ones included. `reportDiscrepancies` is
  now an `internalAction`, still runnable from the dashboard and
  `npx convex run`.
- **No server-side length limits on object fields.** `objects.create` and
  `objects.update` accepted strings of any length, and the browser calls them
  directly, so the form's zod caps were not a trust boundary. The import's
  `LIMITS` table now lives in `src/lib/utils/fieldLimits.ts`; both mutations
  reject over-limit fields, and the form caps `description` and `source` too.
- **`placeId` was interpolated into a URL unencoded.** A crafted id could
  traverse to a different endpoint on `places.googleapis.com`. The Places
  details request now passes it through `encodeURIComponent`.
- **Unmetered Google API spend.** `/point` reverse-geocoded on every navigation
  and `search.preview` hit Places on every debounced keystroke, with no limit.
  Every Google-billed action now draws from one per-user token bucket
  (`helpers/googleQuota.ts`, 50 burst, 200/hour). The search preview drops its
  Google results when the bucket is empty. Reverse geocodes are cached for a
  week by coordinates rounded to about 1 m, and cache hits don't use quota.

---

## Security

### Shared objects are unlisted, not private

`src/convex/objects.ts:30` — `getDetails` is deliberately anonymous and never
checks `isPublic`, because `/object/:id` doubles as the share-link entry point.
The consequence: an object id in a browser history, a referrer header, or a
forwarded link grants permanent read access to a private object, and there is no
way to retract it.

This is a design decision rather than a defect, but it should be a conscious one
before launch. If links need to be revocable, the usual shape is a signed share
token carried in the URL and checked by `getDetails`, with the bare id requiring
auth.

### Any signed-in user can write global taxonomy

`src/convex/tags.ts:18` and `src/convex/categories.ts:81` insert into shared
tables behind nothing but an auth check, with no length cap and no rate limit. A
single account can pollute the tag and category vocabulary for everyone. Worth
either restricting creation by role or capping and normalising harder.

### Dependency advisories

`bun audit` reports 16, mostly dev-only. The one that reaches production is
`@sveltejs/kit` ReDoS via the `Accept` header
([GHSA-29g2-3rmr-qm68](https://github.com/advisories/GHSA-29g2-3rmr-qm68)) —
unauthenticated DoS against the adapter-node server. Bump before launch;
re-run `bun audit` after.

---

## Scale

These do not degrade gradually. They work until a threshold and then fail.

### `markers.list` collects the entire public marker set

`src/convex/markers.ts:20` — every client downloads every public marker on load.
Convex caps a query at 16,384 documents / 8 MiB; past that the map stops loading
for everyone at once, with no partial result.

The client pipeline is already built for far more than the server will hand it
(viewport culling in `viewportSelection.ts`, time-budgeted batches in
`visibilityEngine.ts`, a nearest-N cap in `markerManager.ts`), so the whole
ceiling is server-side. Bounding the query by viewport bounds, or tiling markers
by geohash prefix and fetching the tiles in view, both fit the existing client
without changes to it.

### `storage.cleanup` reads three whole tables in one mutation

`src/convex/storage.ts:8` collects all objects, all images, and all of
`_storage`. Same document limits apply, and when it starts failing it fails
silently inside a cron.

It also races uploads: an image created by `images.create` but not yet attached
to a saved object is unreferenced, so a cron run landing between upload and save
deletes it. Add a grace period on `_creationTime` (skip anything younger than,
say, a day) and paginate the scan.

### `imports.cleanupOldJobs` has the same shape

`src/convex/imports.ts:396` — `collect()` over every import job ever created.

### The `counters` row is a global write hotspot

`src/convex/helpers/objectHelpers.ts:16` — every object creation patches the
same document to allocate an `RA-{n}` id, so concurrent creates and imports
serialize against each other and retry on OCC conflicts. Sharding the counter,
or deriving the internal id from something that does not need a global sequence,
removes the contention.

---

## Memory leaks

The map teardown is careful overall (`map.svelte:185`, `gpuHybridRenderer.ts:88`,
`DeckOverlayHost.destroy()` calling `finalize()`), so these are the whole list.

- `src/lib/components/map/locationMarker.svelte:87` — the `$effect` adds a
  `deviceorientation` listener and returns no teardown. Destroying the component
  while orientation is enabled leaves the listener attached, holding the marker
  and its DOM element alive. The same file's `onMount` awaits
  `preloadMarkerLibrary()` before it creates the marker and the 1-second
  interval. If the component is destroyed during that await, `onDestroy` has
  already run, so both are created afterwards and never cleaned up.
- `src/lib/components/tooltip.svelte:21` — the window `click` listener is only
  removed by a second click. Destroy the component while the tooltip is open and
  it leaks, and keeps toggling state on a dead component.

---

## Correctness and hygiene

### `bun run check` is red on a clean checkout

`src/app.d.ts:3` redeclares `$env/static/public`, which shadows the declaration
SvelteKit generates, and the redeclaration omits `PUBLIC_CONVEX_URL` and
`PUBLIC_CLERK_PUBLISHABLE_KEY`. Two errors, in `src/lib/server/convexClient.ts`
and `src/routes/+layout.svelte`. Deleting the manual block is most likely the
right fix — the generated ambient types already cover every `PUBLIC_` var.

### `getNextInternalId` skips `RA-2`

`src/convex/helpers/objectHelpers.ts:19` — the first call returns `RA-1` but
seeds the counter at `2`, so the next call increments to `3` and returns `RA-3`.
Cosmetic, but the ids are user-visible.

### A missing category crashes the map render

`src/routes/(app)/(fullList)/+layout.svelte:229` —
`categoriesState.categories[point.categoryId]` is unguarded, and the next line
reads `category.markerIcon`. A marker referencing a deleted category throws
during render and takes the whole map down. Skip the marker instead.

### Leftover debug logging

- `src/lib/services/map/markerManager.ts:50` logs on every construction.
- `src/convex/http.ts:58` logs the Notion webhook verification token into the
  Convex logs.

### The test suite needs env vars to run

`src/lib/config/index.ts:12` throws at import time when
`PUBLIC_GOOGLE_MAPS_API_KEY` is unset, which fails one test file in a bare
checkout. CI needs those vars set, or the config should degrade at import and
throw at use.

### Dockerfile

`docker/app/Dockerfile` — the production stage runs as root (add a `USER`), and
`bun i` at line 5 is not frozen, so image builds are not reproducible against
`bun.lock`.

### Notion webhook retries

`src/convex/http.ts:87` runs the inbound sync action inline in the HTTP handler.
A `rejectInbound` decision throws, the route returns 500, and Notion retries the
delivery indefinitely. Acknowledging the webhook and scheduling the work would
decouple the two.

### A redelivered `page.created` duplicates the Object

`src/convex/objectsSync.ts:71` — `createSyncedObject` does not check whether a
sync record for the page already exists. The inbound action checks once at the
start, then spends seconds on a Notion fetch and a geocode before the mutation
runs. Notion delivers webhooks at least once, so a retry that arrives in that
window creates a second Object linked to the same page. After that,
`getSyncRecordByPageId` calls `.unique()` and throws on every later event for
the page. Re-check `byNotionPageId` inside the mutation and skip if a record
already exists.

### Saves wait on PostHog

The `save` and `delete` actions in both `+page.server.ts` files, and
`handleError` in `hooks.server.ts`, `await posthog.flush()` before responding.
When PostHog is slow, every save is slow with it, up to the client's request
timeout. Capture without awaiting the flush, or flush on shutdown.
