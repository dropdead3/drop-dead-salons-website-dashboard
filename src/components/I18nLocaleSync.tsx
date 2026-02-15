import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrgDefaults } from '@/hooks/useOrgDefaults';
import i18n, { SUPPORTED_LANGUAGES } from '@/i18n';

/**
 * Syncs i18n language to org settings.defaults.locale.
 * Renders nothing. Place inside OrganizationProvider.
 */
export function I18nLocaleSync() {
  const { locale } = useOrgDefaults();
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    const lang = SUPPORTED_LANGUAGES.includes(locale as (typeof SUPPORTED_LANGUAGES)[number])
      ? locale
      : locale.split('-')[0];
    if (i18nInstance.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [locale, i18nInstance]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return null;
}
