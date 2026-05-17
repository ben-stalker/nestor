import { useEffect, useState } from 'react';
import type { PluginInfo, SettingField } from '../types';
import { usePluginSettings, useSavePluginSettings } from '../hooks/usePlugins';

interface Props {
  plugin: PluginInfo;
  onClose: () => void;
}

function defaultFor(field: SettingField, current: Record<string, string>): string {
  if (current[field.key] !== undefined) return current[field.key];
  if (field.default === undefined) return '';
  return String(field.default);
}

function renderInput(
  field: SettingField,
  value: string,
  onChange: (next: string) => void,
): React.ReactNode {
  const common = {
    id: `plugin-setting-${field.key}`,
    'aria-label': field.label,
    className: 'w-full rounded-button border border-neutral-200 px-3 py-2 text-body',
  };
  if (field.type === 'textarea') {
    return (
      <textarea {...common} rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
    );
  }
  if (field.type === 'toggle') {
    return (
      <input
        type="checkbox"
        id={common.id}
        aria-label={field.label}
        checked={value === 'true'}
        onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
      />
    );
  }
  if (field.type === 'number') {
    return (
      <input
        {...common}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  }
  return (
    <input
      {...common}
      type={field.type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
    />
  );
}

export default function PluginSettingsModal({ plugin, onClose }: Props) {
  const { data: existing } = usePluginSettings(plugin.id);
  const save = useSavePluginSettings(plugin.id);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!existing) return;
    setValues((prev) => {
      const next: Record<string, string> = {};
      plugin.settingsFields.forEach((f) => {
        next[f.key] = prev[f.key] !== undefined ? prev[f.key] : defaultFor(f, existing);
      });
      return next;
    });
  }, [existing, plugin]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save.mutate(values, { onSuccess: onClose });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Configure ${plugin.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md rounded-card bg-surface-elev p-6 shadow-xl">
        <h2 className="mb-1 text-h2 font-semibold text-primary">{plugin.name}</h2>
        <p className="mb-4 text-caption text-secondary">{plugin.description}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {plugin.settingsFields.length === 0 && (
            <p className="text-caption text-secondary">No settings for this plugin.</p>
          )}
          {plugin.settingsFields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <label htmlFor={`plugin-setting-${field.key}`} className="text-caption font-medium text-secondary">
                {field.label}
              </label>
              {renderInput(field, values[field.key] ?? '', (v) =>
                setValues((prev) => ({ ...prev, [field.key]: v })),
              )}
              {field.description && (
                <p className="text-caption text-secondary">{field.description}</p>
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-button px-4 py-2 text-body text-secondary hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-button bg-mode-house px-4 py-2 text-body text-white disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
