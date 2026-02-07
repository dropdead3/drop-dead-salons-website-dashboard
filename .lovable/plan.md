

# Fix Synthetic Bold Fonts & Reinforce Typography Rules

## Issue Identified

The screenshot shows synthetic bold fonts being applied to text throughout the Payroll Provider Hub. This violates the established design system rules which specify:

- **font-display (Termina)**: Max weight is 500 (medium) only. NEVER use font-bold or font-semibold
- **font-sans (Aeonik Pro)**: Weight 400-500 only. NEVER use uppercase or all-caps

The following components are using prohibited font weights:

| File | Violations |
|------|------------|
| `ProviderCard.tsx` | Lines 65, 141, 161, 189, 196 (`font-semibold`, `font-bold`) |
| `PayrollProviderHub.tsx` | Lines 32, 78 (`font-semibold`, `font-bold`) |
| `ProviderDetailSheet.tsx` | Lines 49, 73, 97, 114, 130, 139, 153 (`font-semibold`, `font-bold`) |
| `PayrollKPICards.tsx` | Line 63 (`font-bold`) |
| `TeamCompensationTable.tsx` | Lines 122, 126, 132, 138, 219 (`font-semibold`, `font-bold`) |
| `CommissionInsights.tsx` | Lines 73, 87, 104, 153, 168, 182, 197 (`font-semibold`, `font-bold`) |

---

## Solution

### 1. Create Design Guide Rule File

Create a new documentation file that codifies typography rules for reference during development:

**New File: `src/lib/design-rules.ts`**

```typescript
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
```

### 2. Update Design System Page

Enhance the existing typography documentation in `DesignSystem.tsx` with a visual warning banner:

```typescript
// Add to the typography section
<div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
  <p className="text-sm text-destructive font-medium">
    CRITICAL RULE: Never use font-bold or font-semibold. 
    Maximum weight is font-medium (500).
  </p>
</div>
```

### 3. Fix All Violating Components

Replace all prohibited font weights with `font-medium`:

---

#### `src/components/dashboard/payroll/providers/ProviderCard.tsx`

| Line | Before | After |
|------|--------|-------|
| 65 | `font-semibold` | `font-medium` |
| 141 | `font-bold` | `font-medium` |
| 161 | `font-medium` | (already correct) |
| 189 | `font-bold` | `font-medium` |
| 196 | `font-semibold` | `font-medium` |

---

#### `src/components/dashboard/payroll/providers/PayrollProviderHub.tsx`

| Line | Before | After |
|------|--------|-------|
| 32 | `font-semibold` | `font-medium` |
| 78 | `font-bold` | `font-medium tracking-tight` |

---

#### `src/components/dashboard/payroll/providers/ProviderDetailSheet.tsx`

| Line | Before | After |
|------|--------|-------|
| 49 | `font-medium` | (already correct) |
| 73 | `font-semibold` | `font-medium` |
| 97 | `font-semibold` | `font-medium` |
| 114 | `font-semibold` | `font-medium` |
| 130 | `font-semibold` | `font-medium` |
| 139 | `font-bold` | `font-medium` |
| 153 | `font-semibold` | `font-medium` |

---

#### `src/components/dashboard/payroll/analytics/PayrollKPICards.tsx`

| Line | Before | After |
|------|--------|-------|
| 63 | `font-bold` | `font-medium` |

---

#### `src/components/dashboard/payroll/analytics/TeamCompensationTable.tsx`

| Line | Before | After |
|------|--------|-------|
| 122 | `font-semibold` | `font-medium` |
| 126 | `font-semibold` | `font-medium` |
| 132 | `font-semibold` | `font-medium` |
| 138 | `font-bold` | `font-medium` |
| 219 | `font-bold` | `font-medium` |

---

#### `src/components/dashboard/payroll/CommissionInsights.tsx`

| Line | Before | After |
|------|--------|-------|
| 73 | `font-bold` | `font-medium` |
| 87 | `font-bold` | `font-medium` |
| 104 | `font-bold` | `font-medium` |
| 153 | `font-semibold` | `font-medium` |
| 168 | `font-bold` | `font-medium` |
| 182 | `font-semibold` | `font-medium` |
| 197 | `font-bold` | `font-medium` |

---

## Visual Hierarchy Without Bold

To maintain visual distinction without synthetic bold:

| Technique | Example |
|-----------|---------|
| Size | Use `text-lg`, `text-xl`, `text-2xl` for emphasis |
| Color | Use `text-foreground` vs `text-muted-foreground` |
| Tracking | Add `tracking-wide` or `tracking-wider` for display text |
| Spacing | Use larger margins/padding around important text |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/design-rules.ts` | Codified typography rules for reference |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/payroll/providers/ProviderCard.tsx` | Replace font-bold/semibold with font-medium |
| `src/components/dashboard/payroll/providers/PayrollProviderHub.tsx` | Replace font-bold/semibold with font-medium |
| `src/components/dashboard/payroll/providers/ProviderDetailSheet.tsx` | Replace font-bold/semibold with font-medium |
| `src/components/dashboard/payroll/analytics/PayrollKPICards.tsx` | Replace font-bold with font-medium |
| `src/components/dashboard/payroll/analytics/TeamCompensationTable.tsx` | Replace font-bold/semibold with font-medium |
| `src/components/dashboard/payroll/CommissionInsights.tsx` | Replace font-bold/semibold with font-medium |
| `src/pages/dashboard/DesignSystem.tsx` | Add visual warning banner for typography rules |

---

## Memory Update

The existing memory note `style/typography-constraints` already documents this rule. This implementation reinforces it with:
1. A dedicated design rules file for programmatic reference
2. Visual warning in the Design System page
3. All current violations fixed

