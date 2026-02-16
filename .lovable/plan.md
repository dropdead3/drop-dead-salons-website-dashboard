

# Fix Synthetic Bolding Across the Platform

## The Problem

Aeonik Pro is only loaded at weights 400 (Regular) and 500 (Medium). Any element using `font-semibold` (600), `font-bold` (700), or higher triggers the browser's synthetic bold algorithm -- producing ugly, inconsistent thickening that breaks the visual identity.

There are currently **1,975 instances** of prohibited weight classes across **164 files**. This is a systemic issue.

## The Fix (Two-Part Strategy)

### Part 1: CSS-Level Guardrail (Immediate Protection)

Add a max font-weight override for `.font-sans` in `index.css`, identical to the existing Termina protection:

```css
.font-sans {
  font-weight: 500 !important;
}
```

Wait -- this would prevent `font-normal` (400) from working. Instead, a smarter approach: cap only the prohibited weights by intercepting the Tailwind utility classes themselves:

```css
/* Prevent synthetic bolding for Aeonik Pro */
.font-sans .font-semibold,
.font-sans.font-semibold,
.font-semibold:where(.font-sans, [class*="font-sans"]) {
  font-weight: 500 !important;
}
```

Actually, the cleanest approach: override the Tailwind weight utilities globally for the two fonts that lack bold weights:

```css
/* Global synthetic bold prevention */
/* Aeonik Pro and Termina max out at 500 */
:root {
  /* These utilities get capped to 500 globally */
}
.font-semibold { font-weight: 500 !important; }
.font-bold { font-weight: 500 !important; }
.font-extrabold { font-weight: 500 !important; }
.font-black { font-weight: 500 !important; }
```

This is safe because:
- Laguna (font-serif) has a bold weight file and uses its own `font-serif` class
- Sloop Script is decorative and never uses bold
- Any future font with bold weights would need its own scoped override, which is the correct pattern

### Part 2: Codebase Cleanup (Phased)

Systematically replace all prohibited classes. This is a large sweep best done in batches:

**Batch 1 -- Dashboard Home and visible components** (what the user sees first):
- `DashboardHome.tsx` -- already clean
- `InsightsNudgeBanner.tsx` -- line 92: `font-semibold` to `font-medium`
- `AIInsightsDrawer.tsx` -- clean
- `AnnouncementsDrawer.tsx` -- clean

**Batch 2 -- High-traffic pages** (settings, analytics, schedule):
- All files in `src/components/dashboard/` with violations
- All files in `src/pages/dashboard/` with violations

**Batch 3 -- Remaining files** across components, pages, and UI

Given the scale (164 files), Part 2 and 3 will be done as a comprehensive sweep, replacing:
- `font-bold` with `font-medium`
- `font-semibold` with `font-medium`
- `font-extrabold` with `font-medium`
- `font-black` with `font-medium`

Exception: `font-bold` inside Laguna (`font-serif`) contexts is allowed and will be preserved.

## File Changes

### Modified: `src/index.css`
Add global CSS overrides that cap `font-semibold`, `font-bold`, `font-extrabold`, and `font-black` to weight 500. This acts as a safety net even if code violations remain.

### Modified: 164 component/page files
Replace all prohibited weight classes with `font-medium`. Laguna/serif contexts excluded.

### Modified: `src/components/dashboard/InsightsNudgeBanner.tsx`
Specific fix: line 92 `font-semibold` to `font-medium` (visible in the screenshot area).

## Why This Approach

The CSS guardrail (Part 1) provides **immediate, universal protection**. Even if a developer accidentally uses `font-bold` in the future, the browser will render weight 500 instead of synthesizing. The codebase cleanup (Part 2) ensures the code itself is correct and doesn't rely on overrides.

## Risk

The global override means if Laguna's `font-bold` is applied without also having `font-serif`, it would get capped. Review will verify Laguna contexts always pair `font-bold` with `font-serif`.
