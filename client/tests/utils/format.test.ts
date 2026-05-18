import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatDate,
  formatDateShort,
  formatTime,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatTemperature,
  formatDistance,
  formatVolume,
  setFormatLocale,
  setFormatTemperatureUnit,
  setFormatCurrency,
} from '../../src/utils/format';

beforeEach(() => {
  setFormatLocale('en-GB');
  setFormatTemperatureUnit('celsius');
  setFormatCurrency('GBP');
});

describe('formatDate', () => {
  const date = new Date('2026-05-18T12:00:00Z');

  it('formats in en-GB', () => {
    const result = formatDate(date, { locale: 'en-GB' });
    expect(result).toContain('2026');
    expect(result).toContain('May');
    expect(result).toContain('18');
  });

  it('formats in fr-FR', () => {
    const result = formatDate(date, { locale: 'fr-FR' });
    expect(result).toContain('2026');
    expect(result.toLowerCase()).toContain('mai');
  });

  it('formats in en-US', () => {
    const result = formatDate(date, { locale: 'en-US' });
    expect(result).toContain('2026');
    expect(result).toContain('May');
  });

  it('formats in ar-SA (RTL locale)', () => {
    const result = formatDate(date, { locale: 'ar-SA' });
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('accepts a string date', () => {
    const result = formatDate('2026-05-18', { locale: 'en-GB' });
    expect(result).toContain('2026');
  });

  it('uses module-level locale when no locale provided', () => {
    setFormatLocale('fr-FR');
    const result = formatDate(date);
    expect(result.toLowerCase()).toContain('mai');
  });
});

describe('formatDateShort', () => {
  it('returns short date without year', () => {
    const result = formatDateShort(new Date('2026-05-18T12:00:00Z'), { locale: 'en-GB' });
    expect(result).toContain('18');
    expect(result).toContain('May');
    expect(result).not.toContain('2026');
  });
});

describe('formatTime', () => {
  const date = new Date('2026-05-18T14:30:00Z');

  it('formats 24-hour in en-GB', () => {
    const result = formatTime(date, { locale: 'en-GB', hour12: false, timeZone: 'UTC' });
    expect(result).toMatch(/14[:\s]30/);
  });

  it('formats in fr-FR', () => {
    const result = formatTime(date, { locale: 'fr-FR' });
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('formats in ar-SA', () => {
    const result = formatTime(date, { locale: 'ar-SA' });
    expect(result).toBeTruthy();
  });
});

describe('formatDateTime', () => {
  it('combines date and time', () => {
    const result = formatDateTime(new Date('2026-05-18T14:30:00Z'), { locale: 'en-GB' });
    expect(result).toContain('2026');
    expect(result).toContain('May');
  });
});

describe('formatNumber', () => {
  it('formats with en-GB thousand separators', () => {
    const result = formatNumber(1234567.89, { locale: 'en-GB' });
    expect(result).toContain('1,234,567');
  });

  it('formats with fr-FR separators', () => {
    const result = formatNumber(1234567, { locale: 'fr-FR' });
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('formats in ar-SA', () => {
    const result = formatNumber(42, { locale: 'ar-SA' });
    expect(result).toBeTruthy();
  });
});

describe('formatCurrency', () => {
  it('formats GBP in en-GB', () => {
    const result = formatCurrency(9.99, { currency: 'GBP', locale: 'en-GB' });
    expect(result).toContain('9.99');
    expect(result).toMatch(/£|GBP/);
  });

  it('formats EUR in fr-FR', () => {
    const result = formatCurrency(9.99, { currency: 'EUR', locale: 'fr-FR' });
    expect(result).toContain('9,99');
  });

  it('formats USD in en-US', () => {
    const result = formatCurrency(9.99, { currency: 'USD', locale: 'en-US' });
    expect(result).toContain('$9.99');
  });

  it('uses module-level currency when none specified', () => {
    setFormatCurrency('EUR');
    const result = formatCurrency(10, { locale: 'en-GB' });
    expect(result).toMatch(/€|EUR/);
  });
});

describe('formatTemperature', () => {
  it('formats celsius', () => {
    const result = formatTemperature(20, { unit: 'celsius', locale: 'en-GB' });
    expect(result).toContain('20');
    expect(result).toMatch(/°C|°/);
  });

  it('converts to fahrenheit', () => {
    const result = formatTemperature(0, { unit: 'fahrenheit', locale: 'en-US' });
    expect(result).toContain('32');
  });

  it('converts 100°C to 212°F', () => {
    const result = formatTemperature(100, { unit: 'fahrenheit', locale: 'en-US' });
    expect(result).toContain('212');
  });

  it('uses module-level unit', () => {
    setFormatTemperatureUnit('fahrenheit');
    const result = formatTemperature(0, { locale: 'en-US' });
    expect(result).toContain('32');
  });
});

describe('formatDistance', () => {
  it('formats metres (metric)', () => {
    const result = formatDistance(500, { unit: 'metric', locale: 'en-GB' });
    expect(result).toContain('500');
    expect(result).toMatch(/m/);
  });

  it('formats kilometres (metric)', () => {
    const result = formatDistance(5000, { unit: 'metric', locale: 'en-GB' });
    expect(result).toContain('5');
    expect(result).toMatch(/km/);
  });

  it('formats miles (imperial)', () => {
    const result = formatDistance(1609.344, { unit: 'imperial', locale: 'en-US' });
    expect(result).toContain('1');
    expect(result).toMatch(/mi/);
  });
});

describe('formatVolume', () => {
  it('formats litres (metric)', () => {
    const result = formatVolume(10, { unit: 'metric', locale: 'en-GB' });
    expect(result).toContain('10');
    expect(result).toMatch(/[Ll]/);
  });

  it('formats gallons (imperial)', () => {
    const result = formatVolume(4.54609, { unit: 'imperial', locale: 'en-GB' });
    expect(result).toMatch(/gal/);
  });
});
