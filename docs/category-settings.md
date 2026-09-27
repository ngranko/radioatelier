# Category settings

`/settings` opens a dialog for personal category colors, icons, and picker visibility. These settings change the current user's presentation of shared categories.

## Stored values and API

| Table                      | Scope                 | Fields                                  |
| -------------------------- | --------------------- | --------------------------------------- |
| `categories`               | Shared defaults       | `name`, `markerColor`, `markerIcon`     |
| `userCategoryMarkerStyles` | Per user and category | `markerColor`, `markerIcon`, `isHidden` |

`src/convex/categories.ts` provides:

- `list`, which requires a current user and merges overrides over defaults. `isHidden` defaults to `false`.
- `updateStyles`, which validates colors and icons against `MARKER_COLORS` and `MARKER_ICON_KEYS`, then upserts the user's overrides.
- `create`, which requires authentication, trims and lowercases the name, reuses an exact normalized match, and assigns random default styling to a new category. It is not restricted to an admin role.

Allowed colors and icon keys live in `src/lib/services/map/markerStyling.data.ts`. Import uses its own case-insensitive category lookup and title-casing helper; see [CSV import](import.md).

## Settings flow

`settingsDialog.svelte` keeps local edits and submits changed rows to `categories.updateStyles`. The reactive category query updates `categoriesState`, which supplies map marker styles, badges, and form choices.

`CategoryBadge` in `src/lib/components/categoryBadge.svelte` looks up a category by ID or, for search results, by name. `ColorPicker`, `IconPicker`, and `MarkerPreview` live under `src/lib/components/settings/`.

The "hide from list" checkbox sets `isHidden`. It excludes the category from the object form's category picker. Objects in that category remain visible on the map with their chosen styles.

## Taxonomy picker

Create and edit forms use `objectForm/taxonomyField.svelte` and `taxonomySheet.svelte` for a combined category-and-tags field.

| Tab       | Form field    | Selection              |
| --------- | ------------- | ---------------------- |
| категория | `category`    | Single category        |
| теги      | `tags`        | Multiple shared tags   |
| приватные | `privateTags` | Multiple personal tags |

The shared input filters the current tab and offers creation for a new name through `categories.create`, `tags.create`, or `privateTags.create`. Selected rows sort first. Selecting or creating clears the query and returns input focus; clearing a tab affects only that tab.

Arrow keys move the highlight with wrapping, Enter selects or creates, and Escape closes the sheet. Removing a chip from the field does not reopen it. Hidden inputs submit the category and repeated tag IDs with the object form.

The sheet mounts inside the details panel's portal target. Selections bind to the form immediately, so closing the sheet dismisses it without reverting those selections. The parent form's save persists the object.

See [Map architecture](map-architecture.md) for rendering and [Object details overlay](object-details-overlay.md) for panel behavior.
