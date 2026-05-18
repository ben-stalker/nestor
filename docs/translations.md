# Translations

Nestor uses [i18next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/) for all user-visible strings.

## File location

Translation files live at:

```
client/public/locales/{lang}/translation.json
```

Currently supported locales:

| Code | Language | Status |
|---|---|---|
| `en` | English | Complete |
| `fr` | French | Partial |

## Namespaces

Each locale file is a single JSON object with 11 top-level namespace keys:

| Namespace | Contents |
|---|---|
| `common` | Shared labels: Save, Cancel, Delete, Loading, etc. |
| `nav` | Navigation labels for each screen |
| `home` | Home screen widget labels and greetings |
| `calendar` | Calendar view labels, event fields |
| `food` | Meal planner, recipe library |
| `family` | Profile names, health, children |
| `admin` | Admin panel labels and settings |
| `accessibility` | Accessibility-specific labels and descriptions |
| `locale` | Language and locale settings screen |
| `alerts` | Alert messages and severity labels |
| `errors` | Error messages |

## Using translations in components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <p>{t('home.greeting_morning')}</p>;
}
```

For HTML interpolation, use `<Trans>`:

```tsx
import { Trans } from 'react-i18next';

<Trans i18nKey="home.welcome" values={{ name }}>
  Welcome, <strong>{{ name }}</strong>!
</Trans>
```

The ESLint rule `i18next/no-literal-string` is enabled as a warning and will become an error in Epic 20. **Never write hardcoded user-visible strings directly in JSX.**

## Adding a string

1. Add the key to `client/public/locales/en/translation.json` under the appropriate namespace.
2. Add the same key (untranslated, or with a placeholder) to `client/public/locales/fr/translation.json`.
3. Use `t('namespace.key')` in your component.

## Adding a new language

1. Copy `client/public/locales/en/translation.json` to `client/public/locales/{lang}/translation.json`.
2. Translate all string values. Keep the keys unchanged.
3. Add the language code to the `supportedLngs` array in `client/src/i18n.ts`.

```ts
// client/src/i18n.ts
supportedLngs: ['en', 'fr', 'de'],  // add your code here
```

## Testing your translations

- **Setup Wizard**: choose your language on the Locale step.
- **Admin → Locale**: change the active language without re-running the wizard.
- **Dev override**: set `?lng=de` as a URL query parameter in the browser.

## Locale-aware formatting

Use helpers from `client/src/utils/format.ts` rather than calling `toLocaleString()` directly. See [CONTRIBUTING.md](../CONTRIBUTING.md#locale-aware-formatting) for the full list of helpers.

## RTL support

All custom CSS uses logical properties (`margin-inline-start`, `padding-inline-end`, etc.) rather than physical directional properties. Tailwind `rtl:` variant prefixes are used where needed. Full RTL layout is planned for a future phase.
