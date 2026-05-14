# STORY-5.3: Recipe URL import via Schema.org JSON-LD

## Status: complete

## Goal
Allow users to paste a recipe URL and have ingredients/method extracted automatically via Schema.org JSON-LD scraping.

## Tasks
- [x] Install `cheerio`, `@types/cheerio` (if not bundled)
- [x] `server/src/services/recipeScraper.ts` — `scrapeRecipe(url: string)` using cheerio to parse JSON-LD `@type: Recipe`
- [x] Parse: title, description, recipeIngredient[], recipeInstructions, prepTime, cookTime, recipeYield, image, calories
- [x] Parse ISO 8601 duration strings (PT1H30M → 90 mins)
- [x] Parse ingredient strings into `{quantity, unit, ingredient}` with a simple regex tokeniser
- [x] Return `{ partial: false, recipe: {...} }` on success, `{ partial: true, raw: {title, description} }` on no JSON-LD
- [x] `POST /api/v1/recipes/import-url` route (added to recipes router) — requireProfile + add_recipe
- [x] Store `url_import_warned` in app_settings; log warning once if not set
- [x] Tests: mocked fetch with JSON-LD fixture, no-JSON-LD fallback, timeout

## Acceptance Criteria
- `POST /api/v1/recipes/import-url` with `{ url }`
- Returns pre-filled recipe: title, description, ingredients, method, prep_mins, cook_mins, servings, photo URL
- If no JSON-LD: returns 200 with `{ partial: true, raw: {title, description} }`
- Server-side warning logged once on first use

## Dependencies
- STORY-5.2
