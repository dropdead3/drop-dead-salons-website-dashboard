

## Match Sidebar Border to Top Navigation Bar

### Problem
The sidebar uses `border-border/50` (50% opacity border) while the top navigation bar uses `border-border` (full opacity). This creates a visible mismatch in stroke intensity between the two navigation elements.

### Change

**File: `src/components/dashboard/DashboardLayout.tsx`** (line 868-869)

Update the sidebar border from `border-border/50` to `border-border` in both collapsed and expanded states to match the top bar exactly.

Before:
```
lg:border-border/50 lg:rounded-[32px]   (collapsed)
lg:border-border/50 lg:rounded-xl       (expanded)
```

After:
```
lg:border-border lg:rounded-[32px]      (collapsed)
lg:border-border lg:rounded-xl          (expanded)
```

Both elements will now share identical styling:
- Fill: `bg-card/80`
- Blur: `backdrop-blur-xl backdrop-saturate-150`
- Border: `border border-border` (full opacity)

### Files Modified
- `src/components/dashboard/DashboardLayout.tsx` (2 class changes on lines 868-869)

