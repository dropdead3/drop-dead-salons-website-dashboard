/**
 * Shape of organization.settings.defaults (locale, currency, timezone).
 * Used by platform AccountSettingsTab and dashboard formatting (formatCurrency, etc.).
 * Fallbacks when missing: currency USD, timezone America/New_York, locale en.
 */
export interface OrgDefaults {
  currency?: string;
  timezone?: string;
  locale?: string;
}

export const ORG_DEFAULTS_FALLBACKS: Required<OrgDefaults> = {
  currency: 'USD',
  timezone: 'America/New_York',
  locale: 'en',
};

export function getOrgDefaults(settings: unknown): OrgDefaults {
  if (!settings || typeof settings !== 'object') return {};
  const d = (settings as Record<string, unknown>).defaults;
  if (!d || typeof d !== 'object') return {};
  const defs = d as Record<string, unknown>;
  return {
    currency: typeof defs.currency === 'string' ? defs.currency : undefined,
    timezone: typeof defs.timezone === 'string' ? defs.timezone : undefined,
    locale: typeof defs.locale === 'string' ? defs.locale : undefined,
  };
}
