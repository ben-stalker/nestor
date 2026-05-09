# STORY-5.2: Recipe API endpoints + photo upload

**Epic:** EPIC-5: Food / Meal Planner Module
**Sprint:** 6 — Vehicles, Food, Family Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** REST endpoints for recipe CRUD with photo upload
**So that** the React UI can manage the recipe library

---

## Acceptance Criteria

- [ ] `GET /api/v1/recipes?search=&tags=` returns matching recipes
- [ ] `POST /api/v1/recipes` creates recipe (admin or teen permitted)
- [ ] `PATCH /api/v1/recipes/:id` updates
- [ ] `DELETE /api/v1/recipes/:id` deletes (admin only)
- [ ] `POST /api/v1/recipes/:id/photo` multer upload, max 10MB, resized via `sharp` to 1200px wide WebP
- [ ] Photos stored at `~/.nestor/uploads/recipes/<uuid>.webp`
- [ ] Filenames sanitised; storage names UUIDs
- [ ] Tests cover happy path + oversize upload rejected (413)

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/recipes.ts`
- `server/src/services/photoUpload.ts` — generic helper used here and elsewhere
- `server/src/utils/files.ts` — paths and sanitisation
- `server/tests/routes/recipes.test.ts`

### Implementation steps

1. Multer config:
```ts
export const recipePhotoUpload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ['image/jpeg','image/png','image/webp'].includes(file.mimetype)),
});
```
2. `processAndStorePhoto(buffer, dir)`:
```ts
const id = crypto.randomUUID();
const path = `${UPLOAD_ROOT}/${dir}/${id}.webp`;
await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path);
return `/uploads/${dir}/${id}.webp`;
```
3. Routes use `requirePermission('recipe.edit')` (admin/teen).
4. Mount static `/uploads` directory in Express read-only (chained behind auth via middleware).
5. Tests:
   - POST recipe → 201
   - GET list with search+tags
   - PATCH updates
   - POST oversize photo → 413
   - POST non-image → 400

### Key technical details

- Architecture §"Security Best Practices": sanitise filenames, UUID storage, image-only mime types.
- `sharp` used for resize/recompression — bundled with the install.
- WebP chosen for size; quality 80 is the sweet spot.
- Permission key `recipe.edit` declared in STORY-2.3's permissions list (add if not present).

---

## Dependencies

- **Blocked by:** STORY-5.1
- **Blocks:** STORY-5.3 (URL import writes recipes), STORY-5.4 (planner reads), STORY-5.5 (library)

---

## Test Checklist

- [ ] Unit: GET with empty query lists all
- [ ] Unit: GET with search filters
- [ ] Unit: POST as admin → 201
- [ ] Unit: POST as child → 403
- [ ] Unit: oversize upload → 413
- [ ] Unit: non-image upload → 400
- [ ] Manual: upload a 10MB JPEG, processed to a ~200KB WebP

---

## Notes

- The same upload helper is reused by Pets (STORY-10.2) and Profiles (STORY-2.8 avatar).
- `/uploads` is served from disk; future S3-style adapter is plugin scope.
