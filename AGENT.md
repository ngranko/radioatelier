## Project Overview

## Development Environment

Access the application at **https://radioatelier.test** (requires local DNS/hosts configuration).

## Common Commands

```bash
bun run check        # TypeScript type checking
bun run lint         # Run ESLint and Prettier check
bun run format       # Auto-format code with Prettier
bunx vitest           # Run tests (watch mode)
bunx vitest run       # Run tests once
bun run build        # Production build (do not run this command for checks)
```

Do not run the build command directly — it is run automatically by the Docker container.

If there were any frontend changes as a result of your run – always run the lint command to make sure there aren't any code style problems.

Use bun as the package manager for the project.

Key patterns:

- Forms use `sveltekit-superforms` with Zod validation
- UI components follow shadcn-svelte conventions (bits-ui primitives)
- State management uses Svelte 5 runes (`$state`, `$derived`)

## Code Style

Don't put comments in the code that just describe what the next code block does. Comments should explain why, not what. Only put comments in code when the reasoning behind the current implementation should be clarified to not create confusion.

Follow SOLID, DRY and KISS principles in your work. Don't create huge god-files. Soft cap for line count if a single file is 200, if a file grows bigger – consider possible refactors. The same rule should apply for huge functions: if a function grows too large – consider splitting it or moving into its own module if that function is complex enough. Soft line cap for a single function is 20 lines.

Keep commits atomic: commit only the files you touched and list each path explicitly. For tracked files run `git commit -m "<scoped message>" -- path/to/file1 path/to/file2`. For brand-new files, use the one-liner `git restore --staged :/ && git add "path/to/file1" "path/to/file2" && git commit -m "<scoped message>" -- path/to/file1 path/to/file2`
