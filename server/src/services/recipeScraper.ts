import * as cheerio from 'cheerio';

// ─── Result Types ────────────────────────────────────────────────────────────

export interface ScrapedIngredient {
  quantity: number | null;
  unit: string | null;
  ingredient: string;
}

export interface ScrapedRecipe {
  partial: false;
  recipe: {
    title: string;
    description?: string;
    prepMins: number;
    cookMins: number;
    servings: number;
    calories?: number;
    ingredients: ScrapedIngredient[];
    method: string[];
    photoUrl?: string;
    sourceUrl: string;
    tags: string[];
  };
}

export interface PartialScrapedRecipe {
  partial: true;
  raw: { title: string; description: string };
}

export type ScrapeResult = ScrapedRecipe | PartialScrapedRecipe;

// ─── ISO 8601 Duration Parser ─────────────────────────────────────────────────

export function parseDuration(iso: string): number {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return parseInt(match[1] ?? '0', 10) * 60 + parseInt(match[2] ?? '0', 10);
}

// ─── Ingredient Parser ────────────────────────────────────────────────────────

const UNITS = new Set([
  'tsp',
  'teaspoon',
  'teaspoons',
  'tbsp',
  'tablespoon',
  'tablespoons',
  'cup',
  'cups',
  'oz',
  'ounce',
  'ounces',
  'lb',
  'lbs',
  'pound',
  'pounds',
  'g',
  'gram',
  'grams',
  'kg',
  'kilogram',
  'kilograms',
  'ml',
  'milliliter',
  'milliliters',
  'millilitre',
  'millilitres',
  'l',
  'liter',
  'liters',
  'litre',
  'litres',
  'pint',
  'pints',
  'qt',
  'quart',
  'quarts',
  'gallon',
  'gallons',
  'pinch',
  'dash',
  'handful',
  'bunch',
  'clove',
  'cloves',
  'slice',
  'slices',
  'piece',
  'pieces',
  'can',
  'cans',
  'package',
  'packages',
]);

// Unicode fractions map
const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

function parseQuantity(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Unicode fraction only (e.g. "½")
  if (Object.prototype.hasOwnProperty.call(UNICODE_FRACTIONS, trimmed)) {
    return UNICODE_FRACTIONS[trimmed];
  }

  // Integer + unicode fraction (e.g. "1½")
  const unicodeMatch = trimmed.match(/^(\d+)\s*([½⅓⅔¼¾⅛⅜⅝⅞])$/);
  if (unicodeMatch) {
    return parseInt(unicodeMatch[1], 10) + (UNICODE_FRACTIONS[unicodeMatch[2]] ?? 0);
  }

  // Mixed number with fraction (e.g. "1 1/2") — check before decimal and simple fraction
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1], 10) + parseInt(mixedMatch[2], 10) / parseInt(mixedMatch[3], 10);
  }

  // Simple fraction (e.g. "1/2" or "3/4") — check before decimal to avoid parseFloat('1/2')=1
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    return parseInt(fractionMatch[1], 10) / parseInt(fractionMatch[2], 10);
  }

  // Decimal or integer (e.g. "1.5" or "2")
  const decimal = parseFloat(trimmed);
  if (!Number.isNaN(decimal)) return decimal;

  return null;
}

export function parseIngredient(text: string): ScrapedIngredient {
  const trimmed = text.trim();

  // Pattern: optional quantity (number, fraction, unicode fraction), optional unit, rest
  const pattern =
    /^([\d.,/]+(?:\s*[\d.,/]+)?|[\d]*\s*[½⅓⅔¼¾⅛⅜⅝⅞])?\s*([a-zA-Z]+(?:\s+[a-zA-Z]+)?)?\s+(.+)/;
  const m = trimmed.match(pattern);

  if (!m) {
    return { quantity: null, unit: null, ingredient: trimmed };
  }

  const rawQty = (m[1] ?? '').trim();
  const rawUnit = (m[2] ?? '').trim().toLowerCase();
  const rest = (m[3] ?? '').trim();

  const quantity = rawQty ? parseQuantity(rawQty) : null;
  const unit = rawUnit && UNITS.has(rawUnit) ? rawUnit : null;

  // If no recognized unit, rejoin the unit candidate back into ingredient
  const ingredient = unit ? rest : [rawUnit, rest].filter(Boolean).join(' ');

  return { quantity, unit, ingredient: ingredient || trimmed };
}

// ─── JSON-LD Extraction ───────────────────────────────────────────────────────

interface JsonLdRecipe {
  '@type': string | string[];
  name?: string;
  description?: string;
  prepTime?: string;
  cookTime?: string;
  recipeYield?: string | number | string[];
  nutrition?: { calories?: string };
  recipeIngredient?: string[];
  recipeInstructions?: unknown[];
  image?: string | string[] | { url?: string } | { url?: string }[];
  keywords?: string | string[];
}

function isRecipeType(val: unknown): val is JsonLdRecipe {
  if (!val || typeof val !== 'object') return false;
  const obj = val as Record<string, unknown>;
  const type = obj['@type'];
  if (typeof type === 'string') return type === 'Recipe';
  if (Array.isArray(type)) return (type as string[]).includes('Recipe');
  return false;
}

function findRecipeInGraph(data: unknown): JsonLdRecipe | null {
  if (!data || typeof data !== 'object') return null;

  if (isRecipeType(data)) return data;

  // Check @graph array
  const obj = data as Record<string, unknown>;
  const graph = obj['@graph'];
  if (Array.isArray(graph)) {
    const found = (graph as unknown[]).find(isRecipeType);
    if (found) return found;
  }

  return null;
}

function parseServings(raw: string | number | string[] | undefined): number {
  if (raw === undefined || raw === null) return 4;
  const str = Array.isArray(raw) ? raw[0] : String(raw);
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : 4;
}

function parseCalories(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const match = raw.match(/\d+/);
  return match ? parseInt(match[0], 10) : undefined;
}

function parseImage(
  img: string | string[] | { url?: string } | { url?: string }[] | undefined,
): string | undefined {
  if (!img) return undefined;
  if (typeof img === 'string') return img;
  if (Array.isArray(img)) {
    const first = img[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first) return first.url;
    return undefined;
  }
  if (typeof img === 'object' && 'url' in img) return img.url;
  return undefined;
}

function parseInstructions(instructions: unknown[] | undefined): string[] {
  if (!instructions) return [];
  return instructions
    .map((step) => {
      if (typeof step === 'string') return step.trim();
      if (step && typeof step === 'object') {
        const s = step as Record<string, unknown>;
        if (typeof s.text === 'string') return s.text.trim();
      }
      return '';
    })
    .filter(Boolean);
}

function findRecipeData($: cheerio.CheerioAPI): JsonLdRecipe | null {
  const scriptTags = $('script[type="application/ld+json"]').toArray();
  let recipeData: JsonLdRecipe | null = null;

  scriptTags.some((el) => {
    try {
      const raw = $(el).html();
      if (!raw) return false;
      const parsed = JSON.parse(raw) as unknown;
      const found = findRecipeInGraph(parsed);
      if (found) {
        recipeData = found;
        return true; // stop iterating
      }
    } catch {
      // Malformed JSON — skip
    }
    return false;
  });

  return recipeData;
}

// ─── Main Scraper ─────────────────────────────────────────────────────────────

export async function scrapeRecipe(url: string): Promise<ScrapeResult> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Nestor/1.0 (household assistant)' },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const recipeData = findRecipeData($);

  if (!recipeData) {
    // Fallback to partial
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') ?? '';
    return { partial: true, raw: { title, description } };
  }

  const title = recipeData.name?.trim() ?? '';
  const description = recipeData.description?.trim();
  const prepMins = parseDuration(recipeData.prepTime ?? '');
  const cookMins = parseDuration(recipeData.cookTime ?? '');
  const servings = parseServings(recipeData.recipeYield);
  const calories = parseCalories(recipeData.nutrition?.calories);
  const ingredients = (recipeData.recipeIngredient ?? []).map(parseIngredient);
  const method = parseInstructions(recipeData.recipeInstructions);
  const photoUrl = parseImage(recipeData.image);

  // Keywords as tags
  let tags: string[] = [];
  if (recipeData.keywords) {
    if (Array.isArray(recipeData.keywords)) {
      tags = recipeData.keywords;
    } else if (typeof recipeData.keywords === 'string') {
      tags = recipeData.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
    }
  }

  return {
    partial: false,
    recipe: {
      title,
      description,
      prepMins,
      cookMins,
      servings,
      calories,
      ingredients,
      method,
      photoUrl,
      sourceUrl: url,
      tags,
    },
  };
}
