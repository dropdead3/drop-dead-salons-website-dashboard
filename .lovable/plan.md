
# Dark Mode Compatibility Fixes

## Problem Summary
Several dashboard components use hardcoded light-mode colors (`bg-white`, `bg-zinc-100`, `text-black`, etc.) instead of theme-aware CSS variables. Since the dashboard uses **scoped dark mode** (the `.dark` class is applied to a wrapper div inside `DashboardLayout.tsx`, not the `<html>` element), components that don't use theme-aware colors fail to adapt when dark mode is enabled.

Looking at your screenshot, the **Announcements card** appears with a light/cream background instead of adapting to dark mode. This is a systematic issue affecting multiple components.

## Root Cause
The dashboard applies dark mode via a wrapper:
```tsx
// DashboardLayout.tsx (line 1088-1091)
<div className={cn(resolvedTheme === 'dark' && 'dark', ...)}>
  <DashboardLayoutInner {...props} />
</div>
```

Components using theme-aware colors like `bg-card`, `bg-background`, `text-foreground` work correctly because they reference CSS variables that change when the `.dark` class is present. However, hardcoded colors like `bg-white` or `bg-zinc-100` remain static regardless of theme.

## Components Requiring Fixes

### High Priority (Visible on Dashboard Home)

| Component | File | Issue | Fix |
|-----------|------|-------|-----|
| AnnouncementsBento | `src/components/dashboard/AnnouncementsBento.tsx` | Uses `Card` with no issues, but inner elements may lack contrast | Verify `Card` styling and ensure inner text uses `text-foreground` |
| TodaysBirthdayBanner | `src/components/dashboard/TodaysBirthdayBanner.tsx` | `bg-white/20`, `border-white/50` hardcoded | Replace with `bg-card/20`, `border-border/50` |
| Select/Dropdown Triggers | Multiple locations | May inherit incorrect backgrounds | Verify `SelectContent` uses `bg-popover` |

### Medium Priority (Settings & Management)

| Component | File | Issue | Fix |
|-----------|------|-------|-----|
| AppointmentDetailSheet | `src/components/dashboard/schedule/AppointmentDetailSheet.tsx` | Status badges use `bg-slate-100`, `bg-green-100`, etc. | Add dark variants: `dark:bg-slate-800`, `dark:bg-green-900`, etc. |
| PayrollHistoryTable | `src/components/dashboard/payroll/PayrollHistoryTable.tsx` | Status badges use light colors | Add dark mode variants |
| Feature Request statuses | `src/hooks/useFeatureRequests.ts` | Hardcoded `bg-slate-100 text-slate-700` | Add dark mode variants |

### Lower Priority (Email/Print Previews - Intentionally Light)

| Component | File | Note |
|-----------|------|------|
| VoucherQRCode | `src/components/dashboard/promotions/VoucherQRCode.tsx` | QR codes need white background for scannability - **keep as-is** |
| EmailTemplateEditor | `src/components/dashboard/EmailTemplateEditor.tsx` | Email previews simulate light email clients - **keep as-is** |
| AccountManagement QR Cards | `src/pages/dashboard/admin/AccountManagement.tsx` | Print cards need white for printing - **keep as-is** |

## Implementation Strategy

### Phase 1: Core Dashboard Components
1. Audit and fix `AnnouncementsBento.tsx` - ensure all text uses theme-aware colors
2. Fix `TodaysBirthdayBanner.tsx` - replace hardcoded white/transparency classes
3. Review `Card` component inheritance in all dashboard widgets

### Phase 2: Status Badge System
Create a centralized status badge utility that handles dark mode:
```typescript
// Example pattern for status badges
const statusConfig = {
  booked: { 
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' 
  },
  confirmed: { 
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
  },
  // ... etc
};
```

### Phase 3: Platform/Admin Components
Fix platform analytics and settings components that use conditional logic:
- Replace ternary class switching with Tailwind dark: variants where possible
- Ensure consistent pattern across `PlatformAnalytics`, `OperationalMetrics`, etc.

## Files to Modify

### Dashboard Core (Phase 1)
- `src/components/dashboard/AnnouncementsBento.tsx`
- `src/components/dashboard/TodaysBirthdayBanner.tsx`
- `src/pages/dashboard/admin/TeamBirthdays.tsx`

### Status Badges (Phase 2)
- `src/components/dashboard/schedule/AppointmentDetailSheet.tsx`
- `src/components/dashboard/payroll/PayrollHistoryTable.tsx`
- `src/hooks/useFeatureRequests.ts`

### Platform Components (Phase 3)
- `src/components/platform/analytics/AnalyticsOverview.tsx`
- `src/components/platform/analytics/OperationalMetrics.tsx`
- `src/components/platform/settings/PlatformAppearanceTab.tsx`

## Technical Notes

### Safe Patterns (Theme-Aware)
```tsx
// These work correctly with scoped dark mode:
className="bg-card text-card-foreground"
className="bg-background text-foreground"
className="bg-muted text-muted-foreground"
className="border-border"
className="bg-popover text-popover-foreground"
```

### Patterns to Avoid
```tsx
// These break in dark mode:
className="bg-white"
className="bg-zinc-100"
className="text-black"
className="text-zinc-900"
className="border-gray-200"
```

### Acceptable Exceptions
- QR code containers (need white for scanning)
- Print preview cards (simulate physical output)
- Email template previews (simulate email client rendering)

## Estimated Scope
- **Phase 1**: 3 files, ~15 line changes
- **Phase 2**: 3 files, ~30 line changes (status badge updates)
- **Phase 3**: 3 files, ~20 line changes

This is a systematic issue that will recur if not addressed with consistent patterns. After these fixes, I recommend establishing a linting rule or code review guideline to flag hardcoded color classes in dashboard components.
