
## Dark Mode Color Fix Plan

This plan addresses multiple dashboard components that have incorrect colors in dark mode due to hardcoded light colors, low-opacity backgrounds, and missing dark mode variants.

---

### Issues Identified

Based on the screenshot and code analysis, the following elements have incorrect colors in dark mode:

| Component | Issue | Location |
|-----------|-------|----------|
| Select Dropdowns | `bg-background` not properly inheriting dark theme | All select triggers on dashboard |
| Announcements Filter | Select trigger appears washed out | `AnnouncementsBento.tsx:98` |
| Analytics Filter Bar | Location and date selects appear faded | `AnalyticsFilterBar.tsx:70, 95` |
| Sales Overview Icon | `bg-primary/10` too faint on dark background | `AggregateSalesCard.tsx:274` |
| Hiring Capacity Badge | `text-black` hardcoded for medium priority | `HiringCapacityCard.tsx:40` |
| Schedule Month View | Hardcoded light backgrounds (`bg-green-50`, `bg-slate-50`, etc.) | `MonthView.tsx:132-137` |

---

### Root Cause

The dashboard uses scoped dark mode via a `.dark` class on a wrapper div in `DashboardLayout.tsx`. While CSS variables are properly defined for `.dark` mode in `index.css`, some components use:

1. **Hardcoded colors** (e.g., `text-black`, `bg-white`, `bg-green-50`)
2. **Low opacity overlays** that become invisible on dark backgrounds (e.g., `bg-primary/10`)
3. **Light-only Tailwind color utilities** without dark mode variants

---

### Solution Approach

Replace hardcoded and light-only colors with:
- **CSS variable-based colors** that adapt to theme (e.g., `bg-muted`, `bg-accent`)
- **Dark mode variants** where specific colors are needed (e.g., `bg-green-50 dark:bg-green-950`)
- **Higher opacity values** for overlays on dark backgrounds (e.g., `bg-primary/10` to `bg-primary/15` or use `bg-accent`)

---

### Changes by File

#### 1. `src/components/dashboard/AggregateSalesCard.tsx`
**Line 274**: Change icon background from `bg-primary/10` to a theme-aware color

```tsx
// Before
<div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-lg">

// After  
<div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
```

---

#### 2. `src/components/dashboard/HiringCapacityCard.tsx`
**Lines 38-40**: Replace hardcoded `text-white` and `text-black` with foreground variables

```tsx
// Before
case 'high':
  return 'bg-orange-500 text-white';
case 'medium':
  return 'bg-chart-4 text-black';

// After
case 'high':
  return 'bg-orange-500 text-orange-50';
case 'medium':
  return 'bg-chart-4 text-chart-4-foreground dark:text-background';
```

Since `chart-4` doesn't have a foreground variable, we'll use `text-foreground` with a dark mode override:

```tsx
case 'medium':
  return 'bg-chart-4 text-foreground dark:text-background';
```

---

#### 3. `src/components/dashboard/schedule/MonthView.tsx`
**Lines 132-137**: Add dark mode variants for appointment status backgrounds

```tsx
// Before
apt.status === 'confirmed' && 'border-l-green-500 bg-green-50',
apt.status === 'booked' && 'border-l-slate-400 bg-slate-50',
apt.status === 'checked_in' && 'border-l-blue-500 bg-blue-50',
apt.status === 'completed' && 'border-l-purple-500 bg-purple-50',
apt.status === 'cancelled' && 'border-l-gray-300 bg-gray-50 opacity-60',
apt.status === 'no_show' && 'border-l-red-500 bg-red-50',

// After
apt.status === 'confirmed' && 'border-l-green-500 bg-green-50 dark:bg-green-950/50',
apt.status === 'booked' && 'border-l-slate-400 bg-slate-50 dark:bg-slate-900/50',
apt.status === 'checked_in' && 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/50',
apt.status === 'completed' && 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/50',
apt.status === 'cancelled' && 'border-l-gray-300 bg-gray-50 dark:bg-gray-900/50 opacity-60',
apt.status === 'no_show' && 'border-l-red-500 bg-red-50 dark:bg-red-950/50',
```

---

#### 4. `src/components/dashboard/AnnouncementsBento.tsx`
**Line 98**: Ensure SelectTrigger uses proper border for visibility in dark mode

```tsx
// Before
<SelectTrigger className="h-7 w-[130px] text-xs">

// After
<SelectTrigger className="h-7 w-[130px] text-xs border-border">
```

---

#### 5. `src/components/dashboard/AnalyticsFilterBar.tsx`
**Lines 70 and 95**: Add explicit border styling for better dark mode visibility

```tsx
// Line 70 - Before
<SelectTrigger className="h-9 w-auto min-w-[180px] text-sm">

// Line 70 - After
<SelectTrigger className="h-9 w-auto min-w-[180px] text-sm border-border">

// Line 95 - Before  
<SelectTrigger className="h-9 w-auto min-w-[160px] text-sm">

// Line 95 - After
<SelectTrigger className="h-9 w-auto min-w-[160px] text-sm border-border">
```

---

#### 6. `src/components/ui/select.tsx` (Optional Global Fix)
If the individual component fixes aren't sufficient, update the base SelectTrigger to use a more visible border in dark mode:

**Line 20**: Ensure border is visible

```tsx
// Before
"flex h-10 w-full items-center justify-between rounded-full border border-input bg-background px-4 py-2 text-sm..."

// After (ensure border-input variable is properly defined for dark mode)
"flex h-10 w-full items-center justify-between rounded-full border border-input bg-background px-4 py-2 text-sm..."
```

The `border-input` class uses `hsl(var(--input))` which should be `0 0% 12%` in dark mode - this should be visible. If still too faint, we can adjust the `--input` variable in `index.css` for dark mode.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/AggregateSalesCard.tsx` | Line 274: Icon background |
| `src/components/dashboard/HiringCapacityCard.tsx` | Lines 38-40: Badge text colors |
| `src/components/dashboard/schedule/MonthView.tsx` | Lines 132-137: Status backgrounds |
| `src/components/dashboard/AnnouncementsBento.tsx` | Line 98: SelectTrigger border |
| `src/components/dashboard/AnalyticsFilterBar.tsx` | Lines 70, 95: SelectTrigger borders |

---

### Testing Checklist

After implementation, verify in dark mode:
- Dashboard home page loads with correct colors
- "All" dropdown in Announcements section is visible and readable
- "All Locations" and "Today" filter dropdowns have proper contrast
- Sales Overview "$" icon has visible background
- Hiring Capacity priority badges are readable
- Schedule Month View appointment indicators have appropriate dark backgrounds
