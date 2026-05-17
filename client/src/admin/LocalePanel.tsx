import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import apiFetch from '../api/client';
import { useAppSettings, APP_SETTINGS_KEY } from '../core/hooks/useAppSettings';
import Button from '../shared/ui/Button';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية (RTL — Phase 2)' },
];

const LOCALES = [
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-AU', label: 'English (AU)' },
  { code: 'fr-FR', label: 'French (France)' },
  { code: 'de-DE', label: 'German (Germany)' },
  { code: 'es-ES', label: 'Spanish (Spain)' },
  { code: 'ar-SA', label: 'Arabic (Saudi Arabia)' },
];

const DATE_FORMATS = [
  { id: 'dd/MM/yyyy', label: 'DD/MM/YYYY (UK)' },
  { id: 'MM/dd/yyyy', label: 'MM/DD/YYYY (US)' },
  { id: 'yyyy-MM-dd', label: 'YYYY-MM-DD (ISO)' },
  { id: 'd MMM yyyy', label: 'D Mon YYYY' },
];

const TIME_FORMATS = [
  { id: 'HH:mm', label: '24h (14:30)' },
  { id: 'h:mm a', label: '12h (2:30 PM)' },
];

const CURRENCIES = [
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
];

const FIRST_DAY = [
  { id: '1', label: 'Monday' },
  { id: '0', label: 'Sunday' },
  { id: '6', label: 'Saturday' },
];

const TEMP_UNITS = [
  { id: 'celsius', label: 'Celsius (°C)' },
  { id: 'fahrenheit', label: 'Fahrenheit (°F)' },
];

const DISTANCE_UNITS = [
  { id: 'metric', label: 'Metric (km, m)' },
  { id: 'imperial', label: 'Imperial (miles, ft)' },
];

interface LocaleForm {
  language: string;
  locale: string;
  date_format: string;
  time_format: string;
  currency: string;
  temperature_unit: string;
  distance_unit: string;
  first_day_of_week: string;
}

function buildPreviewDate(locale: string, dateFormat: string, timeFormat: string): string {
  const now = new Date(2026, 4, 17, 14, 30); // fixed example
  try {
    const datePart = now.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timePart =
      timeFormat === 'HH:mm'
        ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        : now.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true });
    void dateFormat;
    return `${datePart}  ${timePart}`;
  } catch {
    return `17/05/2026  14:30`;
  }
}

function buildPreviewCurrency(locale: string, currency: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(1234.56);
  } catch {
    return '£1,234.56';
  }
}

export default function LocalePanel() {
  const { data: settings } = useAppSettings();
  const qc = useQueryClient();

  const [form, setForm] = useState<LocaleForm>({
    language: (settings?.language as string) ?? 'en',
    locale: (settings?.locale as string) ?? 'en-GB',
    date_format: (settings?.date_format as string) ?? 'dd/MM/yyyy',
    time_format: (settings?.time_format as string) ?? 'HH:mm',
    currency: (settings?.currency as string) ?? 'GBP',
    temperature_unit: (settings?.temperature_unit as string) ?? 'celsius',
    distance_unit: (settings?.distance_unit as string) ?? 'metric',
    first_day_of_week: (settings?.first_day_of_week as string) ?? '1',
  });

  const preview = useMemo(
    () => ({
      dateTime: buildPreviewDate(form.locale, form.date_format, form.time_format),
      currency: buildPreviewCurrency(form.locale, form.currency),
    }),
    [form.locale, form.date_format, form.time_format, form.currency],
  );

  const mut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<void>('/api/v1/settings', { method: 'PATCH', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
    },
  });

  function handleSave() {
    mut.mutate({
      language: form.language,
      locale: form.locale,
      date_format: form.date_format,
      time_format: form.time_format,
      currency: form.currency,
      temperature_unit: form.temperature_unit,
      distance_unit: form.distance_unit,
      first_day_of_week: form.first_day_of_week,
    });
  }

  function field(label: string, key: keyof LocaleForm, options: { id: string; label: string }[]) {
    return (
      <div>
        <label className="block text-caption font-medium text-secondary mb-1">{label}</label>
        <select
          className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar bg-white"
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
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
    <div className="space-y-6 max-w-lg">
      {/* Preview */}
      <div className="bg-neutral-50 rounded-2xl p-4 space-y-1">
        <p className="text-caption font-medium text-secondary">Preview</p>
        <p className="text-body font-semibold text-primary">{preview.dateTime}</p>
        <p className="text-body text-primary">{preview.currency}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {field(
          'Language',
          'language',
          LANGUAGES.map((l) => ({ id: l.code, label: l.label })),
        )}
        {field(
          'Locale',
          'locale',
          LOCALES.map((l) => ({ id: l.code, label: l.label })),
        )}
        {field('Date format', 'date_format', DATE_FORMATS)}
        {field('Time format', 'time_format', TIME_FORMATS)}
        {field(
          'Currency',
          'currency',
          CURRENCIES.map((c) => ({ id: c.code, label: `${c.symbol} ${c.label}` })),
        )}
        {field('Temperature', 'temperature_unit', TEMP_UNITS)}
        {field('Distance', 'distance_unit', DISTANCE_UNITS)}
        {field('First day of week', 'first_day_of_week', FIRST_DAY)}
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
        <span className="text-caption text-amber-800">
          RTL language support (Arabic, Hebrew) — Phase 2, not yet implemented.
        </span>
      </div>

      <Button variant="primary" onClick={handleSave} disabled={mut.isPending}>
        <Save size={14} /> {mut.isPending ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}
