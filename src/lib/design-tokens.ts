/**
 * ZURA DESIGN TOKEN SYSTEM
 * 
 * Importable, composable class-string constants that encode the full design system.
 * Every new component should use these tokens instead of raw class strings.
 * 
 * Usage:
 *   import { tokens } from '@/lib/design-tokens';
 *   <h1 className={tokens.heading.page}>Revenue</h1>
 *   <p className={cn(tokens.stat.large, isNegative && 'text-destructive')}>$12,400</p>
 */

export const tokens = {
  // ========================================
  // TYPOGRAPHY TOKENS
  // ========================================
  heading: {
    /** Page-level title: Termina, 2xl, medium, tracked */
    page: 'font-display text-2xl font-medium tracking-wide',
    /** Section header inside a page: Termina, base, uppercase, tracked */
    section: 'font-display text-base font-medium tracking-wide uppercase',
    /** Card title: Termina, base, tracked */
    card: 'font-display text-base font-medium tracking-wide',
    /** Small subsection label: uppercase, tiny, muted */
    subsection: 'text-xs font-medium text-muted-foreground uppercase tracking-[0.15em]',
  },

  body: {
    /** Default body text */
    default: 'font-sans text-sm text-foreground',
    /** Muted/secondary body text */
    muted: 'font-sans text-sm text-muted-foreground',
    /** Emphasized body text (font-medium, not bold) */
    emphasis: 'font-sans text-sm font-medium text-foreground',
  },

  label: {
    /** Standard form/UI label */
    default: 'font-sans text-sm font-medium',
    /** Tiny uppercase label (badges, metadata) */
    tiny: 'font-sans text-[10px] font-medium text-muted-foreground uppercase tracking-wider',
  },

  stat: {
    /** Large stat value (dashboard KPIs) */
    large: 'font-display text-2xl font-medium',
    /** Extra-large stat value (hero metrics) */
    xlarge: 'font-display text-3xl font-medium',
  },

  // ========================================
  // LAYOUT TOKENS
  // ========================================
  layout: {
    /** Standard page container with responsive padding */
    pageContainer: 'px-6 lg:px-8 py-8 max-w-[1600px] mx-auto',
    /** Card base styling */
    cardBase: 'rounded-2xl shadow-2xl',
    /** Standard card padding */
    cardPadding: 'p-6',
  },

  // ========================================
  // STATUS TOKENS (appointment/booking states)
  // ========================================
  status: {
    booked: 'bg-slate-100 text-slate-700',
    confirmed: 'bg-green-100 text-green-800',
    checked_in: 'bg-blue-100 text-blue-800',
    completed: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-gray-100 text-gray-600',
    no_show: 'bg-red-100 text-red-800',
  },

  // ========================================
  // EMPTY STATE TOKENS
  // ========================================
  empty: {
    /** Centered empty state wrapper */
    container: 'text-center py-14',
    /** Ghosted icon */
    icon: 'w-12 h-12 mx-auto mb-4 opacity-20',
    /** Empty state heading */
    heading: 'font-medium text-lg mb-2',
    /** Empty state description */
    description: 'text-sm text-muted-foreground',
  },

  // ========================================
  // LOADING STATE TOKENS
  // ========================================
  loading: {
    /** Standard spinner */
    spinner: 'h-8 w-8 animate-spin text-muted-foreground',
    /** Skeleton row */
    skeleton: 'h-14 w-full',
  },
} as const;

/**
 * Helper to get the right token for a common UI context.
 * 
 * @example
 *   getTokenFor('page-title')  // => tokens.heading.page
 *   getTokenFor('stat')        // => tokens.stat.large
 */
export function getTokenFor(context: 
  | 'page-title' 
  | 'section-title' 
  | 'card-title'
  | 'subsection-title'
  | 'body' 
  | 'body-muted'
  | 'body-emphasis'
  | 'label'
  | 'label-tiny'
  | 'stat'
  | 'stat-xl'
  | 'empty-heading'
  | 'empty-description'
): string {
  const map: Record<string, string> = {
    'page-title': tokens.heading.page,
    'section-title': tokens.heading.section,
    'card-title': tokens.heading.card,
    'subsection-title': tokens.heading.subsection,
    'body': tokens.body.default,
    'body-muted': tokens.body.muted,
    'body-emphasis': tokens.body.emphasis,
    'label': tokens.label.default,
    'label-tiny': tokens.label.tiny,
    'stat': tokens.stat.large,
    'stat-xl': tokens.stat.xlarge,
    'empty-heading': tokens.empty.heading,
    'empty-description': tokens.empty.description,
  };
  return map[context] ?? tokens.body.default;
}
