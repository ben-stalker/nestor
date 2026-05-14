import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../shared/ui/Modal';
import { createRecipe, updateRecipe } from './api';
import type { Recipe } from './types';
import apiFetch from '../api/client';

interface IngredientRow {
  quantity: string;
  unit: string;
  ingredient: string;
  notes: string;
}

const EMPTY_INGREDIENT: IngredientRow = { quantity: '', unit: '', ingredient: '', notes: '' };

function submitLabel(isPending: boolean, isEdit: boolean): string {
  if (isPending) return 'Saving...';
  return isEdit ? 'Update' : 'Create';
}

interface RecipeFormModalProps {
  open: boolean;
  onClose: () => void;
  recipe?: Recipe | null; // if provided, edit mode
}

export default function RecipeFormModal({ open, onClose, recipe }: RecipeFormModalProps) {
  const qc = useQueryClient();
  const isEdit = Boolean(recipe);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepMins, setPrepMins] = useState('0');
  const [cookMins, setCookMins] = useState('0');
  const [servings, setServings] = useState('4');
  const [calories, setCalories] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([{ ...EMPTY_INGREDIENT }]);
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  // Reset form when opening
  useEffect(() => {
    if (open) {
      if (recipe) {
        setTitle(recipe.title);
        setDescription(recipe.description ?? '');
        setPrepMins(String(recipe.prep_mins));
        setCookMins(String(recipe.cook_mins));
        setServings(String(recipe.servings));
        setCalories(recipe.calories != null ? String(recipe.calories) : '');
        setTagsInput(recipe.tags.join(', '));
        setIngredients(
          recipe.ingredients.length > 0
            ? recipe.ingredients.map((i) => ({
                quantity: i.quantity != null ? String(i.quantity) : '',
                unit: i.unit ?? '',
                ingredient: i.ingredient,
                notes: i.notes ?? '',
              }))
            : [{ ...EMPTY_INGREDIENT }],
        );
      } else {
        setTitle('');
        setDescription('');
        setPrepMins('0');
        setCookMins('0');
        setServings('4');
        setCalories('');
        setTagsInput('');
        setIngredients([{ ...EMPTY_INGREDIENT }]);
        setImportUrl('');
        setImportError('');
        setPhotoFile(null);
      }
      setError('');
    }
  }, [open, recipe]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = {
        title,
        description: description || null,
        prep_mins: Number(prepMins) || 0,
        cook_mins: Number(cookMins) || 0,
        servings: Number(servings) || 4,
        calories: calories ? Number(calories) : null,
        tags,
        ingredients: ingredients
          .filter((i) => i.ingredient.trim())
          .map((i, idx) => ({
            ingredient: i.ingredient.trim(),
            quantity: i.quantity ? Number(i.quantity) : null,
            unit: i.unit.trim() || null,
            notes: i.notes.trim() || null,
            sort_order: idx,
          })),
      };

      let saved: Recipe;
      if (isEdit && recipe) {
        saved = await updateRecipe(recipe.id, payload);
      } else {
        saved = await createRecipe(payload);
      }

      // Upload photo if selected
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        await fetch(`/api/v1/recipes/${saved.id}/photo`, {
          method: 'POST',
          body: formData,
          headers: {
            'X-Profile-Id': String(saved.id), // Will be overridden by apiFetch internals if needed
          },
        });
      }

      return saved;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['recipes'] });
      if (isEdit && recipe) {
        void qc.invalidateQueries({ queryKey: ['recipe', recipe.id] });
      }
      onClose();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
    },
  });

  async function handleImport() {
    if (!importUrl.trim()) return;
    setIsImporting(true);
    setImportError('');
    try {
      const result = await apiFetch<{
        title?: string;
        description?: string;
        prep_mins?: number;
        cook_mins?: number;
        servings?: number;
        ingredients?: Array<{
          ingredient: string;
          quantity?: number;
          unit?: string;
          notes?: string;
        }>;
      }>('/api/v1/recipes/import-url', {
        method: 'POST',
        body: { url: importUrl.trim() },
      });
      if (result.title) setTitle(result.title);
      if (result.description) setDescription(result.description);
      if (result.prep_mins != null) setPrepMins(String(result.prep_mins));
      if (result.cook_mins != null) setCookMins(String(result.cook_mins));
      if (result.servings != null) setServings(String(result.servings));
      if (result.ingredients && result.ingredients.length > 0) {
        setIngredients(
          result.ingredients.map((i) => ({
            ingredient: i.ingredient,
            quantity: i.quantity != null ? String(i.quantity) : '',
            unit: i.unit ?? '',
            notes: i.notes ?? '',
          })),
        );
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT }]);
  }

  function removeIngredient(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateIngredient(idx: number, field: keyof IngredientRow, value: string) {
    setIngredients((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    saveMutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Recipe' : 'Add Recipe'}
      className="landscape:max-w-2xl"
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1"
      >
        {/* Import URL section */}
        {!isEdit && (
          <div className="flex flex-col gap-2 rounded-card bg-surface-elev p-3">
            <label className="text-caption font-medium text-secondary">Import from URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                className="flex-1 rounded-card border border-surface-elev bg-surface px-3 py-2 text-body text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="https://..."
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  void handleImport();
                }}
                disabled={isImporting || !importUrl.trim()}
                className="rounded-card bg-accent px-3 py-2 text-body font-medium text-white disabled:opacity-50 hover:bg-accent/90 transition-colors"
              >
                {isImporting ? '...' : 'Import'}
              </button>
            </div>
            {importError && <p className="text-caption text-red-500">{importError}</p>}
          </div>
        )}

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label htmlFor="recipe-title" className="text-caption font-medium text-secondary">
            Title{' '}
            <span aria-hidden="true" className="text-red-500">
              *
            </span>
          </label>
          <input
            id="recipe-title"
            type="text"
            required
            className="rounded-card border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label htmlFor="recipe-description" className="text-caption font-medium text-secondary">
            Method / Description
          </label>
          <textarea
            id="recipe-description"
            rows={4}
            className="rounded-card border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-y"
            placeholder="One step per line..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Prep / Cook / Servings / Calories */}
        <div className="grid grid-cols-2 gap-3 portrait:grid-cols-2 landscape:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="recipe-prep" className="text-caption font-medium text-secondary">
              Prep (min)
            </label>
            <input
              id="recipe-prep"
              type="number"
              min="0"
              className="rounded-card border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={prepMins}
              onChange={(e) => setPrepMins(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="recipe-cook" className="text-caption font-medium text-secondary">
              Cook (min)
            </label>
            <input
              id="recipe-cook"
              type="number"
              min="0"
              className="rounded-card border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={cookMins}
              onChange={(e) => setCookMins(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="recipe-servings" className="text-caption font-medium text-secondary">
              Servings
            </label>
            <input
              id="recipe-servings"
              type="number"
              min="1"
              className="rounded-card border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="recipe-calories" className="text-caption font-medium text-secondary">
              Calories
            </label>
            <input
              id="recipe-calories"
              type="number"
              min="1"
              className="rounded-card border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1">
          <label htmlFor="recipe-tags" className="text-caption font-medium text-secondary">
            Tags (comma-separated)
          </label>
          <input
            id="recipe-tags"
            type="text"
            className="rounded-card border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="e.g. italian, quick, vegetarian"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        {/* Ingredients */}
        <div className="flex flex-col gap-2">
          <h3 className="text-caption font-medium text-secondary">Ingredients</h3>
          {ingredients.map((row, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="any"
                className="w-16 rounded-card border border-surface-elev bg-surface px-2 py-1.5 text-caption text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Qty"
                value={row.quantity}
                onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                aria-label="Quantity"
              />
              <input
                type="text"
                className="w-16 rounded-card border border-surface-elev bg-surface px-2 py-1.5 text-caption text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Unit"
                value={row.unit}
                onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                aria-label="Unit"
              />
              <input
                type="text"
                className="flex-1 rounded-card border border-surface-elev bg-surface px-2 py-1.5 text-caption text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Ingredient *"
                required={ingredients.length === 1}
                value={row.ingredient}
                onChange={(e) => updateIngredient(idx, 'ingredient', e.target.value)}
                aria-label="Ingredient"
              />
              <input
                type="text"
                className="w-24 rounded-card border border-surface-elev bg-surface px-2 py-1.5 text-caption text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Notes"
                value={row.notes}
                onChange={(e) => updateIngredient(idx, 'notes', e.target.value)}
                aria-label="Notes"
              />
              <button
                type="button"
                onClick={() => removeIngredient(idx)}
                aria-label="Remove ingredient"
                disabled={ingredients.length === 1}
                className="text-secondary hover:text-red-500 disabled:opacity-30 transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addIngredient}
            className="flex items-center gap-1 rounded-card border border-dashed border-surface-elev py-1.5 px-3 text-caption text-secondary hover:border-accent hover:text-accent transition-colors self-start"
          >
            <Plus className="size-3" /> Add ingredient
          </button>
        </div>

        {/* Photo upload */}
        <div className="flex flex-col gap-1">
          <label htmlFor="recipe-photo" className="text-caption font-medium text-secondary">
            Photo
          </label>
          <input
            id="recipe-photo"
            type="file"
            accept="image/*"
            className="text-caption text-primary"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && (
          <p className="text-caption text-red-500" role="alert">
            {error}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-card border border-surface-elev px-4 py-2 text-body text-secondary hover:bg-surface-elev transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-card bg-accent px-6 py-2 text-body font-medium text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {submitLabel(saveMutation.isPending, isEdit)}
          </button>
        </div>
      </form>
    </Modal>
  );
}
