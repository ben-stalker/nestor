# STORY-5.2: Recipe API endpoints + photo upload

## Status: complete

## Goal
REST endpoints for recipe CRUD with optional photo upload so the React UI can manage the recipe library.

## Tasks
- [x] Install `multer`, `sharp`, `@types/multer`
- [x] `server/src/routes/recipes.ts` — factory `createRecipesRouter(recipeRepo, settingsRepo)`
- [x] `GET /api/v1/recipes` — list with `?search=&tags=` (requireProfile + view_food)
- [x] `POST /api/v1/recipes` — create (requireProfile + add_recipe)
- [x] `PATCH /api/v1/recipes/:id` — update (requireProfile + add_recipe, admin for others' recipes)
- [x] `DELETE /api/v1/recipes/:id` — delete (requireProfile + requireAdminPin)
- [x] `GET /api/v1/recipes/:id` — single recipe with ingredients
- [x] `POST /api/v1/recipes/:id/photo` — multer upload, max 10MB, sharp resize to 1200px wide, stored as `~/.nestor/uploads/recipes/<uuid>.webp`
- [x] Mount router in `server/src/app.ts`
- [x] Tests: list, create, PATCH, DELETE, photo upload, oversize photo rejected

## Acceptance Criteria
- `GET/POST/PATCH/DELETE /api/v1/recipes` with `?search=&tags=`
- `POST /api/v1/recipes/:id/photo` multer upload, max 10MB, resized to 1200px wide via sharp
- Photos stored in `~/.nestor/uploads/recipes/<uuid>.webp`
- Filename sanitised; UUID storage names
- Tests: happy path + oversize upload rejected

## Dependencies
- STORY-5.1
