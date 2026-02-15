/**
 * i18n bootstrap for Phase 3 multi-language.
 * Language is synced to org settings.defaults.locale via I18nLocaleSync (inside OrganizationProvider).
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';

const DEFAULT_LANG = 'en';

export const SUPPORTED_LANGUAGES = ['en', 'en-GB', 'es', 'fr', 'de'] as const;

i18n.use(initReactI18next).init({
  resources: {
    en,
    'en-GB': en,
    es: en,
    fr: en,
    de: en,
  },
  fallbackLng: DEFAULT_LANG,
  defaultNS: 'common',
  ns: ['common', 'dashboard'],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
