/**
 * DROP DEAD DESIGN SYSTEM RULES
 * 
 * HARD RULES - VIOLATIONS BREAK VISUAL CONSISTENCY
 * 
 * These rules MUST be followed across all components.
 * Violations will cause visual inconsistencies and synthetic font rendering.
 * 
 * For importable class-string constants, use:
 *   import { tokens, getTokenFor } from '@/lib/design-tokens';
 */

// Re-export the token system for convenience
export { tokens, getTokenFor } from './design-tokens';

export const TYPOGRAPHY_RULES = {
  MAX_FONT_WEIGHT: 500,
  
  PROHIBITED_CLASSES: [
    'font-bold',      // Weight 700 - BANNED
    'font-semibold',  // Weight 600 - BANNED
    'font-extrabold', // Weight 800 - BANNED
    'font-black',     // Weight 900 - BANNED
  ],
  
  ALLOWED_CLASSES: [
    'font-light',     // Weight 300
    'font-normal',    // Weight 400
    'font-medium',    // Weight 500 - MAXIMUM
  ],
  
  FONT_RULES: {
    'font-display': {
      font: 'Termina',
      maxWeight: 500,
      transform: 'uppercase',
      letterSpacing: '0.08em',
      usage: 'Headlines, buttons, navigation, stats'
    },
    'font-sans': {
      font: 'Aeonik Pro',
      maxWeight: 500,
      transform: 'normal',
      usage: 'Body text, paragraphs, UI labels, descriptions'
    }
  },
  
  EMPHASIS_ALTERNATIVES: [
    'Use font-display for headlines (automatic uppercase + tracking)',
    'Increase font size (text-lg, text-xl, text-2xl)',
    'Use color contrast (text-foreground vs text-muted-foreground)',
    'Add letter-spacing (tracking-wide, tracking-wider)',
    'Use borders or backgrounds to create visual separation',
    'Import tokens from @/lib/design-tokens for consistent class strings',
    'KPI tile labels MUST use tokens.kpi.label (Termina) — never font-sans for uppercase metric labels',
  ],
} as const;

export function isProhibitedFontWeight(className: string): boolean {
  return TYPOGRAPHY_RULES.PROHIBITED_CLASSES.some(
    prohibited => className.includes(prohibited)
  );
}
