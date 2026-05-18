# Contributing to Nestor

Thank you for your interest in contributing!

## Development Setup

1. Install Node 20 LTS (use `.nvmrc` with `nvm use`)
2. Run `npm install` from the repo root
3. Use `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` to validate changes

## Story files

Each story in an epic has a corresponding file at `docs/stories/STORY-<epic>-<n>.md` (e.g. `docs/stories/STORY-20-1.md`). The file describes the tasks for that story and is updated with progress as work proceeds. Create a story file before starting implementation and mark tasks done as you go.

## Code Style

- ESLint (Airbnb base + TypeScript) and Prettier are enforced via pre-commit hooks
- Single quotes, 2-space indent, trailing commas, LF line endings
- No `console.log` in committed code (use proper logging)

## Tests

Three test suites must pass before opening a PR:

| Suite                   | Runner     | Command                           |
| ----------------------- | ---------- | --------------------------------- |
| Server unit/integration | Jest       | `npm run test --workspace=server` |
| Client unit/component   | Vitest     | `npm run test --workspace=client` |
| End-to-end              | Playwright | `npm run test:e2e`                |

Run `npm run test` from the repo root to execute all suites.

## Pull Requests

- Branch from `main`
- Write clear commit messages referencing the story ID (e.g. `feat: add X (STORY-1.2)`)
- Ensure all scripts pass before opening a PR

## Internationalisation (i18n)

Nestor uses [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) for all user-visible strings.

### Rules

- **Never write hardcoded user-visible strings in JSX.** Use the `t()` hook instead.
- The ESLint rule `i18next/no-literal-string` is enabled (currently as `warn`; will become `error` in Epic 20 after the full migration).
- All new components **must** use `useTranslation()` and `t('namespace.key')`.

### Adding a string

1. Add the key to `client/public/locales/en/translation.json` under the appropriate namespace (e.g. `"home"`, `"calendar"`, `"admin"`).
2. Use it in your component:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <p>{t('home.greeting_morning')}</p>;
}
```

3. If you need HTML interpolation, use the `<Trans>` component:

```tsx
import { Trans } from 'react-i18next';
<Trans i18nKey="home.welcome" values={{ name }}>
  Welcome, <strong>{{ name }}</strong>!
</Trans>;
```

### Adding a new language

1. Copy `client/public/locales/en/translation.json` to `client/public/locales/<lang>/translation.json`.
2. Translate all values (keys stay the same).
3. Add the language to the `i18n.ts` `supportedLngs` list if desired.
4. Test by setting `app_settings.language` to your language code.

Currently supported: `en` (English), `fr` (French — partial).

## Locale-aware formatting

Use helpers from `client/src/utils/format.ts` for dates, numbers, currencies, temperatures, distances, and volumes. **Never call `toLocaleString()` or `toLocaleDateString()` directly** in component code.

```ts
import { formatDate, formatCurrency } from '../utils/format';

formatDate(new Date()); // → "18 May 2026"  (en-GB)
formatCurrency(9.99); // → "£9.99"        (GBP, en-GB)
```

The helpers automatically use the locale and currency from `app_settings` — no arguments needed in most cases.

## RTL & CSS Logical Properties

All custom CSS in `client/src/index.css` and module CSS files uses **logical properties** for directional styling, not physical ones. This ensures the app is RTL-ready for Phase 2.

| ❌ Physical (do not use)         | ✅ Logical (use instead)                      |
| -------------------------------- | --------------------------------------------- |
| `margin-left` / `margin-right`   | `margin-inline-start` / `margin-inline-end`   |
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` |
| `border-left` / `border-right`   | `border-inline-start` / `border-inline-end`   |
| `text-align: left` / `right`     | `text-align: start` / `end`                   |

**Tailwind classes** (`ml-`, `mr-`, `pl-`, `pr-`) are acceptable in JSX since Tailwind v4 handles RTL via the `rtl:` variant. Use `rtl:` prefixes where needed when implementing actual RTL support.

Note: A [stylelint](https://stylelint.io/) rule to enforce this automatically will be added in Epic 20.

## License

By contributing you agree your changes are licensed under the MIT License.
