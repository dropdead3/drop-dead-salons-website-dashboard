

# Fix Hover Hint Overlap on Collapsed Sidebar

## Problem
When hovering on a collapsed sidebar icon, both the tooltip ("People") and the flyout menu appear simultaneously, overlapping each other. The tooltip is now redundant since the HoverPopover flyout already displays the section label as its header.

## Solution
Remove the `Tooltip` / `TooltipTrigger` / `TooltipContent` wrappers from the collapsed icon buttons in both files where HoverPopover flyouts are used. The flyout itself serves as the label.

## Files Changed

### 1. `src/components/dashboard/SidebarNavContent.tsx` (lines 659-677)
Remove the Tooltip wrapper around the PopoverTrigger button. Before:
```
<HoverPopover>
  <Tooltip>
    <TooltipTrigger asChild>
      <PopoverTrigger asChild>
        <button>...</button>
      </PopoverTrigger>
    </TooltipTrigger>
    <TooltipContent side="right">{sectionLabel}</TooltipContent>
  </Tooltip>
  <SidebarPopoverContent>...
```
After:
```
<HoverPopover>
  <PopoverTrigger asChild>
    <button>...</button>
  </PopoverTrigger>
  <SidebarPopoverContent>...
```

### 2. `src/components/dashboard/CollapsibleNavGroup.tsx` (lines 169-187)
Same removal of the Tooltip wrapper around the PopoverTrigger button for manager sub-group flyouts.

## Impact
Minimal -- removes 3 lines of JSX per file. No behavioral or styling changes to the flyout itself.
