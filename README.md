# Радиоателье. Архив

A web application for documenting and archiving old signs and storefronts. Users can discover, catalog, and share information about historical signage through an interactive map interface.

## Tech Stack

- **Frontend**: SvelteKit 2 + Svelte 5, Tailwind CSS 4, Bits UI
- **Backend**: Convex (serverless functions + database)
- **Auth**: Clerk (JWT-based, with SSO support)
- **Maps**: Google Maps API, Deck.gl
- **Search**: Typesense (full-text + geospatial)
- **Package Manager**: Bun

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

   Required environment variables:
   - `CLERK_JWT_ISSUER_DOMAIN` — Clerk JWT issuer URL
   - `CLERK_WEBHOOK_SECRET` — Clerk webhook signing secret
   - `TYPESENSE_*` — Typesense host, port, protocol, and API key
   - `PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps API key

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

## Project Structure

```
src/
├── routes/
│   ├── (app)/          # Main app (authenticated)
│   │   └── (fullList)/ # List + detail views, object creation, import
│   └── login/          # Auth pages (login, SSO, password reset)
├── lib/
│   ├── components/     # UI components (map, search, forms, etc.)
│   ├── schema/         # Zod validation schemas
│   └── interfaces/     # TypeScript type definitions
└── convex/             # Serverless backend
    ├── schema.ts       # Database schema
    ├── objects.ts      # Object CRUD
    ├── markers.ts      # Map markers
    ├── search.ts       # Typesense search
    ├── users.ts        # User management
    ├── imports.ts      # CSV import logic
    └── ...
```

## Features

- **Interactive map** — Google Maps + Deck.gl layers, Street View integration, marker clustering
- **Object archive** — Create and manage archive entries with location, metadata, categories, tags, and images
- **Search** — Full-text search via Typesense, with Google Places integration for address lookup
- **Data import** — CSV import with field mapping, validation, and batch processing
- **User accounts** — Clerk authentication, role-based access, personal (private) tags and visited markers tracking
