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
bun run check        # TypeScript type checking
bun run lint         # Run ESLint and Prettier check
bun run format       # Auto-format code with Prettier
bunx vitest           # Run tests (watch mode)
bunx vitest run       # Run tests once
bun run build        # Production build (do not run this command for checks)
```

Do not run the build command directly — it is run automatically by the Docker container.

If there were any frontend changes as a result of your run – always run the format command at the end to keep the code style consistent.

Use bun as the package manager for the project.

Key patterns:

- Forms use `sveltekit-superforms` with Zod validation
- UI components follow shadcn-svelte conventions (bits-ui primitives)
- State management uses Svelte 5 runes (`$state`, `$derived`)

## Code Style

Don't put comments in the code that just describe what the next code block does. Comments should explain why, not what. Only put comments in code when the reasoning behind the current implementation should be clarified to not create confusion.
