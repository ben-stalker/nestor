import i18n from 'i18next';
import FsBackend from 'i18next-fs-backend';
import path from 'path';

const localesPath = path.join(__dirname, '../../client/public/locales');

void i18n.use(FsBackend).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  backend: {
    loadPath: path.join(localesPath, '{{lng}}/{{ns}}.json'),
  },
  interpolation: { escapeValue: false },
});

export default i18n;

/** Change active language (used when language setting changes). */
export async function setServerLanguage(lang: string): Promise<void> {
  await i18n.changeLanguage(lang);
}

/** Translate a key using the current server language. */
export function t(key: string, options?: Record<string, unknown>): string {
  // i18n.t returns string | string[] — cast needed until @types/i18next are tighter
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return String(i18n.t(key, options));
}
