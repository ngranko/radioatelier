# Category settings

Users customize how categories appear on the map and in object forms. Settings live at `/settings` (dialog opened from the logged-in menu).

## Data model

Two tables drive category appearance:

| Table                      | Scope              | Fields                                  |
| -------------------------- | ------------------ | --------------------------------------- |
| `categories`               | Global defaults    | `name`, `markerColor`, `markerIcon`     |
| `userCategoryMarkerStyles` | Per-user overrides | `markerColor`, `markerIcon`, `isHidden` |

`api.categories.list` merges them: user overrides win when present; `isHidden` defaults to `false`.

New categories created via `api.categories.create` get a random color and icon from `MARKER_COLORS` / `MARKER_ICON_KEYS` in `src/lib/services/map/markerStyling.data.ts`.

## Convex API

| Function                  | File                       | Purpose                                     |
| ------------------------- | -------------------------- | ------------------------------------------- |
| `categories.list`         | `src/convex/categories.ts` | Merged category list for the signed-in user |
| `categories.updateStyles` | `src/convex/categories.ts` | Upsert per-user style rows                  |
| `categories.create`       | `src/convex/categories.ts` | Add a global category (admin flow)          |

`updateStyles` validates `markerColor` and `markerIcon` against the allowed palettes. Invalid values throw `ConvexError('Invalid category style')`.

## Allowed values

Colors and icon keys are defined in `src/lib/services/map/markerStyling.data.ts`:

- **Colors** — nine OKLCH values (`MARKER_COLORS`)
- **Icons** — Lucide-based keys such as `activity`, `anchor`, `landmark`, … (`MARKER_ICON_KEYS`)

The settings UI uses `ColorPicker`, `IconPicker`, and `MarkerPreview` (`src/lib/components/settings/`).

## Client state

`categoriesState` (`src/lib/state/categories.svelte.ts`) is populated from `api.categories.list` in the app layout. The full-list layout reads `categoriesState.categories[point.categoryId]` when rendering map markers.

## `CategoryBadge` component

`src/lib/components/categoryBadge.svelte` renders a category's marker icon and optional name using merged styles from `categoriesState`. It accepts `categoryId` (preferred) or falls back to a name lookup — search results often carry only the name. Used in the object details header (minimized row, icon-only) and view mode title row.

## What `isHidden` does

The settings checkbox is labeled "hide from list" (`categoryStyleEditor.svelte`). In code, `isHidden` only affects the category picker in object forms:

```19:19:src/lib/components/objectDetails/objectForm/categorySelect.svelte
            .filter(item => !item.isHidden)
```

Hidden categories **still appear on the map** with their customized marker style. They are excluded only when choosing a category while creating or editing an object.

## Save flow

1. User edits styles in `settingsDialog.svelte` (local `StyleState` per category).
2. On save, changed rows are sent to `categories.updateStyles`.
3. Convex upserts `userCategoryMarkerStyles` rows.
4. `categories.list` reactive query refreshes map markers and the form picker.

## Related docs

- [map-architecture.md](./map-architecture.md) — how marker color/icon reach the map renderer
