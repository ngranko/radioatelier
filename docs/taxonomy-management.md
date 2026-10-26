# Taxonomy management

`/taxonomies` (dialog opened from the logged-in menu) is where a taxonomy gets renamed or deleted. Every signed-in user manages their own **private tags** there; admins additionally manage the shared vocabulary — **categories** and **tags** — with an archive-wide usage count.

## Access

The split follows ownership: a private tag belongs to the user who created it, while categories and tags are the archive's.

| Kind        | Who may rename and delete | Usage count covers      |
| ----------- | ------------------------- | ----------------------- |
| Category    | Admins                    | Every owner's Objects   |
| Tag         | Admins                    | Every owner's Objects   |
| Private tag | Its owner                 | The owner's own Objects |

`taxonomies.list` requires only a signed-in user; it returns the caller's private tags always, and the shared lists (plus an `isAdmin` flag the dialog uses to decide whether to show tabs at all) only for admins. The category and tag mutations call `getCurrentAdminOrThrow` first. The private-tag mutations pass the caller's id into the editor, which treats a private tag with another `createdById` as missing (`notFound`), so a guessed id reveals nothing, and refuses a merge target the caller does not own the same way. Admin means `role === 'admin'` on the `users` row, mirrored from Clerk `public_metadata.role` by `upsertFromClerk`.

## Usage counts

`countSharedTaxonomyUsage` (`src/convex/helpers/objectTaxonomy.ts`) scans `markers`, which mirror the category and tags of their Object. Counting from markers is what makes those numbers archive-wide rather than viewer-scoped: they include Objects owned by other users, public or not.

`countPrivateTagUsage` reads only the calling user's `objectPrivateTags` rows (index `byUserId`), so a private tag's count is how many of that user's Objects carry it. Non-admins never trigger the marker scan.

## Convex API

| Function                                                 | Purpose                                                                     |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `taxonomies.list`                                        | The caller's private tags, plus the shared lists for admins                 |
| `categories.rename`, `tags.rename`, `privateTags.rename` | Rename one taxonomy (normalized like `create`)                              |
| `categories.remove`, `tags.remove`, `privateTags.remove` | Delete one taxonomy, optionally moving its Objects to `replacementId` first |

Each kind's mutations sit beside its `create` and take typed ids (`v.id('categories')` and so on), so Convex argument validation proves an id belongs to its table. They delegate to one function per kind and action in `helpers/taxonomyEditor.ts` (`renameCategory`, `removeTag`, …). Name normalization is shared with `create` through `helpers/taxonomyNames.ts`.

Failures are thrown as `ConvexError({code})`, where `code` is a `TaxonomyErrorCode` from `src/lib/interfaces/taxonomy.ts`: `nameRequired`, `nameTaken`, `notFound`, `categoryInUse`, `selfReplacement`, `deletionInProgress`, `migrationInProgress`.

## Rename

Names are normalized the same way `create` normalizes them: categories capitalize each word (`capitalizeCategoryName`), tags and private tags are trimmed and lowercased. A name already held by another taxonomy of the same kind is refused — category names collide case-insensitively, because rows created before categories were capitalized still hold lowercase names, and private tags collide only within one owner. Merging is done through delete-with-move, not through renaming onto an existing name.

## Delete

| Kind        | Without a replacement           | With a replacement                                   |
| ----------- | ------------------------------- | ---------------------------------------------------- |
| Category    | Only when nothing uses it       | Objects and markers move to the replacement category |
| Tag         | Tag is dropped from its Objects | Replacement takes its place, never duplicated        |
| Private tag | Tag is dropped from its Objects | Replacement (same owner only) takes its place        |

Objects cannot exist without a category, so deleting a category that is still in use requires a replacement — `removeCategory` throws `categoryInUse` otherwise. Deleting a category also drops the per-user `userCategoryMarkerStyles` rows pointing at it.

## Write path

Bulk rewrites live in `helpers/objectTaxonomy.ts` rather than in the Object writer: they touch `objects` and `markers` for many Objects at once, and the resulting search and sync work is scheduled once for the whole list instead of per Object.

`scheduleTaxonomyFanout` (`helpers/taxonomyFanout.ts`) takes the affected Object ids and:

1. Sets `categoryName` on the Typesense records when the edit changed the category name an Object ends up with (`internal.typesense.setCategoryNameInTypesenseBatch`, one bulk partial import for all affected Objects). Only that field is sent, so it cannot overwrite a concurrent Object edit, and a failed document is logged without stopping the rest of the import. Tag names are not part of the search record, so tag edits skip this step.
2. Schedules one `enqueueOutboundObjectSyncBatchLenient` for all the same ids — both `categoryName` and `tagNames` are Object Sync Fields, so Notion would otherwise keep the old wording. The action syncs 100 Objects and schedules itself for the rest, so a large edit never hits the Notion rate limit from parallel actions. Objects owned by non-sync users are skipped inside the action; a failed Object keeps its error in `objectNotionSync.lastSyncError`.

Private tags reach neither search nor Notion, so their edits fan out to nothing.

Shared taxonomy deletion runs in scheduled batches of up to 500 markers. The initiating transaction sets `isDeleting` on the source and records `deletionReplacementId` when moving Objects. Both fields are optional for existing rows. Each batch updates Objects and their markers together, schedules fanout, and deletes the taxonomy after the final batch. Category batches use `markers.byCategoryId`; tag batches paginate all markers because tag arrays cannot be indexed.

Deleting taxonomies reject renames, repeated deletions, new assignments, and use as another deletion's replacement. `byDeletionReplacementId` prevents deleting a destination while an incoming migration still depends on it. These checks read the taxonomy within the writing transaction, so concurrent deletions and assignments conflict and retry against the current state. Object creation, changed taxonomy assignments, imports, and Notion sync share these checks. Unrelated Object edits remain available. Private tags are removed in one transaction; assignment validates that each private tag still exists and belongs to the caller.

## UI

| File                                                        | Role                                             |
| ----------------------------------------------------------- | ------------------------------------------------ |
| `src/routes/(app)/(fullList)/taxonomies/+page.svelte`       | Route that opens the dialog over the map         |
| `src/lib/components/taxonomies/taxonomyDialog.svelte`       | Kind tabs, search, list                          |
| `src/lib/components/taxonomies/taxonomyRow.svelte`          | One row with inline rename and the delete toggle |
| `src/lib/components/taxonomies/taxonomyRemovalPanel.svelte` | Replacement picker and confirmation              |
| `src/lib/components/taxonomies/taxonomyActions.ts`          | Binds each kind to its rename/remove mutations   |
| `src/lib/components/taxonomies/taxonomyErrors.ts`           | `TaxonomyErrorCode` → Russian toast text         |

Non-admins see a single private-tag list with no tab bar, under a "Приватные теги" heading. Rename is inline in the row and delete expands a panel underneath it, so the flow never stacks a second modal over the dialog. The deleting indicator comes from the persisted state, so every client sees it after a reload. Deleting entries are excluded from assignment and replacement pickers. The list refreshes itself: `taxonomies.list` is a reactive query, as are `categories.list`, `tags.list`, and `privateTags.list` elsewhere in the app.

## Related docs

- [category-settings.md](./category-settings.md) — per-user marker styling for the same categories
- [object-backend.md](./object-backend.md) — the Object writer seam these bulk edits sit beside
- [notion-sync.md](./notion-sync.md) — what the outbound resync actually pushes
