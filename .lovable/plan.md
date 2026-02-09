

# Match Hover Backgrounds for Sidebar Footer Items

## Problem

The "Lock Dashboard" button and "Settings" link have mismatched hover background colors:

- **Lock Dashboard**: `hover:bg-background/80`
- **Settings**: `hover:bg-muted/60`

This creates visual inconsistency when hovering over items in the footer section.

## Solution

Update the `SidebarLockButton` component to use the same hover background as the `NavLink` component.

## File to Modify

### `src/components/dashboard/SidebarLockButton.tsx`

**Change:** Update the button's hover class from `hover:bg-background/80` to `hover:bg-muted/60`

```typescript
// Line 31 - Change this:
"text-muted-foreground hover:text-foreground hover:bg-background/80"

// To this:
"text-muted-foreground hover:text-foreground hover:bg-muted/60"
```

This single-line change will make both footer items use the same `hover:bg-muted/60` background, creating a consistent hover effect throughout the footer section.

