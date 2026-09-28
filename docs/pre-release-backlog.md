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
- **Dependency advisories.** `bun audit` reported 16. `bun audit fix` cleared
  all but one within existing ranges, including the `@sveltejs/kit` `Accept`
  header ReDoS
  ([GHSA-29g2-3rmr-qm68](https://github.com/advisories/GHSA-29g2-3rmr-qm68));
  `package.json` now requires the patched Kit. The remaining low-severity
  `cookie@0.6` advisory is pinned by Kit itself and only matters when cookie
  names or paths come from user input, which the app never does.
- **`storage.cleanup` read three whole tables in one mutation**, which would hit
  Convex's per-query document limits, and it could delete an upload sitting in
  an unsaved form. It is now `storage.sweepUnusedImages` followed by
  `storage.sweepUnusedFiles`. Each pages through its table and checks
  references through indexes, and both skip anything younger than a day.
- **`imports.cleanupOldJobs` had the same shape.** It collected every import
  job. It now pages through them in batches and reschedules itself.
- **`getNextInternalId` skipped `RA-2`.** The first call returned `RA-1` but
  seeded the counter at `2`. It now seeds `1`, so the next call returns `RA-2`.
- **Memory leaks.** `locationMarker.svelte`'s orientation `$effect` never
  removed its `deviceorientation` listener, and a component destroyed while
  `onMount` awaited the marker library still created the marker and its
  interval. The effect now returns a teardown, and `onMount` bails out after the
  await if the component is gone. `tooltip.svelte`'s window `click` listener
  lived until a second click; it now belongs to an `$effect` on `isOpen`.
- **`bun run check` was red on a clean checkout.** SvelteKit generates the
  `$env/static/public` types from whatever env files exist at sync time, so
  without `.env.local` it declares nothing. The hand-written block in
  `src/app.d.ts` merges with it (it does not shadow it) and is what types a
  clean checkout, but it lacked `PUBLIC_CONVEX_URL`; now it declares it.
  `PUBLIC_CLERK_PUBLISHABLE_KEY` comes from the `svelte-clerk/env` reference.
- **Dockerfile.** The production stage ran as root and `bun i` was not frozen,
  so image builds could drift from `bun.lock`. The prod stage now runs as the
  image's `node` user, and the install uses `--frozen-lockfile`.
- **Notion webhook retries.** The route ran the inbound sync inline, so a
  `rejectInbound` decision returned 500 and Notion redelivered the event
  indefinitely. The route now schedules `processWebhookEvent` and acknowledges
  right away; a rejected page fails the scheduled run and shows in the logs.
- **A redelivered `page.created` duplicated the Object.** The inbound action
  checked for an existing link, then spent seconds on a Notion fetch and a
  geocode before `createObjectFromSync` ran, so a retry in that window created a
  second Object for the page. The mutation now re-checks `byNotionPageId` and
  returns the linked Object instead.

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

### The `counters` row is a global write hotspot

`src/convex/helpers/objectHelpers.ts:16` — every object creation patches the
same document to allocate an `RA-{n}` id, so concurrent creates and imports
serialize against each other and retry on OCC conflicts. Sharding the counter,
or deriving the internal id from something that does not need a global sequence,
removes the contention.

Deferred: with one or two active writers the conflicts are rare and Convex
retries them in milliseconds, while sharding makes ids non-consecutive (a
user-sharded counter was tried and dropped). Revisit when many users create
objects concurrently.

---

## Correctness and hygiene

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

### Saves wait on PostHog

The `save` and `delete` actions in both `+page.server.ts` files, and
`handleError` in `hooks.server.ts`, `await posthog.flush()` before responding.
When PostHog is slow, every save is slow with it, up to the client's request
timeout. Capture without awaiting the flush, or flush on shutdown.
