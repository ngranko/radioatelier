# Object backend

Convex stores archive data and schedules external synchronization. The interactive API, CSV import, and Notion inbound sync share the object reader and writer helpers.

## Data ownership

| Table                              | Contents                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| `objects`                          | Metadata, owner, category/tag IDs, cover reference, visibility, and internal ID |
| `mapPoints`                        | Coordinates and address fields                                                  |
| `markers`                          | Compact map projection, including owner, category, coordinates, and visibility  |
| `categories`, `tags`               | Shared taxonomy                                                                 |
| `privateTags`, `objectPrivateTags` | Personal labels and per-object associations                                     |
| `userVisitedChunks`                | Per-user visited object IDs                                                     |
| `images`                           | Original and preview storage references, plus uploader ownership                |
| `objectNotionSync`                 | Notion page link, sync hashes, timestamps, and errors                           |

The complete schema is in [schema.ts](../src/convex/schema.ts). See [Authentication](authentication.md#object-permissions) for read and write permissions.

## Read path

```text
objects.getDetails
  -> objectReader.loadObjectAggregate
  -> objectDetails.loadObjectDetails
  -> viewer-specific details DTO
```

`helpers/objectReader.ts` joins objects with map points, categories, and public tags. Batch reads deduplicate related IDs. A missing map point or category invalidates the aggregate; missing tags are omitted.

`helpers/objectDetails.ts` adds image URLs, the viewer's private tags and visited flag, and `isOwner`. It returns `internalId` to signed-in viewers and `null` to anonymous viewers. Its pure `buildObjectDetails` helper accepts a preloaded aggregate and viewer context.

`objects.resolveShareId` accepts a canonical Convex ID or resolves a legacy `mysqlId`. The object page redirects legacy links to the canonical URL while retaining the query string.

## Write path

```text
objects.ts / imports.ts / objectsSync.ts
  -> helpers/objectWriter.ts
  -> objects + mapPoints + markers
  -> scheduled Typesense action
```

| Writer helper          | Responsibility                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `createObjectRecords`  | Validate category existence, insert the three records, assign an internal ID, schedule search creation |
| `loadObjectTarget`     | Load the aggregate and marker required for patching                                                    |
| `replaceObjectRecords` | Apply a full editable-field payload through the patch path                                             |
| `patchObjectRecords`   | Split fields by table and write changed values only                                                    |
| `upsertPrivateTags`    | Store a user's personal tag associations                                                               |

`objectRecordPatch.ts` routes fields to tables and filters unchanged values. The writer drops unsafe source URLs. If no stored field changes, patching returns without writes or a search action. Otherwise it schedules a Typesense update from the resulting object and map point, even if the changed field itself is not indexed.

Callers handle authentication, category/tag resolution, visited state, and outbound Notion scheduling. Visited changes use `helpers/objectHelpers.ts`; they do not rewrite the marker catalog.

## Personal state and deletion

Visited state is bucketed by user and object-ID hash. `src/convex/utils/visitedChunks.ts` takes the first three hexadecimal characters of an FNV-1a hash, giving 4,096 possible bucket keys. A `userVisitedChunks` row stores visited IDs for one user and bucket; it is not a fixed-size page of objects.

`getIsVisited` reads one bucket through `byUserIdAndChunkId`. `updateIsVisited` adds or removes an ID only when its value changes and deletes empty buckets. The marker query reads all buckets for the viewer and flattens them into a separate visited-ID feed.

Private tag definitions belong to a user in `privateTags`. `objectPrivateTags` associates those IDs with an object and user; details loading resolves only the viewer's association and omits deleted tag definitions.

Object deletion removes personal tag associations for all viewers. It uses the object's hash bucket and `byChunkId` index to remove visited references across users, then deletes the map point, marker, and object. Shared taxonomy definitions and uploaded cover files are not deleted by this helper; file retention is handled by cleanup.

## Entry points

| Module                              | Operations                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `objects.ts`                        | Public `create`, `update`, `reposition`, and `remove` mutations                    |
| `imports.ts`                        | `importBatch`, creating records for each accepted row                              |
| `objectsSync.ts`                    | Internal `createObjectFromSync`, `patchObjectFromSync`, and `deleteObjectFromSync` |
| `notionSync/objectWriterAdapter.ts` | Resolve sync taxonomy and translate sync fields into writer payloads               |

Inbound sync excludes description, cover, visibility, and private tags from its field vocabulary. It cannot clear those fields through an ordinary sync patch.

Removal uses `helpers/objectAggregate.ts` to delete the aggregate, removes sync state, and schedules Typesense deletion. Owner removal also schedules Notion page archival when the user has sync enabled and a linked page exists. Repositioning patches coordinates and search data; it does not schedule outbound Notion sync.

## Images and maintenance

Images are stored separately from object cover references. Uploading, saving an object, and cropping a preview are distinct writes, with different cancellation behavior. See [Images and cover photos](images.md) for processing, ownership, and cleanup.

[Database maintenance](maintenance.md) documents the migration runner, category-style and image-owner backfills, daily cleanup jobs, and external-data repair paths.

## Related guides

- [Search](search.md) for index reads and reconciliation.
- [CSV import](import.md) for batch processing and feedback.
- [Notion sync](notion-sync.md) for field direction and sync state.
- [Testing](testing.md) for helper-level coverage.
