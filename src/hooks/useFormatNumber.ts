import { useCallback } from 'react';
import { useOrgDefaults } from '@/hooks/useOrgDefaults';
import { formatNumber as formatNumberLib, formatPercent as formatPercentLib } from '@/lib/formatNumber';

/**
 * Returns locale-aware number formatters using the effective org's locale.
 * Use for counts, percentages, and other non-currency numbers so grouping matches locale.
 */
export function useFormatNumber() {
  const { locale } = useOrgDefaults();

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumberLib(value, locale, options),
    [locale]
  );

  const formatPercent = useCallback(
    (value: number, wholeNumber: boolean = true) =>
      formatPercentLib(value, locale, wholeNumber),
    [locale]
  );

  return { formatNumber, formatPercent, locale };
}
