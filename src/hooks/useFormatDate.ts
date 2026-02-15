import { useCallback } from 'react';
import { useOrgDefaults } from '@/hooks/useOrgDefaults';
import { formatDate as formatDateLib } from '@/lib/formatDate';
import {
  formatDate as formatDateUnified,
  formatDateShort as formatDateShortUnified,
  formatRelativeTime as formatRelativeTimeUnified,
} from '@/lib/format';

/**
 * Returns a locale-aware date formatter using the effective org's locale.
 * Use for user-facing dates (e.g. "Jan 15, 2025", "Monday, Mar 3").
 * Keep ISO (yyyy-MM-dd) for API payloads.
 */
export function useFormatDate() {
  const { locale } = useOrgDefaults();

  const formatDate = useCallback(
    (date: Date | string | number, formatStr: string) =>
      formatDateLib(date, formatStr, locale),
    [locale]
  );

  return {
    formatDate,
    formatDateFull: formatDateUnified,
    formatDateShort: formatDateShortUnified,
    formatRelativeTime: formatRelativeTimeUnified,
    locale,
  };
}
