# Engineering documentation

Technical reference for Radioatelier Archive subsystems. These docs are verified against source code and updated as the codebase evolves.

## Guides

| Guide | Covers |
| --- | --- |
| [Map](./map.md) | Provider abstraction, marker pipeline, DOM vs deck rendering, Street View, gestures |
| [Object details overlay](./object-details.md) | Bottom-sheet modes, point preview/create flow, URL + client state |
| [Categories & search](./categories-and-search.md) | Category styling, Typesense sync, Google Places, search workflows |

## Related files

- [README.md](../README.md) — setup and scripts
- [AGENTS.md](../AGENTS.md) — agent/development constraints
- `.env.local.example` — local environment variables

## Typesense operations

Collection setup and backfill scripts live under `scripts/typesense/`:

```bash
bun scripts/typesense/setup.ts --url $TYPESENSE_URL --admin-key $TYPESENSE_ADMIN_KEY
bun scripts/typesense/backfill.ts --convex-url $PUBLIC_CONVEX_URL --backfill-key $TYPESENSE_BACKFILL_KEY --typesense-url $TYPESENSE_URL --typesense-admin-key $TYPESENSE_ADMIN_KEY
```

See each script header for full CLI options and environment variable fallbacks.
