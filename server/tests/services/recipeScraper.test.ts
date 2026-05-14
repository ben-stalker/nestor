import { scrapeRecipe, parseDuration, parseIngredient } from '../../src/services/recipeScraper';

// ─── HTML Fixtures ────────────────────────────────────────────────────────────

const FULL_RECIPE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Pasta Carbonara - Great Recipes</title>
  <meta name="description" content="Classic Italian pasta dish" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": "Pasta Carbonara",
    "description": "Creamy Italian pasta with eggs and bacon",
    "prepTime": "PT15M",
    "cookTime": "PT20M",
    "recipeYield": "4 servings",
    "nutrition": { "calories": "520 calories" },
    "recipeIngredient": [
      "400g spaghetti",
      "4 eggs",
      "200g pancetta",
      "50g parmesan"
    ],
    "recipeInstructions": [
      { "@type": "HowToStep", "text": "Boil pasta until al dente." },
      { "@type": "HowToStep", "text": "Fry pancetta until crispy." },
      { "@type": "HowToStep", "text": "Mix eggs with cheese and combine with pasta." }
    ],
    "image": "https://example.com/carbonara.jpg",
    "keywords": "italian, pasta, quick"
  }
  </script>
</head>
<body><h1>Pasta Carbonara</h1></body>
</html>
`;

const GRAPH_RECIPE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "name": "My Recipe Site"
      },
      {
        "@type": "Recipe",
        "name": "Chicken Tikka",
        "prepTime": "PT30M",
        "cookTime": "PT1H",
        "recipeYield": "6",
        "recipeIngredient": ["500g chicken", "2 tbsp yogurt"],
        "recipeInstructions": ["Marinate chicken.", "Grill until done."],
        "image": [
          "https://example.com/tikka1.jpg",
          "https://example.com/tikka2.jpg"
        ]
      }
    ]
  }
  </script>
</head>
<body></body>
</html>
`;

const NO_JSON_LD_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Just a Regular Page</title>
  <meta name="description" content="This page has no recipe data" />
</head>
<body><p>No recipe here!</p></body>
</html>
`;

const MALFORMED_JSON_LD_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Bad JSON Page</title>
  <meta name="description" content="Has bad JSON" />
  <script type="application/ld+json">{ invalid json }</script>
</head>
<body></body>
</html>
`;

// ─── Mock fetch helper ────────────────────────────────────────────────────────

let fetchMock: jest.Mock;

function mockFetchWith(html: string, status = 200): void {
  fetchMock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(html),
  });
  global.fetch = fetchMock;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('parseDuration', () => {
  it('parses PT1H30M → 90', () => expect(parseDuration('PT1H30M')).toBe(90));
  it('parses PT45M → 45', () => expect(parseDuration('PT45M')).toBe(45));
  it('parses PT1H → 60', () => expect(parseDuration('PT1H')).toBe(60));
  it('parses PT2H15M → 135', () => expect(parseDuration('PT2H15M')).toBe(135));
  it('returns 0 for empty string', () => expect(parseDuration('')).toBe(0));
  it('returns 0 for non-duration string', () => expect(parseDuration('invalid')).toBe(0));
  it('returns 0 for undefined-like input', () =>
    expect(parseDuration(undefined as unknown as string)).toBe(0));
});

describe('parseIngredient', () => {
  it('parses quantity + unit + ingredient', () => {
    const result = parseIngredient('400g spaghetti');
    expect(result.quantity).toBe(400);
    expect(result.unit).toBe('g');
    expect(result.ingredient).toBe('spaghetti');
  });

  it('parses fraction quantity', () => {
    const result = parseIngredient('1/2 cup flour');
    expect(result.quantity).toBeCloseTo(0.5);
    expect(result.unit).toBe('cup');
    expect(result.ingredient).toBe('flour');
  });

  it('parses ingredient with no quantity', () => {
    const result = parseIngredient('salt to taste');
    expect(result.quantity).toBeNull();
    expect(result.ingredient).toContain('salt');
  });

  it('parses decimal quantity', () => {
    const result = parseIngredient('1.5 tsp salt');
    expect(result.quantity).toBeCloseTo(1.5);
    expect(result.unit).toBe('tsp');
  });

  it('returns full text as ingredient when no pattern match', () => {
    const result = parseIngredient('a pinch of love');
    expect(result.ingredient).toBeTruthy();
  });
});

describe('scrapeRecipe', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('extracts full recipe from JSON-LD', async () => {
    mockFetchWith(FULL_RECIPE_HTML);
    const result = await scrapeRecipe('https://example.com/recipe');

    expect(result.partial).toBe(false);
    if (result.partial) return; // type guard

    expect(result.recipe.title).toBe('Pasta Carbonara');
    expect(result.recipe.description).toBe('Creamy Italian pasta with eggs and bacon');
    expect(result.recipe.prepMins).toBe(15);
    expect(result.recipe.cookMins).toBe(20);
    expect(result.recipe.servings).toBe(4);
    expect(result.recipe.calories).toBe(520);
    expect(result.recipe.ingredients).toHaveLength(4);
    expect(result.recipe.method).toHaveLength(3);
    expect(result.recipe.photoUrl).toBe('https://example.com/carbonara.jpg');
    expect(result.recipe.sourceUrl).toBe('https://example.com/recipe');
    expect(result.recipe.tags).toEqual(['italian', 'pasta', 'quick']);
  });

  it('finds recipe inside @graph', async () => {
    mockFetchWith(GRAPH_RECIPE_HTML);
    const result = await scrapeRecipe('https://example.com/tikka');

    expect(result.partial).toBe(false);
    if (result.partial) return;

    expect(result.recipe.title).toBe('Chicken Tikka');
    expect(result.recipe.prepMins).toBe(30);
    expect(result.recipe.cookMins).toBe(60);
    expect(result.recipe.servings).toBe(6);
    expect(result.recipe.ingredients).toHaveLength(2);
    // Should pick first image from array
    expect(result.recipe.photoUrl).toBe('https://example.com/tikka1.jpg');
  });

  it('returns partial result when no JSON-LD found', async () => {
    mockFetchWith(NO_JSON_LD_HTML);
    const result = await scrapeRecipe('https://example.com/page');

    expect(result.partial).toBe(true);
    if (!result.partial) return;

    expect(result.raw.title).toBe('Just a Regular Page');
    expect(result.raw.description).toBe('This page has no recipe data');
  });

  it('returns partial result when JSON-LD is malformed', async () => {
    mockFetchWith(MALFORMED_JSON_LD_HTML);
    const result = await scrapeRecipe('https://example.com/bad');

    expect(result.partial).toBe(true);
    if (!result.partial) return;

    expect(result.raw.title).toBe('Bad JSON Page');
  });

  it('throws error when HTTP request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: jest.fn().mockResolvedValue(''),
    }) as unknown as typeof fetch;

    await expect(scrapeRecipe('https://example.com/missing')).rejects.toThrow('HTTP 404');
  });

  it('throws error on network timeout (fetch rejects)', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(
        new Error('AbortError: The operation was aborted'),
      ) as unknown as typeof fetch;

    await expect(scrapeRecipe('https://example.com/slow')).rejects.toThrow();
  });
});
