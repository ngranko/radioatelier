# Radioatelier. Archive

An archive of urban artifacts — old signs, plaques, mosaics, and other details found on city streets. Users can add items to an interactive map, attach photos and metadata, view, search and share points with others.

## Prerequisites

-   Node.js >= 22.9.0
-   Bun >= 1.3.8 as a package manager
-   A running Convex project
-   Clerk application
-   Typesense instance
-   Google Maps API key and Map ID (browser, via `.env.local`)
-   Google API key for server geocoding/Places (Convex env)

## Getting Started

1. Install dependencies:

    ```bash
    bun install
    ```

2. Configure environment variables:

    -   **Local app:** copy `.env.local.example` to `.env.local` (SvelteKit + Convex CLI + scripts).
    -   **Convex backend:** set secrets on the dev deployment — see [docs/environment.md](docs/environment.md).

    ```bash
    cp .env.local.example .env.local
    ```

3. Start the development environment (runs Convex + Vite concurrently):

    ```bash
    bun run dev
    ```

## Key Scripts

| Command              | Description                                   |
| -------------------- | --------------------------------------------- |
| `bun run dev`        | Start dev server (Convex + Vite)              |
| `bun run check`      | Type-check with `svelte-check`                |
| `bun run lint`       | Lint and auto-fix with ESLint                 |
| `bun run format`     | Format with Prettier (Tailwind class sorting) |
| `bun run test`       | Run Vitest test suite                         |
| `bun run test:watch` | Run Vitest in watch mode                      |

## Features

-   **Interactive map** — Provider abstraction over Google Maps; Deck.gl at low zoom, DOM markers at high zoom; Street View with minimap ([docs/map-architecture.md](docs/map-architecture.md), [docs/street-view.md](docs/street-view.md))
-   **Object archive** — Create and manage archive entries with location, metadata, categories, tags, and images; point preview/create overlay ([docs/object-details-overlay.md](docs/object-details-overlay.md))
-   **Category settings** — Per-user marker color, icon, and form-picker visibility ([docs/category-settings.md](docs/category-settings.md))
-   **Search** — Full-text search via Typesense and Google Places
-   **Notion sync** — Bidirectional sync between app objects and a Notion database ([docs/notion-sync.md](docs/notion-sync.md))
-   **Data import** — CSV import to migrate data from other sources
-   **User accounts** — Clerk authentication, role-based access, personal (private) tags and visited markers tracking

## Documentation

| Doc | Topics |
| --- | ------ |
| [docs/environment.md](docs/environment.md) | `.env.local` vs Convex env vars, setup checklist |
| [docs/notion-sync.md](docs/notion-sync.md) | Notion webhook setup, sync invariants, audit action |
| [docs/map-architecture.md](docs/map-architecture.md) | Map provider, marker pipeline, DOM vs Deck.gl |
| [docs/category-settings.md](docs/category-settings.md) | Per-user category marker styles |
| [docs/object-details-overlay.md](docs/object-details-overlay.md) | View/edit/create overlay modes and routes |
| [docs/street-view.md](docs/street-view.md) | Panorama, minimap sync, lookup caching |
| [docs/testing.md](docs/testing.md) | Vitest commands, test layout, adding tests |
