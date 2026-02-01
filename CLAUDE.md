## Project Overview

Radioatelier is a full-stack application for managing and displaying geolocated objects. It consists of:

- **api/**: Go backend with MySQL database and Manticore search
- **web/**: SvelteKit frontend with TypeScript, Tailwind CSS, and Google Maps integration

## Development Environment

The project runs in Docker. Start all services from the project root:

```bash
docker compose up -d    # Start all services
```

Access the application at **https://radioatelier.test** (requires local DNS/hosts configuration).

Do not use the `docker-compose.yml` files in `/api` or `/web` subfolders directly - the root compose file includes them.

## Common Commands

### Web Frontend (run from `web/` directory)

```bash
npm run check        # TypeScript type checking
npm run lint         # Run ESLint and Prettier check
npm run format       # Auto-format code with Prettier
npx vitest           # Run tests (watch mode)
npx vitest run       # Run tests once
npm run build        # Production build (do not run this command for checks)
```

Do not run the build command directly — it is run automatically by the Docker container.

If there were any frontend changes as a result of your run – always run the format command at the end to keep the code style consistent.

### API Backend (run from `api/` directory)

```bash
go test ./...        # Run all Go tests
go build -o radioatelier ./package  # Build the binary
```

## Architecture

### Backend (Go)

The API follows a layered architecture:

- `package/main.go`: Entry point - runs migrations, starts router on port 3000
- `package/presentation/router/`: Route definitions using chi router
- `package/presentation/controller/`: HTTP handlers organized by domain (object, user, tag, category, image, etc.)
- `package/usecase/`: Business logic and middleware (including JWT access/refresh token verification)
- `package/adapter/`: External service adapters
    - `db/`: GORM models, repositories, migrations
    - `search/`: Manticore full-text search
    - `google/`: Google Places API integration
    - `auth/`: JWT token handling
- `package/infrastructure/`: Core infrastructure (database, logging, router, validation)

Key middleware: `VerifyAccessToken`, `VerifyRefreshToken`, `VerifyAccessTokenOptional`, `VerifyNonce`

### Frontend (SvelteKit)

- `src/routes/`: SvelteKit file-based routing
    - `(app)/`: Authenticated app routes with map and object management
    - `login/`: Authentication pages
- `src/lib/`:
    - `api/`: API client layer using request classes (`JsonRequest`, `AuthRequest` for auto token refresh)
    - `components/`: Svelte components including `ui/` (shadcn-svelte style), `map/`, `search/`, `objectDetails/`
    - `interfaces/`: TypeScript type definitions
    - `state/`: Svelte 5 runes-based state (`*.svelte.ts` files)
    - `services/`: Business logic services
    - `stores/`: Svelte stores
    - `cache/`: Query caching with TanStack Query

Key patterns:
- Forms use `sveltekit-superforms` with Zod validation
- UI components follow shadcn-svelte conventions (bits-ui primitives)
- API requests wrap `fetch` with automatic 401 → token refresh → retry logic
- State management uses Svelte 5 runes (`$state`, `$derived`)

### Data Flow

1. Frontend makes API calls through `AuthRequest` wrapper
2. Backend validates JWT access tokens via middleware
3. GORM handles MySQL persistence
4. Manticore provides full-text search for objects
5. Google Places API used for location search and address resolution

## Environment Configuration

API requires `.env` file (see `api/.env.example`):
- Database: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
- Search: `MANTICORE_HOST`, `MANTICORE_PORT`, `MANTICORE_TABLE`
- Auth: `JWT_SECRET`, `JWE_PRIVATE_KEY_PATH`
- External: `GOOGLE_API_KEY`, `NOTION_TOKEN` (for sync)

## Key Dependencies

**Backend**: chi (router), GORM (ORM), zerolog (logging), jwx (JWT/JWE), gorilla/websocket

**Frontend**: SvelteKit, TanStack Query, bits-ui, tailwind-variants, deck.gl + Google Maps, zod

## Code Style
Don't put comments in the code that just describe what the next code block does. Comments should explain why, not what. Only put comments in code when the reasoning behind the current implementation should be clarified to not create confusion.
