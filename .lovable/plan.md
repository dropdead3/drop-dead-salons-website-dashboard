
# Fix Missing Padding on FeedbackHub Page

## Problem
The FeedbackHub page (`/dashboard/admin/feedback`) is missing container padding, causing content to touch the viewport edges. This is visible in the screenshot where the header and cards have no breathing room.

## Root Cause
The page wraps content in `<div className="space-y-6">` but omits the standard padding classes used by all other dashboard admin pages.

## Current State
```tsx
<DashboardLayout>
  <div className="space-y-6">  {/* Missing padding! */}
    {/* content */}
  </div>
</DashboardLayout>
```

## Fix
Apply the standardized dashboard admin page pattern:

```tsx
<DashboardLayout>
  <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
    {/* content */}
  </div>
</DashboardLayout>
```

## Standard Dashboard Page Layout Pattern

Based on codebase analysis, dashboard admin pages follow this consistent pattern:

| Classes | Purpose |
|---------|---------|
| `p-6` | Base padding (24px) on mobile |
| `lg:p-8` | Increased padding (32px) on desktop |
| `max-w-[1600px]` | Maximum content width |
| `mx-auto` | Center the container |
| `space-y-6` or `space-y-8` | Vertical spacing between sections |

## File to Modify

| File | Change |
|------|--------|
| `src/pages/dashboard/admin/FeedbackHub.tsx` | Add `p-6 lg:p-8 max-w-[1600px] mx-auto` to container div |

## Implementation
Update line 24 from:
```tsx
<div className="space-y-6">
```
To:
```tsx
<div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
```

---

## Prevention Note
For future pages, the standard wrapper pattern for dashboard admin pages should always be:

```tsx
<DashboardLayout>
  <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
    {/* Header */}
    {/* Content */}
  </div>
</DashboardLayout>
```
