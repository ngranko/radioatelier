# Object backend

Archive objects are split across several Convex tables (`objects`, `mapPoints`, `markers`, `categories`, `tags`). The backend keeps reads and writes behind three small helpers so callers do not reimplement joins, viewer-specific projection, or search-index scheduling.

## Layer overview

```
objects.ts (public queries/mutations)
    ↓
objectReader.ts   — load ObjectAggregate (object + mapPoint + category + tags)
objectDetails.ts  — project aggregate → client DTO (cover, private tags, isOwner)
objectWriter.ts   — create/patch records + schedule Typesense updates
    ↓
notionSync/objectWriterAdapter.ts — map Notion fields → ObjectRecordData/Patch
imports.ts, objectsSync.ts        — call writer directly
```

| Module | Role |
| ------ | ---- |
| `helpers/objectReader.ts` | Batch-load related docs; dedupe ids across a page of objects |
| `helpers/objectDetails.ts` | Viewer-aware details DTO for `objects.getDetails` |
| `helpers/objectWriter.ts` | Create/patch `objects` + `mapPoints` + `markers`; enqueue Typesense create/update |
| `helpers/objectRecordPatch.ts` | Split a logical object patch into per-table slices |
| `notionSync/objectWriterAdapter.ts` | Resolve categories/tags and build writer payloads for inbound sync |

## Object aggregate

`ObjectAggregate` joins one `objects` row with its `mapPoint`, `category`, and resolved `tags`:

- Missing **map point** or **category** invalidates the aggregate — the object is treated as unusable.
- Missing **tag** docs are omitted silently so a deleted tag does not orphan objects that still reference it.

`loadObjectAggregates(ctx, objects[])` deduplicates related ids and loads map points, categories, and tags in parallel. `loadObjectAggregate` is the single-object wrapper.

Notion sync snapshots (`notionSync/snapshot.ts`) and discrepancy reports assemble sync field payloads from aggregates via `assembleObjectSnapshot` / `buildAppFields`.

## Details projection

`loadObjectDetails(ctx, aggregate, user)` returns the shape consumed by the object details overlay:

- **Location and metadata** — from the aggregate (`name`, `description`, periods, `source`, category, public tags).
- **Viewer context** — private tags, visited flag, cover image URLs, `isOwner`, and `internalId` (owners only).

`buildObjectDetails` is pure given a preloaded aggregate and viewer context; tests cover per-viewer field visibility without a database.

`objects.getDetails` allows anonymous reads because `/object/[id]` is the shared-object entry point.

## Writer seam

All object **creates** and **field patches** that should stay consistent across tables go through `objectWriter.ts`.

### Create

`createObjectRecords(ctx, ownerId, data)` inserts `mapPoints`, `objects`, and `markers`, then schedules `internal.typesense.createInTypesense`. CSV import and inbound Notion create both use this path — import indexing depends on create going through the writer, not ad-hoc inserts.

### Patch

`patchObjectRecords(ctx, target, patch)` splits the patch via `objectRecordPatch`, applies only changed fields to `objects`, `mapPoints`, and `markers`, then schedules `internal.typesense.updateInTypesense`.

`loadObjectTarget(ctx, objectId)` loads the aggregate plus the owner's `markers` row — required before patching.

Search records mirror **post-write** state: the writer merges applied patches over the loaded target rather than trusting caller-held copies (callers often hold stale slices).

### Out of scope for the writer

Per-user overlays that do not affect search or map pins — private tags, visited state — are updated via dedicated helpers (`upsertPrivateTags`, `updateIsVisited`) from `objects.ts` or `objectsSync.ts`.

## Notion sync adapter

Inbound sync never patches Convex tables directly. `objectsSync.ts` calls:

1. `resolveCreateClassification` / `resolvePatchClassification` — ensure category and tag rows exist.
2. `buildSyncCreateData` / `buildSyncRecordPatch` — map Notion vocabulary to `ObjectRecordData` / `ObjectRecordPatch`.
3. `createObjectRecords` / `patchObjectRecords` — persist and index.

Fields outside the sync vocabulary (`isPublic`, `description`, `cover`, private tags) never appear in sync patches, so inbound webhooks cannot clear them accidentally.

## Public Convex API

| Function | Uses |
| -------- | ---- |
| `objects.getDetails` | `loadObjectAggregate` + `loadObjectDetails` |
| `objects.create` / `update` / `reposition` | `createObjectRecords` / `patchObjectRecords` / `replaceObjectRecords` |
| `objects.delete` | `deleteObjectAggregate` + Typesense remove |
| `imports.importBatch` | `createObjectRecords` per row |
| `objectsSync.createObjectFromSync` / `patchObjectFromSync` | writer via adapter |

## Related docs

- [notion-sync.md](./notion-sync.md) — inbound decisions and sync field hashing
- [import.md](./import.md) — CSV batches call `createObjectRecords`
- [search.md](./search.md) — Typesense reads; indexing is scheduled by the writer
- [testing.md](./testing.md) — unit tests for reader, details, and writer
