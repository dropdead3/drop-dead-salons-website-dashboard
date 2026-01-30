
# Eliminate Synthetic Font Bolding Across All Pages

## Summary

Remove all instances of synthetic font bolding throughout the application. The codebase has a strict typography rule that Termina (font-display) must only use Medium (500) weight, and Aeonik Pro (font-sans) should use Regular (400) or Medium (500). Currently, there are 25+ violations across dashboard pages, platform components, markdown renderers, email templates, and canvas contexts.

---

## Problem Analysis

The project has established typography constraints in `src/index.css` and documented in the Design System:

| Font | Class | Allowed Weights | Current Violations |
|------|-------|-----------------|-------------------|
| Termina | `font-display` | 500 only | `font-bold`, `font-semibold` used in 8+ places |
| Aeonik Pro | `font-sans` | 400-500 | `font-bold`, `font-semibold` used in 15+ places |

When browsers encounter a weight request (e.g., 700) for a font that only has Medium (500), they apply **synthetic bolding** - artificially thickening the strokes. This creates visual inconsistency and degrades typography quality.

---

## Scope of Changes

### Category 1: Termina Font Violations (Critical)
Direct violations where `font-bold` or `font-semibold` is applied alongside `font-display`:

| File | Line | Current | Fix |
|------|------|---------|-----|
| `HelpCenter.tsx` | 80 | `font-display font-bold` | Remove `font-bold` |
| `Changelog.tsx` | 345 | `font-display font-bold` | Remove `font-bold` |
| `ChangelogManager.tsx` | 371 | `font-display font-bold` | Remove `font-bold` |
| `PlatformSidebar.tsx` | 79 | `font-display font-semibold` | Remove `font-semibold` |
| `PlatformBrandingTab.tsx` | 173 | `font-display font-semibold` | Remove `font-semibold` |
| `SidebarNavContent.tsx` | 302 | `font-display font-bold` | Remove `font-bold` |
| `AccountManagement.tsx` | 162 | `'bold 60px Termina'` (canvas) | Change to `'500 60px Termina'` |

### Category 2: Markdown/Content Renderers
Components that inject bold classes into dynamically rendered content:

| File | Lines | Current | Fix |
|------|-------|---------|-----|
| `HelpArticleView.tsx` | 23-25 | H1: `font-bold`, H2-H3: `font-semibold` | H1: `font-medium`, H2-H3: `font-medium` |
| `AgreementEditor.tsx` | 314-318 | H1: `font-bold`, H2-H3: `font-semibold` | H1: `font-medium`, H2-H3: `font-medium` |
| `FormPreviewDialog.tsx` | 26-32 | H1: `font-bold`, H2-H3: `font-semibold` | H1: `font-medium`, H2-H3: `font-medium` |
| `FormSigningDialog.tsx` | 92-98 | H1: `font-bold`, H2-H3: `font-semibold` | H1: `font-medium`, H2-H3: `font-medium` |

### Category 3: UI Component Weights
General UI components using bold weights for emphasis:

| File | Line | Current | Fix |
|------|------|---------|-----|
| `ConfirmStep.tsx` | 191 | `text-xl font-bold` | `text-xl font-medium` |
| `ConfirmStep.tsx` | 194 | `font-semibold` | `font-medium` |
| `PlanSelector.tsx` | 44 | `font-semibold` | `font-medium` |
| `PlanSelector.tsx` | 47 | `font-bold` | `font-medium` |
| `InvoicePreview.tsx` | 121 | `font-bold` | `font-medium` |
| `CapacityBreakdown.tsx` | 183-184 | `font-semibold`, `font-bold` | `font-medium` for both |
| `PlatformPageHeader.tsx` | 41 | `font-bold` | `font-medium` |
| `LocationPreviewModal.tsx` | 27 | `font-semibold` | `font-medium` |

### Category 4: Email Templates (Lower Priority)
Email templates use inline styles - these affect email rendering only, not the main app. Email clients handle fonts differently, so `font-weight: bold` may be acceptable here:

| File | Lines | Context | Decision |
|------|-------|---------|----------|
| `EmailTemplateEditor.tsx` | 666-667 | Button styles | Keep for email compatibility |
| Edge functions | Various | Email HTML | Keep for email compatibility |
| `Extensions.tsx` | 516-518 | Print stylesheet | Keep for print rendering |

---

## Files to Modify

### Dashboard Pages
| File | Changes |
|------|---------|
| `src/pages/dashboard/HelpCenter.tsx` | Remove `font-bold` from h1 |
| `src/pages/dashboard/Changelog.tsx` | Remove `font-bold` from h1 |
| `src/pages/dashboard/admin/ChangelogManager.tsx` | Remove `font-bold` from h1 |
| `src/pages/dashboard/admin/AccountManagement.tsx` | Fix canvas font declaration |

### Platform Components
| File | Changes |
|------|---------|
| `src/components/platform/layout/PlatformSidebar.tsx` | Remove `font-semibold` |
| `src/components/platform/settings/PlatformBrandingTab.tsx` | Remove `font-semibold` |
| `src/components/platform/billing/PlanSelector.tsx` | Replace bold with medium |
| `src/components/platform/billing/InvoicePreview.tsx` | Replace bold with medium |
| `src/components/platform/ui/PlatformPageHeader.tsx` | Replace bold with medium |

### Dashboard Components
| File | Changes |
|------|---------|
| `src/components/dashboard/SidebarNavContent.tsx` | Remove `font-bold` |
| `src/components/dashboard/LocationPreviewModal.tsx` | Replace semibold with medium |
| `src/components/dashboard/help/HelpArticleView.tsx` | Update markdown header classes |
| `src/components/dashboard/day-rate/AgreementEditor.tsx` | Update rendered header classes |
| `src/components/dashboard/forms/FormPreviewDialog.tsx` | Update header classes |
| `src/components/dashboard/forms/FormSigningDialog.tsx` | Update header classes |
| `src/components/dashboard/schedule/booking/ConfirmStep.tsx` | Replace bold/semibold |
| `src/components/dashboard/analytics/CapacityBreakdown.tsx` | Replace bold/semibold |

---

## Implementation Strategy

### Phase 1: Critical Termina Fixes
Fix all instances where bold is explicitly combined with `font-display`:
1. Remove `font-bold`/`font-semibold` from Termina elements
2. Fix canvas context font declarations

### Phase 2: Markdown Renderers
Update all simple markdown parsers to use `font-medium` instead of `font-bold`:
1. HelpArticleView
2. AgreementEditor
3. FormPreviewDialog
4. FormSigningDialog

### Phase 3: UI Components
Replace `font-bold` and `font-semibold` with `font-medium` across:
1. Booking confirmation
2. Platform billing components
3. Analytics components
4. Modal headers

---

## Design Consideration

The switch from `font-bold` (700) to `font-medium` (500) will result in slightly lighter text. This is intentional and maintains brand consistency. For visual hierarchy, rely on:
- **Size**: Use larger text sizes for emphasis
- **Color**: Use primary/foreground colors for important elements
- **Spacing**: Use increased letter-spacing (already applied to Termina)

---

## What Will NOT Change

The following will be preserved as-is:
1. **Email templates**: `font-weight: bold` in email HTML is acceptable since email clients use system fonts
2. **Print stylesheets**: Bold weights for printed materials remain unchanged
3. **Edge function emails**: Server-generated HTML emails retain bold styling

---

## Technical Notes

### Why CSS !important Isn't Enough
The global CSS rule in `index.css:616`:
```css
.font-display {
  font-weight: 500 !important;
}
```

This prevents synthetic bolding for Termina, BUT:
- It doesn't prevent `font-bold` classes on Aeonik Pro elements
- It doesn't fix canvas context font declarations (browser API bypasses CSS)
- It creates misleading code where `font-bold` appears but does nothing

### Canvas Font Declaration Fix
Canvas API requires explicit font strings:
```typescript
// Before (synthetic bold)
ctx.font = 'bold 60px Termina, sans-serif';

// After (correct weight)
ctx.font = '500 60px Termina, sans-serif';
```

---

## Validation Checklist

After implementation, verify:
- [ ] No `font-bold` or `font-semibold` combined with `font-display`
- [ ] All markdown renderers use `font-medium` for headers
- [ ] Canvas font declarations use numeric weights
- [ ] Visual hierarchy is maintained via size/color
- [ ] No browser console warnings about missing font weights

