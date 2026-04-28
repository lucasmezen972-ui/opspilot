type Locale = 'en' | 'fr';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    invalidEmail: 'Invalid email',
    minPassword: 'Minimum 6 characters',
  },
  fr: {
    invalidEmail: 'Email invalide',
    minPassword: '6 caractères minimum',
  },
};

let currentLocale: Locale = 'fr';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function t(key: string): string {
  return translations[currentLocale][key] ?? key;
}
