import categoriseIngredient from '../../src/data/ingredientCategories';

describe('categoriseIngredient', () => {
  it.each([
    // Pantry
    ['flour', 'Pantry'],
    ['sugar', 'Pantry'],
    ['salt', 'Pantry'],
    ['rice', 'Pantry'],
    ['pasta', 'Pantry'],
    ['spaghetti', 'Pantry'],
    ['oats', 'Pantry'],
    ['cereal', 'Pantry'],
    ['olive oil', 'Pantry'],
    ['baking powder', 'Pantry'],
    ['dark chocolate', 'Pantry'],
    ['lentils', 'Pantry'],
    ['chickpeas', 'Pantry'],
    // Meat
    ['chicken breast', 'Meat'],
    ['beef mince', 'Meat'],
    ['pork chops', 'Meat'],
    ['lamb shoulder', 'Meat'],
    ['bacon', 'Meat'],
    ['sausages', 'Meat'],
    ['turkey', 'Meat'],
    ['ham', 'Meat'],
    // Dairy
    ['milk', 'Dairy'],
    ['butter', 'Dairy'],
    ['cheddar cheese', 'Dairy'],
    ['cream', 'Dairy'],
    ['yogurt', 'Dairy'],
    ['eggs', 'Dairy'],
    // Bakery
    ['bread', 'Bakery'],
    ['bread rolls', 'Bakery'],
    ['bagels', 'Bakery'],
    ['croissant', 'Bakery'],
    ['muffins', 'Bakery'],
    // Produce
    ['tomatoes', 'Produce'],
    ['onion', 'Produce'],
    ['garlic', 'Produce'],
    ['carrots', 'Produce'],
    ['potatoes', 'Produce'],
    ['broccoli', 'Produce'],
    ['spinach', 'Produce'],
    ['lettuce', 'Produce'],
    ['cucumber', 'Produce'],
    ['apple', 'Produce'],
    ['banana', 'Produce'],
    ['orange', 'Produce'],
    ['lemon', 'Produce'],
    ['strawberries', 'Produce'],
    ['blueberries', 'Produce'],
    ['fresh basil', 'Produce'],
    // Drinks
    ['beer', 'Drinks'],
    ['red wine', 'Drinks'],
    ['cranberry juice', 'Drinks'],
    ['sparkling water', 'Drinks'],
    ['cola', 'Drinks'],
    ['coffee', 'Drinks'],
    ['green tea', 'Drinks'],
    // Seafood
    ['salmon fillet', 'Seafood'],
    ['tuna steaks', 'Seafood'],
    ['prawns', 'Seafood'],
    ['shrimp', 'Seafood'],
    ['cod', 'Seafood'],
    ['haddock', 'Seafood'],
    ['fish fingers', 'Seafood'],
    // Frozen
    ['frozen peas', 'Frozen'],
    ['ice cream', 'Frozen'],
    // Other
    ['mystery ingredient', 'Other'],
    ['xylophone paste', 'Other'],
  ])('categorises "%s" as %s', (name, expected) => {
    expect(categoriseIngredient(name)).toBe(expected);
  });

  it('is case-insensitive', () => {
    expect(categoriseIngredient('MILK')).toBe('Dairy');
    expect(categoriseIngredient('Chicken Breast')).toBe('Meat');
    expect(categoriseIngredient('OLIVE OIL')).toBe('Pantry');
  });

  it('trims leading and trailing whitespace', () => {
    expect(categoriseIngredient('  milk  ')).toBe('Dairy');
  });

  it('falls back to Other for empty string', () => {
    expect(categoriseIngredient('')).toBe('Other');
  });
});
