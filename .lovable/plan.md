
# Clean Up the Quick Actions Overflow Dropdown

## The Problem
The "Quick Actions" dropdown (triggered by the `...` ellipsis button in the top bar) renders full interactive components -- `HideNumbersToggle` (a Button), `ViewAsToggle` (a full DropdownMenu), and `PhorestSyncPopout` (a Popover with sync status) -- inside raw `<div className="px-2 py-1.5">` wrappers. This creates:

- Inconsistent padding and spacing between items
- Misaligned icons and text
- Nested interactive menus that look broken inside a dropdown
- The role badge rendered as a disabled menu item looks like dead UI

## The Fix

Restructure the dropdown content in `DashboardLayout.tsx` (lines 1064-1092) so every item uses proper `DropdownMenuItem` styling with consistent icon + label layout. Instead of embedding the full toggle/popover components, render simplified menu-item versions:

### File: `src/components/dashboard/DashboardLayout.tsx`

**Replace lines 1064-1092** with a cleaner structure:

```tsx
<DropdownMenuContent align="end" className="w-56">
  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
  <DropdownMenuSeparator />
  
  {/* Show/Hide $ - as a proper menu item with click handler */}
  <DropdownMenuItem onClick={toggleHideNumbers} className="gap-2">
    {hideNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    {hideNumbers ? 'Show Numbers' : 'Hide Numbers'}
  </DropdownMenuItem>
  
  <DropdownMenuSeparator />
  
  {/* Role badge as a label, not a disabled item */}
  <DropdownMenuLabel className="gap-2 flex items-center text-xs font-normal text-muted-foreground">
    <AccessIcon className="w-3.5 h-3.5" />
    {getAccessLabel()}
  </DropdownMenuLabel>
  
  {/* View As - navigates to trigger the ViewAs panel or inline sub-items */}
  {isAdmin && (
    <DropdownMenuItem className="gap-2" asChild>
      {/* Render as a simple trigger that opens ViewAs from within */}
    </DropdownMenuItem>
  )}
  
  {/* Phorest Sync - as a menu item with status dot */}
  {showPhorestSync && (
    <DropdownMenuItem onClick={handleSyncNow} className="gap-2">
      <RefreshCw className="w-4 h-4" />
      Sync Data
      <span className={cn("ml-auto h-2 w-2 rounded-full", getHealthColor())} />
    </DropdownMenuItem>
  )}
  
  <DropdownMenuSeparator />
  
  <DropdownMenuItem asChild>
    <Link to="/dashboard/help" className="flex items-center gap-2 cursor-pointer">
      <HelpCircle className="w-4 h-4" />
      Help Center
    </Link>
  </DropdownMenuItem>
</DropdownMenuContent>
```

### Key Decisions

1. **HideNumbersToggle**: Extract `hideNumbers` and `toggleHideNumbers` from `useHideNumbers()` at the parent level (they're already available since `HideNumbersToggle` uses them). Render as a standard `DropdownMenuItem` with `onClick`.

2. **Role Badge**: Change from `disabled DropdownMenuItem` to a `DropdownMenuLabel` -- it's informational, not interactive, so it should look like a label.

3. **ViewAsToggle**: This is the trickiest since it's a full nested dropdown. Keep it as the embedded component but wrap it cleanly so it sits within the menu's visual rhythm. The `ViewAsToggle` already renders its own `DropdownMenu`, so it will layer on top naturally.

4. **PhorestSyncPopout**: Replace the full popover with a simplified `DropdownMenuItem` showing the sync action + a health status dot. The full sync dashboard is accessible from Settings.

### Technical Notes

- The `useHideNumbers` hook is already called inside `HideNumbersToggle`. We need to lift that call to the parent scope so the `DropdownMenuItem`'s `onClick` can access `toggleHideNumbers` directly.
- The `PhorestSyncPopout` sync handler needs to be accessible. Since it's a separate component, the simplest approach is to keep the full component but style it to render as a menu-item-like row (adding a `variant="menuItem"` prop or simply adjusting its trigger to look like a `DropdownMenuItem`).
- For `ViewAsToggle`, since it opens its own dropdown, it naturally works as a nested interactive element. Just remove the raw `div` padding wrapper and ensure consistent spacing.

| File | Change |
|---|---|
| `src/components/dashboard/DashboardLayout.tsx` | Restructure Quick Actions dropdown items (lines 1064-1092) to use consistent `DropdownMenuItem` patterns, lift `useHideNumbers` to parent scope, style role badge as label |
