# Database maintenance

Convex owns the application database, file storage, migration state, and scheduled jobs. Typesense is a separate derived index. These maintenance paths have different effects and must target the intended deployment.

## Available migrations

`src/convex/convex.config.ts` installs `@convex-dev/migrations`. Definitions and the generic `run` runner live in `src/convex/migrations.ts`.

| Function            | Table     | Effect                                    |
| ------------------- | --------- | ----------------------------------------- |
| `clearObjectCovers` | `objects` | Unset the retired `objects.coverId` field |

The cover is the first gallery image, so nothing reads `coverId`. Once `clearObjectCovers` has completed on production, remove `coverId` from `objectTableFields` in `src/convex/sharedValidators.ts` together with the migration.

## Run a migration

Use the installed migration runner from the repository root. These examples target the CLI's configured development deployment; add `--prod` only when intentionally operating on production.

Preview one batch without persisting its changes:

```bash
npx convex run migrations:run '{"fn":"migrations:clearObjectCovers","dryRun":true}'
```

Inspect its output, then start or resume the migration:

```bash
npx convex run migrations:run '{"fn":"migrations:clearObjectCovers"}'
```

The component records progress and schedules batches. Repeating the runner reports or resumes its recorded state; it does not implicitly restart a completed migration. An explicit `reset: true` starts from the beginning. `batchSize` can override batch size.

A dry run checks a batch, not the whole table. Review completion status and logs in Convex after a real run, then verify the affected behavior. The repository defines migrations but does not automatically run them from its deploy script.

Check its status with:

```bash
npx convex run --component migrations lib:getStatus '{"names":["migrations:clearObjectCovers"]}'
```

## Scheduled cleanup

`src/convex/crons.ts` registers two daily internal mutations:

| Time, UTC | Function                    | Effect                                                                                        |
| --------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| 00:00     | `storage.sweepUnusedImages` | Remove image rows unused by galleries or photo captures, then files unreferenced by any image |
| 00:15     | `imports.cleanupOldJobs`    | Remove jobs older than seven days, using finish time or start time                            |

Storage cleanup pages through images and then files in batches, rescheduling itself until done, and skips anything younger than a day. Import-job cleanup pages through jobs the same way and removes progress and feedback records, not imported objects.

Object removal separately deletes its map point, marker, all personal tag associations, and visited references. It leaves shared category/tag definitions intact. External index removal and any Notion archival are scheduled separately from the database deletion.

## Repair derived data

- For missing or stale archive search results, use the [Typesense backfill](search.md#running-the-backfill-against-production). It reconciles documents and can delete stale index rows.
- For Notion mismatches, run the [sync audit](notion-sync.md#audit-discrepancies). It reports differences without repairing them.
- For image preview ownership failures, inspect the image's `createdById`.

Neither external-service procedure runs automatically as part of the two daily cleanup jobs. A successful database mutation does not establish that its scheduled external action succeeded.
