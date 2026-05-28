# Categories & search

Taxonomy, per-user marker styling, full-text object search (Typesense), and external place discovery (Google Places).

## Categories

### Data model

| Table | Purpose |
| --- | --- |
| `categories` | Global taxonomy: `name`, `markerColor`, `markerIcon` |
| `userCategoryMarkerStyles` | Per-user overrides: color, icon, `isHidden` |

Allowed marker colors and icon keys are defined in `src/lib/services/map/markerStyling.data.ts` (9 OKLCH colors, 30 icon keys). New categories receive random defaults on insert.

### Convex API (`src/convex/categories.ts`)

| Export | Auth | Behavior |
| --- | --- | --- |
| `list` | Required | Merges global categories with user style overrides |
| `updateStyles` | Required | Upserts per-category user styles; validates against allowlists |
| `create` | Required | Normalizes name (lowercase, trim); dedupes via `byName` index |

`isHidden` removes a category from the **object form combobox only**. Map markers still render with that category's style.

### Frontend

- State: `src/lib/state/categories.svelte.ts`
- Hydration: SSR in `(app)/+layout.server.ts`, live query in `(app)/+layout.svelte`
- Settings UI: `src/lib/components/settings/settingsDialog.svelte`
- Form dropdown: `src/lib/components/objectDetails/objectForm/categorySelect.svelte` (filters hidden; can create new categories inline)
- Map rendering: `(fullList)/+layout.svelte` joins marker data with `categoriesState`

Any authenticated user can create a global category from the combobox. Names are deduplicated case-insensitively.

## Search

### Architecture

```
SearchBar (debounced 400 ms)
  → searchState (query + map center lat/lng, synced to URL)
  → api.search.preview (5 local + 2 Google)
  → "Load more" → api.search.local or api.search.google (paginated tabs)
```

Search result markers on the map use fixed styling (rose `#e11d48`) in `(app)/+layout.svelte`, not category colors.

### Convex actions (`src/convex/search.ts`)

All search actions require authentication.

| Action | Limit | Source |
| --- | --- | --- |
| `preview` | 5 local + 2 Google | Typesense + Google Places |
| `local` | 20/page, offset | Typesense only |
| `google` | 20/page, pageToken | Google Places only |
| `googlePlaceDetails` | Single place | Google Places Details |

Coordinate queries like `"55.75, 37.62"` bypass both backends and return a synthetic local item.

Google failures in `preview` are logged and swallowed so local results still appear.

### Typesense

**Client config** — `src/convex/typesense/client.ts`:

| Variable | Used for |
| --- | --- |
| `TYPESENSE_URL` | Server URL |
| `TYPESENSE_SEARCH_KEY` | Read/search |
| `TYPESENSE_SYNC_KEY` | Write/sync |
| `TYPESENSE_COLLECTION` | Collection name (default: `objects`) |

**Search** — `src/convex/typesense/objects.ts`:

- Query fields: `name`, `address`, `city`, `country`, `categoryName`
- Filter: `createdBy:=<userId> || isPublic:=true`
- Sort: text match, then geo distance from search center

**Sync** — `src/convex/typesense.ts` internal actions, scheduled from `objects.ts`:

| Object mutation | Typesense action |
| --- | --- |
| `create` | `createInTypesense` |
| `update` | `createInTypesense` |
| `reposition` | `updateInTypesense` |
| `remove` | `removeFromTypesense` |

Collection schema: `scripts/typesense/setup.ts` and `typesenseObjectSchema` in `src/convex/sharedValidators.ts`.

Initial setup and backfill: see [docs/README.md](./README.md#typesense-operations).

### Google APIs

Two separate Google APIs are used:

| API | Env var | Used for |
| --- | --- | --- |
| Places API v1 | `GOOGLE_API_KEY` (Convex env) | Search tab, place details, `/point?placeId=` |
| Geocoding REST | `GOOGLE_API_KEY` (Convex env) | Reverse geocode on map click (`api.locations.getAddress`) |

Set `GOOGLE_API_KEY` in the Convex dashboard (Settings → Environment Variables), not in `.env.local`.

Frontend Google Maps uses keys in `src/lib/config/index.ts` (`googleMapsApiKey`, `googleMapsId`).

## Selecting a search result

| Result type | Navigation |
| --- | --- |
| Existing object (`id` present) | `/object/:id` |
| Google place or new location | `buildPointUrl()` → `/point?lat=&lng=&placeId?` + point preview overlay |

Ephemeral search markers are tracked in `src/lib/state/searchPointList.svelte.ts`.

## Auth boundaries

| API | Anonymous access |
| --- | --- |
| `objects.getDetails` | Yes (shared links) |
| `categories.list` | No |
| `search.*` actions | No |
| `markers` query | No |

## Object CRUD and markers

Map markers come from the denormalized `markers` table (`src/convex/markers.ts`), not a live join on `objects`. Object mutations update `markers` and schedule Typesense sync.

**Authorization:**

- `getDetails` — anonymous OK; private tags and visited status only when logged in
- `update` — owner edits all fields; non-owner can edit personal fields on public objects
- `remove` / `reposition` — owner only

## Common pitfalls

- **Missing `GOOGLE_API_KEY` in Convex** — search and reverse geocoding fail at runtime; it is not in `.env.local.example` because it is a server-side Convex variable.
- **`isHidden` vs map** — hiding a category affects the form, not map visibility.
- **Typesense drift** — if search results are stale, run backfill (`scripts/typesense/backfill.ts`) after schema changes.
- **Search vs category styling** — do not expect search pins to reflect category customization.
- **`objects.update` Typesense path** — schedules `createInTypesense` (document create), not update; reposition uses `updateInTypesense`.
