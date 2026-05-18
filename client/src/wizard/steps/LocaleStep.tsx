import { useState } from 'react';
import { patchSettings } from '../api';

const DATE_FORMATS = [
  { id: 'dd/MM/yyyy', label: 'DD/MM/YYYY (UK)' },
  { id: 'MM/dd/yyyy', label: 'MM/DD/YYYY (US)' },
  { id: 'yyyy-MM-dd', label: 'YYYY-MM-DD (ISO)' },
];

const CURRENCIES = [
  { code: 'GBP', label: '£ British Pound' },
  { code: 'USD', label: '$ US Dollar' },
  { code: 'EUR', label: '€ Euro' },
  { code: 'AUD', label: 'A$ Australian Dollar' },
];

const TEMP_UNITS = [
  { id: 'celsius', label: 'Celsius (°C)' },
  { id: 'fahrenheit', label: 'Fahrenheit (°F)' },
];

function detectTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

interface LocaleForm {
  timezone: string;
  date_format: string;
  temperature_unit: string;
  currency: string;
}

interface LocaleStepProps {
  onNext: (settings: LocaleForm) => void;
}

export default function LocaleStep({ onNext }: LocaleStepProps) {
  const [form, setForm] = useState<LocaleForm>({
    timezone: detectTimezone(),
    date_format: 'dd/MM/yyyy',
    temperature_unit: 'celsius',
    currency: 'GBP',
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof LocaleForm>(key: K, value: LocaleForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleNext() {
    setSaving(true);
    try {
      await patchSettings({
        timezone: form.timezone,
        date_format: form.date_format,
        temperature_unit: form.temperature_unit,
        currency: form.currency,
      });
    } finally {
      setSaving(false);
    }
    onNext(form);
  }

  function selectField(
    label: string,
    key: keyof LocaleForm,
    options: { id: string; label: string }[],
  ) {
    return (
      <div>
        <label className="block text-caption font-medium text-secondary mb-1">{label}</label>
        <select
          className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar bg-white"
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-body text-secondary">Set your regional preferences.</p>

      <div>
        <label className="block text-caption font-medium text-secondary mb-1">Timezone</label>
        <input
          type="text"
          className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar"
          value={form.timezone}
          onChange={(e) => set('timezone', e.target.value)}
          placeholder="e.g. Europe/London"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {selectField('Date format', 'date_format', DATE_FORMATS)}
        {selectField('Temperature', 'temperature_unit', TEMP_UNITS)}
        {selectField(
          'Currency',
          'currency',
          CURRENCIES.map((c) => ({ id: c.code, label: c.label })),
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={() => { void handleNext(); }}
          disabled={saving}
          className="px-5 py-2.5 bg-neutral-900 text-white rounded-button font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Next'}
        </button>
      </div>
    </div>
  );
}
