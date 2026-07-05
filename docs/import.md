# CSV import

Bulk import lets signed-in users create archive objects from a CSV file. The flow lives under **User menu → Import** (`/import`), implemented as a multi-step dialog.

## End-to-end flow

```
uploadFile.svelte (pick CSV, separator, header row)
    ↓ parseCsv
preview.svelte (column mapping + row preview)
    ↓ normalizeRows + ImportProvider.start
importProvider.ts (25-row batches, image upload)
    ↓ api.imports.importBatch
Convex imports.ts (validate, createObjectRecords, feedback)
    ↓ optional Notion batch
notionSync/outbound.enqueueOutboundObjectSyncBatchLenient
```

Progress and completion are driven by `api.imports.getJob` (`progress.svelte` subscribes via `useQuery`). Job records are retained for seven days (`cleanupOldJobs` internal mutation).

## Required and optional columns

Users map CSV columns to fields in the preview step. Three mappings are required:

| Field | Required | Notes |
| ----- | -------- | ----- |
| `coordinates` | Yes | `"lat,lng"` — comma-separated, optional space after comma |
| `name` | Yes | Trimmed; max 256 chars (longer values truncated) |
| `category` | Yes | Trimmed; max 128 chars |
| `isVisited`, `isPublic`, `isRemoved` | No | True when value is `1`, `true`, `yes`, `y`, or `да` (case-insensitive) |
| `tags`, `privateTags` | No | Split on `;` or `,`; each tag lowercased, max 128 chars |
| `address`, `city`, `country` | No | Location text fields with per-field length limits |
| `installedPeriod`, `removalPeriod` | No | Max 64 chars |
| `description` | No | Max 8000 chars |
| `source` | No | Must be a valid `http://` or `https://` URL; invalid values skipped with a warning |
| `image` | No | HTTP(S) URL or base64 data URL (`jpeg`, `png`, `webp` only) |

Field-level validation hints shown in the UI are defined in `src/lib/components/userMenu/import/preview/preview.ts`.

## Normalization and backend rules

Client normalization (`src/lib/services/import/normalize.ts`) trims cells and parses booleans/tags before rows reach Convex.

Server-side processing (`src/convex/imports.ts`):

- **Categories** — `ensureCategory` title-cases each word and matches existing categories case-insensitively (`helpers/importHelpers.ts`). New categories get a random marker color and icon.
- **Tags** — Public tags are deduplicated and stored lowercased. Private tags are scoped to the importing user.
- **Coordinates** — Invalid latitude/longitude produce a per-line error; the row is skipped.
- **Source URLs** — Invalid URLs are dropped with a warning; the object is still created.
- **Images** — Resolved client-side per batch (`imageResolver.ts`): fetch or decode, resize, upload to Convex storage, then pass `imageId` to `importBatch`. Failures log a warning and import continues without a cover image.
- **Feedback** — Per-line warnings and errors are stored on the job (capped at 300 entries).

## Batch processing and idempotency

`ImportProvider` sends rows in batches of 25 (`BATCH_SIZE` in `importProvider.ts`). Each batch carries a monotonically increasing `sequence` number.

`imports.importBatch` ignores batches whose `sequence` is less than or equal to `lastBatchSequence` on the job, so retries do not double-import rows.

The submit button is disabled while a job is starting or already running (`preview.svelte`), preventing accidental duplicate submissions.

## Notion sync on import

When the importing user has `notionSyncEnabled`, successfully imported object ids from a batch are collected and enqueued as a single outbound sync via `enqueueOutboundObjectSyncBatchLenient`. That lenient action logs per-object failures and continues with the rest of the batch — one bad row does not abort the whole import sync.

See [notion-sync.md](./notion-sync.md) for sync setup and invariants.

## Convex API

| Function | Type | Purpose |
| -------- | ---- | ------- |
| `imports.startJob` | mutation | Create a `running` job with `totalRows` and column mappings |
| `imports.importBatch` | mutation | Process one batch; update progress, feedback, and optional Notion enqueue |
| `imports.getJob` | query | Poll job status (owner-only) |
| `imports.cancelJob` | mutation | Mark a running job as `cancelled` |
| `imports.finalizeJob` | mutation | Force terminal status on client-side failure |
| `imports.cleanupOldJobs` | internal mutation | Delete jobs older than seven days |

## CSV parsing constraints

- Default separator is `;`; users can change it in the upload step (must be a single character).
- Quoted fields support escaped double quotes (`""` inside `"..."`).
- Empty rows (all cells blank) are filtered out after parsing.

## Related docs

- [notion-sync.md](./notion-sync.md) — outbound sync after import batches
- [map-architecture.md](./map-architecture.md) — imported objects appear on the map via `markers.list`
- [category-settings.md](./category-settings.md) — per-user styling for imported categories
