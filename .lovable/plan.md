
# Fix Footer Button Hover Highlight Width

## Problem

In the sidebar footer, the Settings button (NavLink) and Lock Dashboard button both use `mx-3` margins. Since they're already inside a container with `p-1.5` padding, this creates unnecessary extra space and the hover backgrounds don't span to the edges of the rounded container.

Looking at the current styles:
- **NavLink**: `px-3 py-2.5 mx-3` (12px horizontal margins)
- **SidebarLockButton**: `px-3 py-2.5 mx-3` (12px horizontal margins)

Both are inside a footer container with `mx-3 p-1.5`, so the buttons have compounding margins resulting in the hover highlight not reaching the edges.

## Solution

Remove the `mx-3` margins from both components when they're rendered inside the footer container. This will allow the hover backgrounds to span almost to the edge of the rounded footer container.

## Files to Modify

### 1. `src/components/dashboard/SidebarNavContent.tsx`

**Lines 256-261** - Update NavLink to remove margins inside footer:

The NavLink component receives items from `footerNavItems`. We need to add an `inFooter` prop to control the margin behavior:

```typescript
// Update NavLink component signature (around line 230)
const NavLink = ({ 
  href, 
  label, 
  icon: Icon, 
  badgeCount,
  inFooter = false  // NEW PROP
}: { 
  // ... existing types
  inFooter?: boolean;
}) => {

// Update classNames (around line 256-261)
className={cn(
  "flex items-center gap-3 text-sm font-sans cursor-pointer",
  "transition-all duration-200 ease-out rounded-lg",
  isCollapsed 
    ? cn("px-2 py-2.5 justify-center", inFooter ? "mx-0" : "mx-2")
    : cn("px-3 py-2.5", inFooter ? "mx-0" : "mx-3"),
  // ... rest of styles
)}
```

**Lines 624-628** - Pass `inFooter` prop to footer NavLinks:

```typescript
{filterNavItems(footerNavItems).map((item) => (
  <NavLink 
    key={item.href} 
    {...item}
    inFooter  // ADD THIS
  />
))}
```

### 2. `src/components/dashboard/SidebarLockButton.tsx`

**Lines 24-30** - Add `inFooter` prop and update margins:

```typescript
interface SidebarLockButtonProps {
  isCollapsed?: boolean;
  inFooter?: boolean;  // NEW
}

export function SidebarLockButton({ isCollapsed = false, inFooter = true }: SidebarLockButtonProps) {
  // ... existing code

  const buttonContent = (
    <button
      onClick={handleLock}
      className={cn(
        "flex items-center gap-3 text-sm font-sans cursor-pointer",
        "transition-all duration-200 ease-out rounded-lg",
        isCollapsed 
          ? cn("px-2 py-2.5 justify-center", inFooter ? "mx-0" : "mx-2")
          : cn("px-3 py-2.5", inFooter ? "mx-0" : "mx-3"),
        "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      )}
    >
```

## Result

Both buttons will now have their hover highlights span the full width inside the footer container (minus the container's `p-1.5` padding), creating a consistent and polished appearance where the hover states reach almost to the edges of the rounded footer box.
