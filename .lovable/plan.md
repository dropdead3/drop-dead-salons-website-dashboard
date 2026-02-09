

# Match Hover Background Highlight on Sidebar Footer Items

## Problem

The "Settings" link and "Lock Dashboard" button have mismatched hover backgrounds. Looking at the screenshots, the Settings hover highlight extends wider and has different visual properties than the Lock Dashboard hover highlight.

## Root Cause

The two components use different styling:

| Property | NavLink (Settings) | SidebarLockButton (Lock) |
|----------|-------------------|-------------------------|
| Border radius | `rounded-lg` | `rounded-md` |
| Padding | `px-3 py-2.5` | `px-2.5 py-2` |
| Margin | `mx-3` | none |
| Hover | `hover:bg-muted/60` | `hover:bg-muted/60` |

While the hover color is the same, the padding, margin, and border-radius differences cause the hover backgrounds to appear different sizes.

## Solution

Update `SidebarLockButton` to match the exact styling used by `NavLink` in the sidebar.

## File to Modify

### `src/components/dashboard/SidebarLockButton.tsx`

Update the button styling to match NavLink:

**Lines 24-31 - Change from:**
```typescript
className={cn(
  "flex items-center gap-3 text-sm font-sans cursor-pointer w-full",
  "transition-all duration-200 ease-out rounded-md group",
  isCollapsed 
    ? "px-2 py-2 justify-center" 
    : "px-2.5 py-2",
  "text-muted-foreground hover:text-foreground hover:bg-muted/60"
)}
```

**To:**
```typescript
className={cn(
  "flex items-center gap-3 text-sm font-sans cursor-pointer",
  "transition-all duration-200 ease-out rounded-lg",
  isCollapsed 
    ? "px-2 py-2.5 justify-center mx-2" 
    : "px-3 py-2.5 mx-3",
  "text-muted-foreground hover:text-foreground hover:bg-muted/60"
)}
```

**Key changes:**
- `rounded-md` to `rounded-lg` (match NavLink)
- `px-2.5 py-2` to `px-3 py-2.5` (match NavLink padding)
- Add `mx-3` margin (match NavLink margin)
- Add `mx-2` for collapsed state (match NavLink collapsed margin)
- Remove `w-full` (NavLink doesn't use it)

**Lines 33-37 - Remove the icon background container:**

The NavLink uses a simple icon without background. The SidebarLockButton has an extra `div` wrapper with `bg-muted/50` that creates visual inconsistency. This should be simplified:

**Change from:**
```typescript
<div className={cn(
  "flex items-center justify-center rounded-md transition-colors",
  "bg-muted/50 group-hover:bg-primary/10",
  "p-1.5"
)}>
  <Lock className="w-3.5 h-3.5 shrink-0" />
</div>
```

**To:**
```typescript
<Lock className="w-4 h-4 shrink-0" />
```

This makes the Lock icon match the Settings icon styling exactly.

