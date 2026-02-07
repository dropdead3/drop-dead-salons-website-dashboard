/**
 * DROP DEAD DESIGN SYSTEM RULES
 * 
 * These rules MUST be followed across all components.
 * Violations will cause visual inconsistencies and synthetic font rendering.
 */

export const TYPOGRAPHY_RULES = {
  // Maximum allowed font weight - NEVER exceed this
  MAX_FONT_WEIGHT: 500,
  
  // Prohibited classes - NEVER use these
  PROHIBITED_CLASSES: [
    'font-bold',      // Weight 700 - BANNED
    'font-semibold',  // Weight 600 - BANNED
    'font-extrabold', // Weight 800 - BANNED
    'font-black',     // Weight 900 - BANNED
  ],
  
  // Allowed weight classes
  ALLOWED_CLASSES: [
    'font-normal',    // Weight 400 - OK
    'font-medium',    // Weight 500 - OK (maximum)
    'font-light',     // Weight 300 - OK
  ],
  
  // Font-specific rules
  FONT_RULES: {
    'font-display': {
      font: 'Termina',
      maxWeight: 500,
      transform: 'uppercase',
      letterSpacing: '0.08em',
      note: 'Headlines, buttons, navigation'
    },
    'font-sans': {
      font: 'Aeonik Pro',
      maxWeight: 500,
      transform: 'normal', // NEVER uppercase
      note: 'Body text, paragraphs, UI labels'
    }
  }
} as const;

/**
 * Use this instead of font-bold/font-semibold:
 * 
 * BAD:  className="font-bold text-lg"
 * GOOD: className="font-medium text-lg"
 * 
 * For emphasis without bold:
 * - Use larger font size (text-lg, text-xl)
 * - Use color contrast (text-foreground vs text-muted-foreground)
 * - Use letter-spacing (tracking-wide)
 */
