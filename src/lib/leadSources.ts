export const LEAD_SOURCES = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'google', label: 'Google' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'referral_friend', label: 'Referral (Friend/Family)' },
  { value: 'referral_stylist', label: 'Referral (Stylist)' },
  { value: 'walk_in', label: 'Walk-In' },
  { value: 'website', label: 'Website' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
] as const;

export type LeadSourceValue = typeof LEAD_SOURCES[number]['value'];

export function getLeadSourceLabel(value: string | null | undefined): string {
  if (!value) return '';
  const source = LEAD_SOURCES.find(s => s.value === value);
  return source?.label || value;
}

export function isStandardSource(value: string): boolean {
  return LEAD_SOURCES.some(s => s.value === value);
}

/** Color classes for lead source badges */
export const LEAD_SOURCE_COLORS: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800',
  tiktok: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700',
  google: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  yelp: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  facebook: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
  referral_friend: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  referral_stylist: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  walk_in: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  website: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800',
  event: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
  other: 'bg-muted text-muted-foreground border-border',
};

export function getLeadSourceColor(value: string | null | undefined): string {
  if (!value) return LEAD_SOURCE_COLORS.other;
  return LEAD_SOURCE_COLORS[value] || LEAD_SOURCE_COLORS.other;
}
