

# Remove Synthetic Bolding Across Entire Codebase

## Overview

This plan addresses the **2,104 violations** of the typography design system across **146 files**. All instances of `font-bold`, `font-semibold`, `font-extrabold`, and `font-black` will be replaced with `font-medium` (the maximum allowed weight of 500) to eliminate synthetic font rendering.

---

## The Problem

The Drop Dead design system uses **Termina** and **Aeonik Pro** fonts, which only support weights up to 500. When CSS requests a higher weight (600-900), the browser synthesizes a fake bold by artificially thickening the characters. This causes:

- Blurry, poorly-rendered text
- Inconsistent appearance across browsers
- Degraded typography aesthetics

---

## Current State

| Class | Weight | Matches | Status |
|-------|--------|---------|--------|
| `font-bold` | 700 | ~1,014 | BANNED |
| `font-semibold` | 600 | ~1,110 | BANNED |
| `font-extrabold` | 800 | 0 (only in rules file) | BANNED |
| `font-black` | 900 | 0 (only in rules file) | BANNED |

### Affected File Categories

| Location | Files | Approx. Violations |
|----------|-------|---------------------|
| `src/pages/` | ~35 files | ~617 |
| `src/components/dashboard/` | ~45 files | ~700 |
| `src/components/platform/` | ~15 files | ~200 |
| `src/components/` (other) | ~35 files | ~400 |
| `src/components/ui/` | 0 files | 0 (clean) |

---

## Replacement Strategy

All prohibited classes will be replaced with `font-medium`:

```text
font-bold      → font-medium
font-semibold  → font-medium
font-extrabold → font-medium
font-black     → font-medium
```

### Alternative Emphasis Techniques

For cases where emphasis is still needed without bold, the following patterns should be used:

1. **Font size increase**: `text-lg`, `text-xl`, `text-2xl`
2. **Color contrast**: `text-foreground` vs `text-muted-foreground`
3. **Display font**: `font-display` for headlines (Termina with tracking)
4. **Letter spacing**: `tracking-wide`, `tracking-wider`

---

## Enhanced Design Rules

Update `src/lib/design-rules.ts` with enforcement utilities:

```typescript
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
```

---

## Files to Modify

Due to the scale (146 files), the work will be organized by category:

### Phase 1: Pages (~35 files)
All files in `src/pages/` directory

### Phase 2: Dashboard Components (~45 files)
All files in `src/components/dashboard/`

### Phase 3: Platform Components (~15 files)
All files in `src/components/platform/`

### Phase 4: Other Components (~35 files)
Remaining component files

### Phase 5: Design Rules
Update `src/lib/design-rules.ts` with enhanced documentation

---

## Notable Patterns to Fix

### Stat Cards (most common pattern)
```typescript
// Before
<p className="text-2xl font-bold">{count}</p>

// After
<p className="text-2xl font-medium">{count}</p>
// Or even better for stats:
<p className="text-2xl font-display">{count}</p>
```

### Page Titles
```typescript
// Before
<h1 className="text-2xl font-bold">Page Title</h1>

// After
<h1 className="text-2xl font-display">Page Title</h1>
// Or
<h1 className="text-2xl font-medium">Page Title</h1>
```

### Card Headings
```typescript
// Before
<h3 className="font-semibold">Card Title</h3>

// After
<h3 className="font-medium">Card Title</h3>
```

### Table Headers / Labels
```typescript
// Before
<span className="font-semibold">Label</span>

// After
<span className="font-medium">Label</span>
```

---

## Implementation Approach

For each file:
1. Search for `font-bold` → Replace with `font-medium`
2. Search for `font-semibold` → Replace with `font-medium`
3. For stat numbers and headlines, consider using `font-display` instead for better visual hierarchy

---

## Summary

| Metric | Value |
|--------|-------|
| Total violations | ~2,104 |
| Files affected | ~146 |
| Replacement | `font-bold/semibold` → `font-medium` |
| UI components | Already clean (0 violations) |

This is a large-scale refactor that will ensure consistent, high-quality typography across the entire application by eliminating all synthetic font rendering.

