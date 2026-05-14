# STORY-5.1: Recipes and meal_plan schema + repos

## Status: complete

## Goal
Create `recipes`, `recipe_ingredients`, `meal_plan`, and `shopping_items` tables with repositories so food features can persist data.

## Tasks
- [x] Migration 007_food.sql with all four tables and indexes
- [x] `server/src/types/food.ts` — Zod schemas + TypeScript interfaces
- [x] `RecipeRepository` — CRUD + search by tag/ingredient
- [x] `MealPlanRepository` — CRUD for week query
- [x] `ShoppingItemRepository` — CRUD + tick/untick + clear ticked
- [x] Unit tests for all three repos (in-memory SQLite)

## Acceptance Criteria
- Migrations per architecture data model
- Indexes on `meal_plan.plan_date`, `recipe_ingredients.recipe_id`, `shopping_items.ticked`
- Repositories with full CRUD + search (recipes by tag/ingredient)
- Unit tests passing

## Schema (from architecture doc)
```
recipes: id, title, description, prep_mins, cook_mins, servings, tags_json, photo_path, source_url, created_at, calories
recipe_ingredients: id, recipe_id, quantity, unit, ingredient, notes, sort_order
meal_plan: id, plan_date (TEXT ISO date YYYY-MM-DD), slot_name, recipe_id (nullable FK), free_text (nullable), servings_override
shopping_items: id, name, quantity (REAL), unit, category, ticked (INTEGER 0/1), added_by_profile_id (FK nullable), pending_approval (INTEGER 0/1), created_at
```

## Dependencies
- STORY-1.5 (BaseRepository, migration runner)
