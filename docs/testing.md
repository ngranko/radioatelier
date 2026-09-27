# Testing

Vitest runs colocated TypeScript tests through [vite.config.ts](../vite.config.ts). Most tests exercise helpers with mocked browser, map, or Convex dependencies. The repository does not configure a browser end-to-end suite or a Convex database test harness.

## Commands

```bash
bun run test
bun run test:watch
bun run check
```

Run a focused suite by passing a path:

```bash
bun run test src/convex/helpers/objectWriter.test.ts
```

`check` runs SvelteKit type generation and `svelte-check`. It does not run tests. Builds run automatically; do not invoke the build command directly.

## Find existing coverage

The configured test glob is `src/**/*.{test,spec}.{js,ts}`. Discover current files instead of maintaining a second inventory:

```bash
rg --files src -g '*.test.ts' -g '*.spec.ts' -g '*.test.js' -g '*.spec.js'
```

| Area           | Test locations and focus                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Map            | `src/lib/services/map/`: viewport selection, marker lifecycle and focus, renderer changes, gestures, GPU picking and animation |
| UI state       | `src/lib/state/` and component helpers: overlay transitions, search pins and area search, keyboard focus, sheet snapping       |
| Object backend | `src/convex/helpers/`: aggregate loading, viewer projection, patch routing, and indexing                                       |
| Notion         | `src/convex/notion.test.ts` and `src/convex/notionSync/`: matching, hashing, snapshots, inbound decisions, and outbound writes |
| Utilities      | Import normalization, sharing, distance, EXIF orientation, and image resizing                                                  |

Tests explicitly import `describe`, `it`, `expect`, and `vi` from `vitest`; the config does not enable global test APIs.

## Add or change tests

Place a test beside the behavior it covers and mock external APIs at the module boundary. Backend helper tests use mock contexts rather than a live deployment. Assert observable behavior, such as writes and scheduled actions, rather than duplicating implementation steps.

Run the relevant suite after a change, then the full test suite and type check as appropriate. `bun run lint` and `bun run format` both rewrite files, so review their diffs.

## Manual checks

Unit tests do not verify real Google Maps rendering, Clerk sessions, or external service credentials. For changes in those areas, check the affected flow in the running app:

- Open a shared object signed out, then sign in and return to it.
- Create, edit, reposition, and delete an object; check its marker and search result.
- Exercise both renderer strategies, including focus, drag, and touch gestures.
- Open and close Street View and move its minimap.
- Import a small CSV containing valid and invalid rows; inspect feedback.
- Follow the [Notion verification checklist](notion-sync.md#verify-sync) for sync changes.
