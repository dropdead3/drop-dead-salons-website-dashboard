/**
 * Locale-aware date formatting for display.
 * Uses date-fns with org locale. Keep ISO (yyyy-MM-dd) for APIs; use this for user-facing dates.
 */
import { format as dateFnsFormat, parseISO, type Locale } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { enGB } from 'date-fns/locale';
import { es } from 'date-fns/locale';
import { fr } from 'date-fns/locale';
import { de } from 'date-fns/locale';

const DEFAULT_LOCALE = 'en';

/** Map org locale code to date-fns locale object. */
const LOCALE_MAP: Record<string, Locale> = {
  en: enUS,
  'en-US': enUS,
  'en-GB': enGB,
  es,
  fr,
  de,
};

function getDateFnsLocale(localeCode: string): Locale {
  return LOCALE_MAP[localeCode] ?? enUS;
}

/**
 * Format a date for display using the given locale.
 * @param date - Date, ISO string, or timestamp
 * @param formatStr - date-fns format string (e.g. 'MMM d, yyyy', 'EEEE, MMM d')
 * @param locale - Org locale (e.g. 'en', 'en-GB', 'es'). Defaults to 'en'.
 */
export function formatDate(
  date: Date | string | number,
  formatStr: string,
  locale: string = DEFAULT_LOCALE
): string {
  const d = date instanceof Date
    ? date
    : typeof date === 'string'
      ? parseISO(date)
      : new Date(date);
  const loc = getDateFnsLocale(locale);
  return dateFnsFormat(d, formatStr, { locale: loc });
}
