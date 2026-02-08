
# Fix Top Padding on Notification Preferences Page

## Problem
The Notification Preferences page (`/dashboard/notifications`) is missing the standardized top/side padding that all other dashboard pages use. As shown in your screenshot, the "NOTIFICATION PREFERENCES" heading is too close to the navigation bar.

## Solution
Add the standardized container padding pattern to the NotificationPreferences page.

## Change Required

### File: `src/pages/dashboard/NotificationPreferences.tsx`

**Line 117** - Change from:
```tsx
<div className="space-y-6 max-w-2xl mx-auto">
```

**To:**
```tsx
<div className="p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
```

This adds:
- `p-6` - 24px padding on mobile
- `lg:p-8` - 32px padding on desktop

---

## Design Guideline Update

Add this as a hard rule to the project's design system memory:

**Standardized Dashboard Page Padding Rule:**

All dashboard content pages wrapped in `DashboardLayout` must use the container pattern with top/side padding:

| Container Type | Classes |
|----------------|---------|
| Full-width pages | `p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6` |
| Narrow form pages | `p-6 lg:p-8 max-w-2xl mx-auto space-y-6` |
| Medium content pages | `p-6 lg:p-8 max-w-4xl mx-auto space-y-6` |

**Key rule:** The `p-6 lg:p-8` padding is mandatory for all dashboard pages to ensure content has proper breathing room from edges. Never omit this padding.

---

## Summary
- Single file edit to add padding classes
- Update design memory with hard rule about mandatory page edge padding
