
# Establish Typography Design Rules

## Summary

Formalize two critical typography design rules to ensure brand consistency:
1. **Termina (font-display)**: Never use synthetic bolding (font-bold, font-semibold)
2. **Aeonik Pro (font-sans)**: Never use all-caps (uppercase) - always normal capitalization

---

## Current State

### Termina Rules (Existing)
The Termina font-weight constraint is **already enforced** via CSS:
- `src/index.css:590` forces `font-weight: 500 !important`
- A warning is displayed in the Design System reference page

### Aeonik Pro Rules (Missing Enforcement)
The Aeonik Pro capitalization rule is **documented but not enforced**:
- The Design System page shows "Normal" transform for font-sans
- **No CSS rule prevents uppercase usage**
- Multiple violations exist in the codebase

---

## Implementation

### 1. Update CSS Rules in `src/index.css`

Add a utility rule that resets text-transform for font-sans to prevent uppercase:

```css
/* Aeonik Pro font rules: NEVER uppercase, use normal capitalization */
@layer utilities {
  .font-sans {
    text-transform: none !important;
  }
}
```

This creates a CSS-level enforcement that will override any `uppercase` class when combined with `font-sans`.

### 2. Update Design System Documentation

**File**: `src/pages/dashboard/DesignSystem.tsx`

Add a warning for font-sans similar to the existing font-display warning:

```tsx
{type.class === 'font-sans' && (
  <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/20">
    <p className="text-xs text-amber-600 font-medium">
      ⚠️ NEVER use uppercase with Aeonik Pro. Always use normal capitalization.
    </p>
  </div>
)}
```

### 3. Update Typography Scale Definition

Enhance the typography documentation to be more explicit:

```typescript
const typography = [
  { 
    class: "font-display", 
    font: "Termina", 
    weight: "Medium (500 only)", 
    transform: "UPPERCASE, tracking-wide", 
    usage: "Headlines, buttons, navigation",
    rules: ["NEVER use font-bold or font-semibold", "Always Medium (500) weight"]
  },
  { 
    class: "font-sans", 
    font: "Aeonik Pro", 
    weight: "400-500", 
    transform: "Normal (never uppercase)", 
    usage: "Body text, paragraphs, UI labels",
    rules: ["NEVER use uppercase or all-caps", "Use normal capitalization only"]
  },
  // ... other fonts
];
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add `.font-sans { text-transform: none !important; }` utility rule |
| `src/pages/dashboard/DesignSystem.tsx` | Add warning box for font-sans, update typography rules display |

---

## Violations to Fix (Future Cleanup)

The CSS rule will automatically enforce the design constraint. However, these files contain explicit `font-sans uppercase` combinations that should be reviewed:

| File | Line | Current Pattern | Suggested Fix |
|------|------|-----------------|---------------|
| `BusinessCardRequests.tsx` | ~227 | `font-sans uppercase` | Use `font-display` or remove uppercase |
| `HeadshotRequests.tsx` | ~216 | `font-sans uppercase` | Use `font-display` or remove uppercase |
| `DrinkMenuSection.tsx` | ~73, ~91-94 | `uppercase font-sans` | Use `font-display` for labels |
| `AnnouncementBarManager.tsx` | ~104 | `font-sans uppercase` | Use `font-display` for CTAs |
| `ReportsTabContent.tsx` | ~187-188 | `font-sans uppercase` | Use `font-display` for category labels |

These will be automatically fixed by the CSS rule, but for semantic correctness, components using uppercase text should switch to `font-display` (Termina).

---

## Visual Reference

### Typography Rules Card (Design System Page)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ TYPOGRAPHY                                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  font-display                                           Medium (500)    │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ TERMINA                                                           │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│  Headlines, buttons, navigation                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ NEVER use font-bold or font-semibold. Always use font-medium │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  font-sans                                                    400-500   │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Aeonik Pro                                                        │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│  Body text, paragraphs, UI labels                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ NEVER use uppercase. Always use normal capitalization.       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Enhanced CSS Comment Block

Update the typography comment in index.css for clarity:

```css
/* ===============================================
   TYPOGRAPHY DESIGN RULES (Enforced via CSS)
   ===============================================
   
   1. TERMINA (font-display)
      - Weight: ALWAYS Medium (500) - no synthetic bolding
      - Transform: ALWAYS uppercase with wide tracking
      - Usage: Headlines, buttons, navigation labels
      
   2. AEONIK PRO (font-sans)  
      - Weight: Regular (400) or Medium (500)
      - Transform: ALWAYS normal capitalization - NEVER uppercase
      - Usage: Body text, paragraphs, descriptions, UI labels
      
   3. LAGUNA (font-serif)
      - Weight: Bold (700) only
      - Transform: Normal
      - Usage: Editorial accents (rarely used)
      
   4. SLOOP SCRIPT (font-script)
      - Weight: Regular (400)
      - Transform: Normal
      - Usage: Decorative elements
   
   =============================================== */
```

---

## Implementation Order

1. Add CSS utility rule for font-sans text-transform enforcement
2. Add enhanced typography comment block in index.css
3. Update DesignSystem.tsx with font-sans warning
4. Update typography scale definition with explicit rules
