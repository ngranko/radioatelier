# Radioatelier. Archive

An archive of urban artifacts — old signs, plaques, mosaics, and other details found on city streets. Users can add items to an interactive map, attach photos and metadata, view, search and share points with others.

## Prerequisites

- Node.js >= 22.9.0
- Bun >= 1.3.8 as a package manager
- A running Convex project
- Clerk application
- Typesense instance
- Google Maps API key (frontend map rendering)
- Google API key in Convex env (`GOOGLE_API_KEY`) for Places search and reverse geocoding

## Getting Started

1. Install dependencies:

   ```bash
   bun install
   ```

2. Copy the environment file and fill in your credentials:

   ```bash
   cp .env.local.example .env.local
   ```

3. Start the development environment (runs Convex + Vite concurrently):

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

## Features

- **Interactive map** — Google Maps + Deck.gl layers, Street View integration
- **Object archive** — Create and manage archive entries with location, metadata, categories, tags, and images
- **Search** — Full-text search via Typesense and Google Places
- **Data import** — CSV import to migrate data from other sources
- **User accounts** — Clerk authentication, role-based access, personal (private) tags and visited markers tracking

## Documentation

Engineering guides for recently evolved subsystems:

| Guide | Topics |
| --- | --- |
| [docs/README.md](./docs/README.md) | Index and Typesense setup commands |
| [docs/map.md](./docs/map.md) | Marker pipeline, DOM vs deck rendering, Street View |
| [docs/object-details.md](./docs/object-details.md) | Overlay modes, point preview/create flow |
| [docs/categories-and-search.md](./docs/categories-and-search.md) | Category styling, Typesense sync, search |

## Environment variables

Copy `.env.local.example` to `.env.local` for local frontend and Typesense variables. Set Convex dashboard variables separately:

| Variable | Where | Purpose |
| --- | --- | --- |
| `GOOGLE_API_KEY` | Convex dashboard | Google Places search, place details, reverse geocoding |
| `TYPESENSE_*` | `.env.local` + Convex | Search index URL and keys |
| `PUBLIC_CLERK_*`, `CLERK_SECRET_KEY` | `.env.local` | Authentication |
| `PUBLIC_CONVEX_*`, `CONVEX_DEPLOYMENT` | `.env.local` | Convex client connection |
