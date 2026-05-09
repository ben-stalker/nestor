# STORY-5.3: Recipe URL import via Schema.org JSON-LD

**Epic:** EPIC-5: Food / Meal Planner Module
**Sprint:** 6 — Vehicles, Food, Family Foundations
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** to paste a recipe URL and have ingredients/method extracted
**So that** I don't have to retype recipes

---

## Acceptance Criteria

- [ ] `POST /api/v1/recipes/import-url` with `{ url }` body
- [ ] Server fetches HTML with reasonable timeout (10s) and a friendly user-agent
- [ ] Parses JSON-LD Recipe schema via `cheerio`
- [ ] Returns prefilled recipe object: title, description, ingredients (parsed `{quantity, unit, ingredient}`), method (array), prep_mins, cook_mins, servings, photo URL
- [ ] If no JSON-LD: returns 200 with `{ partial: true, raw: { title, description } }` and user fills the rest
- [ ] User reviews and edits before saving (UI flow in STORY-5.5)
- [ ] First-use server-side warning: "Self-hosters responsible for source site ToS" (returned in response body)
- [ ] Allow-list NOT applied (recipe sites are user-supplied) — but rate limit 5/min/IP

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/recipes.ts` — extend with `import-url`
- `server/src/services/RecipeImportService.ts`
- `server/src/utils/parseIngredient.ts` — regex-based "1 1/2 cups flour" → `{quantity: 1.5, unit: 'cups', ingredient: 'flour'}`
- `server/tests/services/RecipeImportService.test.ts`

### Implementation steps

1. Service:
```ts
export async function importFromUrl(url: string) {
  const html = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { 'User-Agent': 'NestorRecipeBot/1.0' } }).then(r => r.text());
  const $ = cheerio.load(html);
  const ldBlocks = $('script[type="application/ld+json"]').toArray();
  for (const b of ldBlocks) {
    try {
      const data = JSON.parse($(b).text());
      const recipe = findRecipe(data); // walks @graph / arrays
      if (recipe) return mapToInternal(recipe);
    } catch {}
  }
  // Fallback
  return { partial: true, raw: { title: $('title').text(), description: $('meta[name="description"]').attr('content') } };
}
```
2. `findRecipe`: handles `@type: 'Recipe'`, nested `@graph`, arrays.
3. `mapToInternal`:
   - `recipeIngredient[]` → parsed `{quantity, unit, ingredient}` via `parseIngredient`.
   - `recipeInstructions` (string OR array OR HowToStep[]) → array of step strings.
   - `prepTime`/`cookTime` ISO 8601 duration → minutes.
   - `recipeYield` → servings.
   - `image` (string OR ImageObject) → URL.
4. `parseIngredient`:
```ts
const re = /^([\d./\s]+)\s*([a-zA-Z]+)?\s+(.+)$/;
// Handle vulgar fractions: ½ → 0.5
```
5. Rate limit middleware on the route.
6. Tests with sample HTML fixtures (BBC Good Food, NYT Cooking, generic Schema.org example).

### Key technical details

- PRD §11.
- Recipes vary wildly — parse defensively, default missing fields.
- The "Self-hosters responsible for source ToS" is returned once per session; client persists in localStorage.
- Allow-list bypass documented in STORY-20.6 (recipe import endpoint excluded).

---

## Dependencies

- **Blocked by:** STORY-5.2
- **Blocks:** STORY-5.5 (library detail uses this)

---

## Test Checklist

- [ ] Unit: BBC Good Food fixture parses fully
- [ ] Unit: site without JSON-LD returns partial
- [ ] Unit: 10s timeout enforced
- [ ] Unit: parse "1 1/2 cups flour" → {1.5, 'cups', 'flour'}
- [ ] Unit: parse "200 g sugar" → {200, 'g', 'sugar'}
- [ ] Unit: parse "salt to taste" → {ingredient: 'salt to taste'}
- [ ] Unit: rate limit fires after 5 imports / minute

---

## Notes

- Risk R-05: many sites have anti-scrape; partial fallback is the user-facing safety net.
- A future LLM-based parser could improve fallback parsing — out of scope for MVP.
