# Радиоателье. Архив

A web application for documenting and archiving old signs and storefronts. Users can discover, catalog, and share information about historical signage through an interactive map interface.

## Prerequisites

- Bun >= 1.3.8 (or Node.js >= 22.9.0)
- A running Convex project
- Clerk application
- Typesense instance
- Google Maps API key

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
|---|---|
| `bun run dev` | Start dev server (Convex + Vite) |
| `bun run check` | Type-check with `svelte-check` |
| `bun run lint` | Lint and auto-fix with ESLint |
| `bun run format` | Format with Prettier (Tailwind class sorting) |

## Features

- **Interactive map** — Google Maps + Deck.gl layers, Street View integration, marker clustering
- **Object archive** — Create and manage archive entries with location, metadata, categories, tags, and images
- **Search** — Full-text search via Typesense, with Google Places integration for address lookup
- **Data import** — CSV import with field mapping, validation, and batch processing
- **User accounts** — Clerk authentication, role-based access, personal (private) tags and visited markers tracking
