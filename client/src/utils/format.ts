/**
 * Centralised locale-aware formatting helpers.
 * All helpers accept an optional `locale` override; when omitted they read
 * from the module-level `currentLocale` value which is kept in sync with
 * `app_settings.locale` via `setFormatLocale()`.
 *
 * Usage:
 *   import { formatDate, setFormatLocale } from '../utils/format';
 *   setFormatLocale('fr-FR');  // called once in AppShell / ProfileProvider
 *   formatDate(new Date());    // → "18 mai 2026"
 */

let currentLocale = 'en-GB';
let currentTemperatureUnit: 'celsius' | 'fahrenheit' = 'celsius';
let currentCurrency = 'GBP';

export function setFormatLocale(locale: string): void {
  currentLocale = locale;
}

export function setFormatTemperatureUnit(unit: 'celsius' | 'fahrenheit'): void {
  currentTemperatureUnit = unit;
}

export function setFormatCurrency(currency: string): void {
  currentCurrency = currency;
}

// ─── Date & Time ─────────────────────────────────────────────────────────────

export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions & { locale?: string } = {},
): string {
  const { locale, ...intlOptions } = options;
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(locale ?? currentLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...intlOptions,
  });
}

export function formatDateShort(
  date: Date | string | number,
  options: { locale?: string } = {},
): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(options.locale ?? currentLocale, {
    day: 'numeric',
    month: 'short',
  });
}

export function formatTime(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions & { locale?: string } = {},
): string {
  const { locale, ...intlOptions } = options;
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString(locale ?? currentLocale, {
    hour: '2-digit',
    minute: '2-digit',
    ...intlOptions,
  });
}

export function formatDateTime(
  date: Date | string | number,
  options: { locale?: string } = {},
): string {
  const d = date instanceof Date ? date : new Date(date);
  return `${formatDate(d, options)} ${formatTime(d, options)}`;
}

// ─── Numbers & Currency ───────────────────────────────────────────────────────

export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions & { locale?: string } = {},
): string {
  const { locale, ...intlOptions } = options;
  return new Intl.NumberFormat(locale ?? currentLocale, intlOptions).format(value);
}

export function formatCurrency(
  amount: number,
  options: { currency?: string; locale?: string } = {},
): string {
  const { currency = currentCurrency, locale } = options;
  return new Intl.NumberFormat(locale ?? currentLocale, {
    style: 'currency',
    currency,
  }).format(amount);
}

// ─── Temperature ─────────────────────────────────────────────────────────────

export function formatTemperature(
  celsius: number,
  options: { unit?: 'celsius' | 'fahrenheit'; locale?: string } = {},
): string {
  const { unit = currentTemperatureUnit, locale } = options;
  const value = unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;
  return new Intl.NumberFormat(locale ?? currentLocale, {
    style: 'unit',
    unit: unit === 'fahrenheit' ? 'fahrenheit' : 'celsius',
    unitDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
}

// ─── Distance ────────────────────────────────────────────────────────────────

export function formatDistance(
  metres: number,
  options: { unit?: 'metric' | 'imperial'; locale?: string } = {},
): string {
  const { unit = 'metric', locale } = options;
  const loc = locale ?? currentLocale;
  if (unit === 'imperial') {
    const miles = metres / 1609.344;
    if (miles < 0.1) {
      const yards = metres * 1.09361;
      return new Intl.NumberFormat(loc, {
        style: 'unit',
        unit: 'yard',
        unitDisplay: 'short',
        maximumFractionDigits: 0,
      }).format(yards);
    }
    return new Intl.NumberFormat(loc, {
      style: 'unit',
      unit: 'mile',
      unitDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(miles);
  }
  if (metres < 1000) {
    return new Intl.NumberFormat(loc, {
      style: 'unit',
      unit: 'meter',
      unitDisplay: 'short',
      maximumFractionDigits: 0,
    }).format(metres);
  }
  return new Intl.NumberFormat(loc, {
    style: 'unit',
    unit: 'kilometer',
    unitDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(metres / 1000);
}

// ─── Volume ───────────────────────────────────────────────────────────────────

export function formatVolume(
  litres: number,
  options: { unit?: 'metric' | 'imperial'; locale?: string } = {},
): string {
  const { unit = 'metric', locale } = options;
  const loc = locale ?? currentLocale;
  if (unit === 'imperial') {
    const gallons = litres * 0.219969;
    return new Intl.NumberFormat(loc, {
      style: 'unit',
      unit: 'gallon',
      unitDisplay: 'short',
      maximumFractionDigits: 2,
    }).format(gallons);
  }
  return new Intl.NumberFormat(loc, {
    style: 'unit',
    unit: 'liter',
    unitDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(litres);
}
