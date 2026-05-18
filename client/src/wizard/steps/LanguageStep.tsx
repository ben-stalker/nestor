import { useState } from 'react';
import { patchSettings } from '../api';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

function detectBrowserLanguage(): string {
  const lang = navigator.language.split('-')[0];
  return LANGUAGES.find((l) => l.code === lang) ? lang : 'en';
}

interface LanguageStepProps {
  onNext: (selected: string) => void;
}

export default function LanguageStep({ onNext }: LanguageStepProps) {
  const [selected, setSelected] = useState<string>(detectBrowserLanguage());
  const [saving, setSaving] = useState(false);

  async function handleNext() {
    setSaving(true);
    try {
      await patchSettings({ language: selected });
    } finally {
      setSaving(false);
    }
    onNext(selected);
  }

  return (
    <div className="space-y-4">
      <p className="text-body text-secondary">Choose the language for your Nestor display.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setSelected(lang.code)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors ${
              selected === lang.code
                ? 'border-neutral-900 bg-neutral-50'
                : 'border-neutral-200 hover:border-neutral-400'
            }`}
            aria-pressed={selected === lang.code}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className="text-body font-medium text-primary">{lang.label}</span>
          </button>
        ))}
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

export { LANGUAGES, detectBrowserLanguage };
