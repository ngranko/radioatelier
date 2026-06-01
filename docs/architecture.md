# Architecture

Radioatelier. Archive is a SvelteKit frontend backed by Convex. Users browse an interactive map, create archive entries (objects), search them, and share links.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | SvelteKit 2, Svelte 5 runes, Tailwind CSS 4 |
| Backend | Convex (queries, mutations, actions, crons, HTTP routes) |
| Auth | Clerk (`svelte-clerk`) → Convex JWT template `convex` |
| Search | Typesense (local archive) + Google Places API |
| Map | Google Maps JS API + Deck.gl hybrid marker rendering |

## Data model

Three tables work together for each archive entry:

```
mapPoints (coordinates + address)
    ↑
objects (metadata: name, category, tags, cover, visibility)
    ↑
markers (map pin: denormalized coords + category for fast listing)
```

| Table | Purpose |
| --- | --- |
| `mapPoints` | Latitude, longitude, address/city/country. Shared location record. |
| `objects` | Archive metadata: name, description, category, tags, cover image, `isPublic`, `isRemoved`, periods, source. References `mapPointId` and `createdById`. |
| `markers` | Denormalized pin for the map. One marker per object. Stores coords, `categoryId`, `tagIds`, `isPublic`, `isRemoved`, `createdById`. |

Supporting tables:

| Table | Purpose |
| --- | --- |
| `categories` | Global taxonomy with default `markerColor` and `markerIcon`. |
| `userCategoryMarkerStyles` | Per-user overrides: custom color/icon and `isHidden` flag. |
| `tags` / `privateTags` | Shared tags vs personal tags (only visible to owner). |
| `objectPrivateTags` | Per-user private tag assignments on an object. |
| `userVisitedChunks` | Visited-marker tracking, chunked by object ID hash. |
| `images` | Cover photo storage references (`originalStorageId`, optional `previewStorageId`). |
| `importJobs` | CSV import progress and feedback. |
| `users` | Synced from Clerk via webhook (`externalId` = Clerk user ID). |

### Visibility rules

- **Map markers** (`markers.list`): returns the current user's private markers plus all public markers.
- **Object read** (`objects.getDetails`): owners always; non-owners only when `isPublic`.
- **Object update** (`objects.update`): owners edit all fields; non-owners on public objects can only update personal fields (`privateTags`, `isVisited`).
- **Object delete** (`objects.remove`): owner only.

Typesense search applies the same visibility filter: `createdBy:=<userId> || isPublic:=true`.

## Auth flow

1. User signs in via Clerk on the frontend.
2. Clerk issues a JWT with the `convex` template.
3. Convex validates the token against `CLERK_JWT_ISSUER_DOMAIN` (see `src/convex/auth.config.ts`).
4. Clerk webhooks hit `POST /clerk-users-webhook` on the Convex HTTP router to upsert/delete users (`src/convex/http.ts`).

Requires `CLERK_WEBHOOK_SECRET` in the Convex deployment environment.

## Main workflows

### Browse the map

1. Authenticated user loads `/`.
2. `markers.list` query returns pins; frontend renders them via `MarkerManager`.
3. Category styling comes from `categories.list` (merges global defaults with per-user overrides).

### Create an object

1. User clicks the map → navigates to `/point?lat=&lng=`.
2. Reverse geocoding via `locations.getAddress` (Google Geocoding API, server-side).
3. Overlay opens in `pointPreview` or `pointCreate` mode (`objectDetailsOverlay` state).
4. On save, `objects.create` inserts `mapPoint`, `object`, and `marker`, then schedules Typesense sync.

### View or edit an object

1. Marker click or `/object/[id]` route opens the object details overlay.
2. SSR loads object data on direct navigation (`isServerRequest` in layout loaders).
3. Edit mode calls `objects.update`; Typesense sync is scheduled asynchronously.

### Search

1. User types in the search bar.
2. `search.preview` / `search.local` query Typesense; `search.google` queries Google Places.
3. Results appear as temporary `search`-source markers on the map (override list markers at the same ID).

### Share a link

1. `/object/[id]` works for anonymous users when the object is public.
2. Legacy MySQL IDs redirect via `objects.resolveShareId`.
3. Off-list shared objects use a `share`-source marker (`sharedMarker` state).

## Typesense sync

Object create/update/delete schedules async Typesense writes via `ctx.scheduler.runAfter(0, ...)`. Failures are logged server-side but not surfaced to the user. See [environment.md](./environment.md) for initial setup and backfill.

## Scheduled jobs

Daily crons in `src/convex/crons.ts`:

| Job | Schedule (UTC) | Handler |
| --- | --- | --- |
| Clean unused storage | 00:00 | `storage.cleanup` |
| Clean old import jobs | 00:15 | `imports.cleanupOldJobs` |

## Key source paths

| Area | Path |
| --- | --- |
| Schema | `src/convex/schema.ts` |
| Object CRUD | `src/convex/objects.ts` |
| Map marker query | `src/convex/markers.ts` |
| Categories + styling | `src/convex/categories.ts` |
| Search actions | `src/convex/search.ts` |
| Overlay state | `src/lib/state/objectDetailsOverlay.svelte.ts` |
| Map engine | `src/lib/services/map/` |
| Routes | `src/routes/(app)/` |
