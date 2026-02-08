/**
 * DROP DEAD DESIGN SYSTEM RULES
 * 
 * HARD RULES - VIOLATIONS BREAK VISUAL CONSISTENCY
 * 
 * These rules MUST be followed across all components.
 * Violations will cause visual inconsistencies and synthetic font rendering.
 */

export const TYPOGRAPHY_RULES = {
  // Maximum allowed font weight - NEVER exceed this
  MAX_FONT_WEIGHT: 500,
  
  // ========================================
  // BANNED CLASSES - NEVER USE THESE
  // ========================================
  // These weights are NOT available in Termina or Aeonik Pro.
  // Using them causes synthetic bolding (browser-faked bold).
  PROHIBITED_CLASSES: [
    'font-bold',      // Weight 700 - BANNED - causes synthetic bold
    'font-semibold',  // Weight 600 - BANNED - causes synthetic bold
    'font-extrabold', // Weight 800 - BANNED - causes synthetic bold
    'font-black',     // Weight 900 - BANNED - causes synthetic bold
  ],
  
  // ========================================
  // ALLOWED CLASSES - USE THESE INSTEAD
  // ========================================
  ALLOWED_CLASSES: [
    'font-light',     // Weight 300 - OK
    'font-normal',    // Weight 400 - OK
    'font-medium',    // Weight 500 - OK (MAXIMUM)
  ],
  
  // Font-specific rules
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
      transform: 'normal', // NEVER uppercase
      usage: 'Body text, paragraphs, UI labels, descriptions'
    }
  },
  
  // ========================================
  // EMPHASIS WITHOUT BOLD
  // ========================================
  // When you need visual hierarchy without breaking rules:
  EMPHASIS_ALTERNATIVES: [
    'Use font-display for headlines (automatic uppercase + tracking)',
    'Increase font size (text-lg, text-xl, text-2xl)',
    'Use color contrast (text-foreground vs text-muted-foreground)',
    'Add letter-spacing (tracking-wide, tracking-wider)',
    'Use borders or backgrounds to create visual separation',
  ],
} as const;

/**
 * QUICK REFERENCE:
 * 
 * ❌ BAD:  className="text-2xl font-bold"
 * ✅ GOOD: className="text-2xl font-medium"
 * 
 * ❌ BAD:  className="font-semibold text-foreground"
 * ✅ GOOD: className="font-medium text-foreground"
 * 
 * For headlines/stats:
 * ✅ BEST: className="font-display text-2xl" (uses Termina with proper weight)
 * 
 * For body emphasis:
 * ✅ BEST: className="font-medium text-foreground" (vs text-muted-foreground)
 */

// Type guard to check if a class is prohibited
export function isProhibitedFontWeight(className: string): boolean {
  return TYPOGRAPHY_RULES.PROHIBITED_CLASSES.some(
    prohibited => className.includes(prohibited)
  );
}
