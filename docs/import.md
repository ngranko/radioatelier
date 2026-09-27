# CSV import

Signed-in users open `/import` from the user menu. The browser parses the file, maps columns, uploads images, and sends batches to Convex. Keep the browser session open while it sends rows.

## Import flow

```text
Upload CSV and choose separator/header handling
  -> preview rows and map columns
  -> normalize rows
  -> resolve images and send batches of 25
  -> imports.importBatch creates objects and updates the job
  -> scheduled Typesense writes and optional Notion batch
```

`src/lib/services/importProvider.ts` owns batch submission. `progress.svelte` subscribes to `imports.getJob` for progress and feedback. Parsing and normalization live in `src/lib/services/import/`; the UI lives in `src/lib/components/userMenu/import/`.

The separator defaults to `;` and must be one character. Quoted fields support escaped quotes, and completely blank rows are discarded. Users specify whether the first row is a header.

## Column mapping

Coordinates, name, and category mappings are required. Text limits are applied on the backend by trimming and truncation.

| Field                                | Accepted value and limit                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `coordinates`                        | Latitude and longitude separated by a comma, within geographic bounds                |
| `name`                               | Required text, 256 characters                                                        |
| `category`                           | Required text, 128 characters                                                        |
| `isVisited`, `isPublic`, `isRemoved` | True for `1`, `true`, `yes`, `y`, or `да`, ignoring case; otherwise false            |
| `tags`, `privateTags`                | Separated by commas or semicolons; lowercased, deduplicated, 128 characters per tag  |
| `address`                            | 256 characters                                                                       |
| `city`, `country`                    | 128 characters each                                                                  |
| `installedPeriod`, `removalPeriod`   | 64 characters each                                                                   |
| `description`                        | 8,000 characters                                                                     |
| `source`                             | HTTP or HTTPS URL, up to 2,048 characters; invalid values are omitted with a warning |
| `image`                              | HTTP/HTTPS URL or base64 data URL; JPEG, PNG, or WebP                                |

Import category resolution title-cases words and matches existing names case-insensitively. New categories receive random default marker styling. Private tags belong to the importing user.

## Images

`imageResolver.ts` fetches or decodes images in the browser, checks MIME type, resizes, and uploads them to Convex storage. Remote hosts must permit the browser fetch. Failed images produce a warning and the row can still import without a cover.

Successfully resolved image sources are cached during the job. Image upload happens before the object batch, so cancellation or a failed row can leave an unused upload for scheduled storage cleanup.

See [Images and cover photos](images.md) for resize policy, ownership, and storage retention.

## Progress and failure handling

`imports.importBatch` validates job ownership and processes rows. Invalid coordinates, missing names, and missing categories count as processed failures. Per-row exceptions add error feedback; feedback is capped at 300 entries.

A terminal `success` status means processing completed, not that every row succeeded. Compare `successfulRows` with `processedRows` and inspect feedback. Fatal client-side failures finalize the job as `error`.

Each batch has an increasing sequence number. Convex ignores a sequence less than or equal to the job's last accepted sequence, preventing replay of that batch. This does not deduplicate a new import job containing the same CSV.

Cancellation marks a running job `cancelled` and stops further client batches. Already imported objects remain. Job records are removed after seven days, measured from their finish time or start time, by the daily 00:15 UTC cleanup.

## Convex API

All public functions below check the current user; existing-job operations check ownership.

| Function                 | Purpose                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `imports.startJob`       | Create a running job with row count; accepts validated mappings but does not store them |
| `imports.importBatch`    | Process rows and update counters, feedback, and last sequence                           |
| `imports.getJob`         | Subscribe to job status and feedback                                                    |
| `imports.cancelJob`      | Cancel a running job                                                                    |
| `imports.finalizeJob`    | Finish or report a client-side failure                                                  |
| `imports.cleanupOldJobs` | Internal scheduled retention cleanup                                                    |

## Search and Notion

Each accepted row uses `createObjectRecords`, which schedules Typesense indexing. Search availability follows the asynchronous index write.

For a sync-enabled importer, a successful batch schedules `enqueueOutboundObjectSyncBatchLenient` with its created object IDs. It logs individual Notion failures and continues with other objects. Completing the import does not guarantee that indexing or Notion sync has finished.

See [Object backend](object-backend.md), [Search](search.md), and [Notion sync](notion-sync.md) for those downstream paths.
