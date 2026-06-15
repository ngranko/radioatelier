# Testing

The project uses [Vitest](https://vitest.dev/) 4.x, configured through the shared Vite config.

## Commands

| Command | Description |
| ------- | ----------- |
| `bun run test` | Run all tests once (`vitest run`) |
| `bun run test:watch` | Watch mode (`vitest`) |

## Configuration

`vite.config.ts` sets the test glob:

```15:17:vite.config.ts
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}'],
    },
```

Tests live next to the code they cover. Both `*.test.ts` and `*.spec.ts` suffixes match.

## Current test suites

| File | Coverage |
| ---- | -------- |
| `src/index.test.ts` | Frontend utilities (EXIF, image resizer) |
| `src/lib/state/objectDetailsOverlay.svelte.test.ts` | Overlay state transitions |
| `src/lib/services/map/visibilityEngine.test.ts` | Marker viewport visibility rules |
| `src/convex/notion.test.ts` | Notion sync reconcile and webhook decisions |
| `src/convex/notionSync/snapshot.test.ts` | Snapshot builders for sync field hashing |
| `src/convex/notionSync/outbound.test.ts` | Outbound Notion page create/update/archive |
| `src/convex/helpers/objectWriter.test.ts` | Object record patch splitting |
| `src/convex/helpers/clerkTimestamps.test.ts` | Clerk webhook timestamp parsing |

Convex logic is tested as plain TypeScript modules — there is no Convex test harness or emulated database in the repo. Tests import helpers directly and use Vitest mocks (`vi.mock`, `vi.fn`).

## Adding tests

1. Place a `*.test.ts` file under `src/` matching the glob above.
2. Import the module under test; avoid pulling in Svelte components unless needed.
3. For Convex code, mock `ctx` / external APIs at the function boundary rather than running against a deployment.
4. Run `bun run test` before opening a PR.

Vitest 4 uses the same `vi` API as Vitest 3. Global test APIs are available without extra setup because the config extends `vitest/config`.

## Related docs

- [notion-sync.md](./notion-sync.md) — manual verification checklist for sync features
