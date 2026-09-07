# Taxonomy management

Admins curate the archive's shared vocabulary at `/taxonomies` (dialog opened from the logged-in menu, "Справочники"). The page lists every category, tag, and private tag in the system with an archive-wide usage count, and allows renaming or deleting each one.

## Access

Every function in `src/convex/taxonomies.ts` starts with `getCurrentAdminOrThrow` (`src/convex/users.ts`), which requires `role === 'admin'` on the `users` row. The role is mirrored from Clerk `public_metadata.role` by `upsertFromClerk`. The menu entry is hidden for everyone else; a non-admin who opens the route directly gets an error state instead of a list.

## Usage counts

`countTaxonomyUsage` (`src/convex/helpers/objectTaxonomy.ts`) scans `markers` — which mirror the category and tags of their Object — plus `objectPrivateTags`. Counting from markers is what makes the numbers archive-wide rather than viewer-scoped: they include Objects owned by other users, public or not.

Private tags are per-owner rows, so the list shows the owner's email next to each one and a private tag can only be merged into another tag of the same owner.

## Convex API

| Function            | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| `taxonomies.list`   | Categories, tags, and private tags with usage counts     |
| `taxonomies.rename` | Rename one taxonomy (normalized to trimmed lowercase)    |
| `taxonomies.remove` | Delete one taxonomy, optionally moving its Objects first |

Both mutations take `{type, id}` where `type` is `category | tag | privateTag` and `id` is a plain string; `resolveTaxonomyRef` (`helpers/taxonomyRef.ts`) normalizes it against the table the type names, which is what proves the id belongs there.

## Rename

Names are normalized the same way `create` normalizes them (trimmed, lowercased). A name already held by another taxonomy of the same kind is refused — private tags collide only within one owner. Merging is done through delete-with-move, not through renaming onto an existing name.

## Delete

| Kind        | Without a replacement           | With a replacement                                   |
| ----------- | ------------------------------- | ---------------------------------------------------- |
| Category    | Only when nothing uses it       | Objects and markers move to the replacement category |
| Tag         | Tag is dropped from its Objects | Replacement takes its place, never duplicated        |
| Private tag | Tag is dropped from its Objects | Replacement (same owner only) takes its place        |

Objects cannot exist without a category, so deleting a category that is still in use requires a replacement — `removeCategory` throws `ConvexError('Category is still in use')` otherwise. Deleting a category also drops the per-user `userCategoryMarkerStyles` rows pointing at it.

## Write path

Bulk rewrites live in `helpers/objectTaxonomy.ts` rather than in the Object writer: they touch `objects` and `markers` for many Objects at once, and the resulting search and sync work is batched instead of scheduled per Object.

`scheduleTaxonomyFanout` (`helpers/taxonomyFanout.ts`) takes the affected Object ids and:

1. Rebuilds the Typesense record when the edit changed the category name an Object ends up with (`internal.typesense.updateManyInTypesense`, batches of 100). Tag names are not part of the search record, so tag edits skip this step.
2. Schedules `enqueueOutboundObjectSyncBatchLenient` for the same ids — both `categoryName` and `tagNames` are Object Sync Fields, so Notion would otherwise keep the old wording. Objects owned by non-sync users are skipped inside the action.

Private tags reach neither search nor Notion, so their edits fan out to nothing.

## UI

| File                                                   | Role                                             |
| ------------------------------------------------------ | ------------------------------------------------ |
| `src/routes/(app)/(fullList)/taxonomies/+page.svelte`  | Route that opens the dialog over the map         |
| `src/lib/components/admin/taxonomyDialog.svelte`       | Kind tabs, search, list                          |
| `src/lib/components/admin/taxonomyRow.svelte`          | One row with inline rename and the delete toggle |
| `src/lib/components/admin/taxonomyRemovalPanel.svelte` | Replacement picker and confirmation              |
| `src/lib/components/admin/taxonomyErrors.ts`           | `ConvexError` message → Russian toast text       |

Rename is inline in the row and delete expands a panel underneath it, so the flow never stacks a second modal over the dialog. The list refreshes itself: `taxonomies.list` is a reactive query, as are `categories.list`, `tags.list`, and `privateTags.list` elsewhere in the app.

## Related docs

- [category-settings.md](./category-settings.md) — per-user marker styling for the same categories
- [object-backend.md](./object-backend.md) — the Object writer seam these bulk edits sit beside
- [notion-sync.md](./notion-sync.md) — what the outbound resync actually pushes
