# Contributing to Nestor

Thank you for your interest in contributing!

## Development Setup

1. Install Node 20 LTS (use `.nvmrc` with `nvm use`)
2. Run `npm install` from the repo root
3. Use `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` to validate changes

## Code Style

- ESLint (Airbnb base + TypeScript) and Prettier are enforced via pre-commit hooks
- Single quotes, 2-space indent, trailing commas, LF line endings
- No `console.log` in committed code (use proper logging)

## Pull Requests

- Branch from `main`
- Write clear commit messages referencing the story ID (e.g. `feat: add X (STORY-1.2)`)
- Ensure all scripts pass before opening a PR

## License

By contributing you agree your changes are licensed under the MIT License.
