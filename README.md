# Radioatelier. Archive

An archive of urban artifacts — old signs, plaques, mosaics, and other details found on city streets. Users can add items to an interactive map, attach photos and metadata, view, search and share points with others.

## Prerequisites

- Node.js >= 22.9.0
- Bun >= 1.3.8 as a package manager
- A running Convex project
- Clerk application (with `convex` JWT template and user webhook)
- Typesense instance
- Google Maps API key (client-side in `src/lib/config/index.ts`; server-side `GOOGLE_API_KEY` in Convex)

## Getting Started

1. Install dependencies:

   ```bash
   bun install
   ```

2. Copy the environment file and fill in your credentials:

   ```bash
   cp .env.local.example .env.local
   ```

3. Configure Convex env vars and third-party services — see [docs/environment.md](./docs/environment.md).

4. Set up Typesense (one-time):

   ```bash
   bun scripts/typesense/setup.ts --url "$TYPESENSE_URL" --admin-key "$TYPESENSE_ADMIN_KEY"
   bun scripts/typesense/backfill.ts --convex-url "$PUBLIC_CONVEX_URL" --backfill-key "$TYPESENSE_BACKFILL_KEY" --typesense-url "$TYPESENSE_URL" --typesense-admin-key "$TYPESENSE_ADMIN_KEY"
   ```

5. Start the development environment (runs Convex + Vite concurrently):

   ```bash
   bun run dev
   ```

## Key Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start dev server (Convex + Vite) |
| `bun run check` | Type-check with `svelte-check` |
| `bun run lint` | Lint and auto-fix with ESLint |
| `bun run format` | Format with Prettier (Tailwind class sorting) |

## Documentation

| Doc | Contents |
| --- | --- |
| [Architecture](./docs/architecture.md) | Data model, auth flow, main workflows, crons |
| [Environment & setup](./docs/environment.md) | Env var reference, Clerk/Typesense configuration, troubleshooting |
| [Map & markers](./docs/map-markers.md) | Hybrid renderer, marker sources, category styling, Street View, overlays |

## Features

- **Interactive map** — Google Maps + Deck.gl layers, Street View integration, per-user category marker styling
- **Object archive** — Create and manage archive entries with location, metadata, categories, tags, and images
- **Search** — Full-text search via Typesense and Google Places
- **Data import** — CSV import to migrate data from other sources
- **User accounts** — Clerk authentication, role-based access, personal (private) tags and visited markers tracking
