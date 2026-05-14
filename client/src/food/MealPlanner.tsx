import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMealPlan, useSetMealPlanEntry, useDeleteMealPlanEntry } from './useMealPlan';
import RecipePickerModal from './RecipePickerModal';
import type { MealPlanEntry, MealSlot, Recipe } from './types';
import { DEFAULT_SLOTS } from './types';

// TODO: Replace with useAppSettings().meal_slots when settings module adds meal_slots support
const SLOTS: MealSlot[] = DEFAULT_SLOTS;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatHeaderDate(date: Date): string {
  return new Intl.DateTimeFormat(navigator.language, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

interface SlotEditorState {
  date: string;
  slotId: string;
  existingEntry: MealPlanEntry | null;
}

export default function MealPlanner() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [slotEditor, setSlotEditor] = useState<SlotEditorState | null>(null);
  const [freeText, setFreeText] = useState('');
  const [showRecipePicker, setShowRecipePicker] = useState(false);

  const weekEnd = addDays(weekStart, 6);
  const startStr = toDateString(weekStart);
  const endStr = toDateString(weekEnd);

  const today = toDateString(new Date());

  const { data: entries = [] } = useMealPlan(startStr, endStr);
  const setEntry = useSetMealPlanEntry();
  const deleteEntry = useDeleteMealPlanEntry();

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { date: toDateString(d), label: DAY_LABELS[i], display: formatHeaderDate(d) };
  });

  function getEntry(date: string, slotId: string): MealPlanEntry | null {
    return entries.find((e) => e.plan_date === date && e.slot_name === slotId) ?? null;
  }

  function openSlotEditor(date: string, slotId: string) {
    const existing = getEntry(date, slotId);
    setSlotEditor({ date, slotId, existingEntry: existing });
    setFreeText(existing?.free_text ?? '');
  }

  function closeSlotEditor() {
    setSlotEditor(null);
    setFreeText('');
  }

  function handleSaveFreeText() {
    if (!slotEditor) return;
    setEntry.mutate({
      plan_date: slotEditor.date,
      slot_name: slotEditor.slotId,
      free_text: freeText || null,
      recipe_id: null,
    });
    closeSlotEditor();
  }

  function handleSelectRecipe(recipe: Recipe) {
    if (!slotEditor) return;
    setEntry.mutate({
      plan_date: slotEditor.date,
      slot_name: slotEditor.slotId,
      recipe_id: recipe.id,
      free_text: null,
    });
    closeSlotEditor();
  }

  function handleClearSlot() {
    if (!slotEditor) return;
    const existing = slotEditor.existingEntry;
    if (existing) {
      deleteEntry.mutate(existing.id);
    }
    closeSlotEditor();
  }

  function prevWeek() {
    setWeekStart((d) => addDays(d, -7));
  }

  function nextWeek() {
    setWeekStart((d) => addDays(d, 7));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Week navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={prevWeek}
          aria-label="Previous week"
          className="rounded-full p-2 hover:bg-surface-elev transition-colors"
        >
          <ChevronLeft className="size-5 text-primary" />
        </button>
        <span className="text-body font-medium text-primary">
          {formatHeaderDate(weekStart)} – {formatHeaderDate(weekEnd)}
        </span>
        <button
          type="button"
          onClick={nextWeek}
          aria-label="Next week"
          className="rounded-full p-2 hover:bg-surface-elev transition-colors"
        >
          <ChevronRight className="size-5 text-primary" />
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-caption">
          <thead>
            <tr>
              {/* Slot label column header */}
              <th
                className="w-20 py-2 text-left text-secondary font-normal"
                aria-label="Meal slot"
              />
              {weekDays.map(({ date, label, display }) => (
                <th
                  key={date}
                  className={`py-2 px-1 text-center font-medium ${date === today ? 'text-accent' : 'text-secondary'}`}
                  data-testid={`day-col-${date}`}
                >
                  <div
                    className={`rounded-full px-2 py-0.5 ${date === today ? 'bg-accent/10' : ''}`}
                  >
                    <div>{label}</div>
                    <div className="text-[10px]">{display}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot) => (
              <tr key={slot.id} className="border-t border-surface-elev">
                <td className="py-2 pr-2 font-medium text-secondary whitespace-nowrap">
                  {slot.label}
                </td>
                {weekDays.map(({ date }) => {
                  const entry = getEntry(date, slot.id);
                  const isToday = date === today;
                  return (
                    <td
                      key={date}
                      className={`py-1 px-1 align-top ${isToday ? 'bg-accent/5' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => openSlotEditor(date, slot.id)}
                        className={`w-full min-h-[3rem] rounded-card p-1.5 text-left text-caption transition-colors ${
                          entry
                            ? 'bg-surface-elev text-primary hover:bg-surface-elev/80'
                            : 'border border-dashed border-surface-elev text-secondary hover:border-accent hover:text-accent'
                        }`}
                        aria-label={
                          entry
                            ? `Edit ${slot.label} on ${date}: ${entry.recipe?.title ?? entry.free_text ?? ''}`
                            : `Add ${slot.label} on ${date}`
                        }
                        data-testid={`slot-${date}-${slot.id}`}
                      >
                        {entry?.recipe && (
                          <span className="flex items-start gap-1">
                            <span
                              className="inline-block size-2 rounded-full bg-accent mt-1 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="leading-tight">{entry.recipe.title}</span>
                          </span>
                        )}
                        {!entry?.recipe && entry?.free_text && (
                          <span className="leading-tight text-primary">{entry.free_text}</span>
                        )}
                        {!entry && <span className="text-[10px]">+</span>}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slot editor overlay */}
      {slotEditor !== null && !showRecipePicker && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Edit meal slot"
          data-testid="slot-editor"
        >
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={closeSlotEditor}
          />
          <div className="relative z-10 w-full max-w-lg rounded-t-card bg-surface p-6 shadow-lg portrait:w-full landscape:rounded-card">
            <h3 className="text-h2 font-semibold text-primary mb-4">
              {SLOTS.find((s) => s.id === slotEditor.slotId)?.label ?? slotEditor.slotId}{' '}
              <span className="text-secondary font-normal text-body">
                {new Intl.DateTimeFormat(navigator.language, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }).format(new Date(`${slotEditor.date}T00:00:00`))}
              </span>
            </h3>

            <div className="flex flex-col gap-3">
              {/* Browse recipes button */}
              <button
                type="button"
                onClick={() => setShowRecipePicker(true)}
                className="w-full rounded-card bg-accent py-3 text-body font-medium text-white hover:bg-accent/90 transition-colors"
                data-testid="browse-recipes-btn"
              >
                Browse Recipes
              </button>

              {/* Free text input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-card border border-surface-elev bg-surface px-3 py-2 text-body text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Or type a meal..."
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveFreeText();
                  }}
                  aria-label="Free text meal"
                  data-testid="free-text-input"
                />
                <button
                  type="button"
                  onClick={handleSaveFreeText}
                  className="rounded-card bg-surface-elev px-4 py-2 text-body text-primary hover:bg-surface-elev/80 transition-colors"
                >
                  Save
                </button>
              </div>

              {/* Clear button if entry exists */}
              {slotEditor.existingEntry && (
                <button
                  type="button"
                  onClick={handleClearSlot}
                  className="w-full rounded-card border border-surface-elev py-2 text-body text-secondary hover:bg-surface-elev transition-colors"
                  data-testid="clear-slot-btn"
                >
                  Clear slot
                </button>
              )}

              <button
                type="button"
                onClick={closeSlotEditor}
                className="w-full rounded-card py-2 text-body text-secondary hover:bg-surface-elev transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe picker modal */}
      <RecipePickerModal
        open={showRecipePicker}
        onClose={() => setShowRecipePicker(false)}
        onSelect={handleSelectRecipe}
      />
    </div>
  );
}
