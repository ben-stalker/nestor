import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GripVertical, Eye, EyeOff, Save } from 'lucide-react';
import apiFetch from '../api/client';
import { useAppSettings, APP_SETTINGS_KEY } from '../core/hooks/useAppSettings';
import { DEFAULT_NAV_MODES } from '../core/navModes';
import Button from '../shared/ui/Button';

const LAYOUT_OPTIONS = [
  { id: 'default', label: 'Auto' },
  { id: 'compact', label: 'Compact' },
  { id: 'expanded', label: 'Expanded' },
];

interface NavItem {
  id: string;
  label: string;
  customLabel: string;
  hidden: boolean;
}

export default function NavigationPanel() {
  const { data: settings } = useAppSettings();
  const qc = useQueryClient();

  const savedOrder =
    (settings?.nav_mode_order as string[] | undefined) ?? DEFAULT_NAV_MODES.map((m) => m.id);
  const savedHidden = (settings?.nav_mode_hidden as string[] | undefined) ?? [];
  const savedLabels = (settings?.nav_mode_labels as Record<string, string> | undefined) ?? {};
  const savedLayout = (settings?.nav_layout as string) ?? 'default';

  const [items, setItems] = useState<NavItem[]>([]);
  const [layout, setLayout] = useState(savedLayout);
  const dragIndex = useRef<number | null>(null);

  useEffect(() => {
    const allModes = [...DEFAULT_NAV_MODES];
    const ordered = savedOrder
      .map((id) => allModes.find((m) => m.id === id))
      .filter(Boolean) as typeof allModes;
    // add any new modes not in saved order
    allModes.forEach((m) => {
      if (!ordered.find((o) => o.id === m.id)) ordered.push(m);
    });

    setItems(
      ordered.map((m) => ({
        id: m.id,
        label: m.label,
        customLabel: savedLabels[m.id] ?? '',
        hidden: savedHidden.includes(m.id),
      })),
    );
    setLayout(savedLayout);
  }, [settings]);

  const mut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<void>('/api/v1/settings', { method: 'PATCH', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
    },
  });

  function save() {
    const order = items.map((i) => i.id);
    const hidden = items.filter((i) => i.hidden).map((i) => i.id);
    const labels: Record<string, string> = {};
    items.forEach((i) => {
      if (i.customLabel) labels[i.id] = i.customLabel;
    });
    mut.mutate({
      nav_mode_order: order,
      nav_mode_hidden: hidden,
      nav_mode_labels: labels,
      nav_layout: layout,
    });
  }

  function toggleHidden(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, hidden: !i.hidden } : i)));
  }

  function setCustomLabel(id: string, val: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, customLabel: val } : i)));
  }

  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex.current!, 1);
      next.splice(index, 0, moved);
      dragIndex.current = index;
      return next;
    });
  }

  function handleDragEnd() {
    dragIndex.current = null;
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Layout */}
      <section className="space-y-2">
        <h3 className="text-body font-semibold text-primary">Nav layout</h3>
        <div className="flex gap-2">
          {LAYOUT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setLayout(opt.id)}
              className={`px-4 py-2 rounded-xl border text-body font-medium transition-colors ${
                layout === opt.id
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'border-neutral-200 text-secondary hover:border-neutral-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Nav items */}
      <section className="space-y-2">
        <h3 className="text-body font-semibold text-primary">Sections</h3>
        <p className="text-caption text-secondary">
          Drag to reorder. Toggle visibility. Rename optional.
        </p>
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors cursor-grab active:cursor-grabbing ${
                item.hidden
                  ? 'bg-neutral-50 border-neutral-100 opacity-60'
                  : 'bg-white border-neutral-200 shadow-sm'
              }`}
            >
              <GripVertical size={16} className="text-neutral-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-primary">{item.label}</p>
                <input
                  type="text"
                  value={item.customLabel}
                  onChange={(e) => setCustomLabel(item.id, e.target.value)}
                  placeholder="Custom label (optional)"
                  className="mt-0.5 w-full text-caption text-secondary border-none bg-transparent outline-none placeholder-neutral-300"
                  maxLength={20}
                />
              </div>
              <button
                type="button"
                onClick={() => toggleHidden(item.id)}
                className={`p-1.5 rounded-lg transition-colors ${item.hidden ? 'text-neutral-400 hover:text-primary' : 'text-primary hover:bg-neutral-100'}`}
                aria-label={item.hidden ? `Show ${item.label}` : `Hide ${item.label}`}
              >
                {item.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          ))}
        </div>
      </section>

      <Button variant="primary" onClick={save} disabled={mut.isPending}>
        <Save size={14} /> {mut.isPending ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}
