

## Fix Collapsed Sidebar: Expand Button Visibility and Logo Overlap

### Problem
When the sidebar is collapsed, the logo and the expand chevron button share a centered flex container. The small chevron crowds into the logo area, making it hard to see and click. The screenshot shows them stacked vertically with poor separation.

### Solution
Restructure the collapsed header to stack the logo and expand button vertically with clear separation, rather than trying to fit both in a single centered row.

**File: `src/components/dashboard/SidebarNavContent.tsx`**

1. **Change the collapsed layout from a single flex-row to a flex-column** so the logo sits on top and the expand button sits clearly below it with spacing.

2. **Make the expand button more visible** by giving it a subtle background (`bg-muted/60 hover:bg-muted`) and slightly larger touch target (`h-7 w-7` instead of `h-6 w-6`).

### Technical Detail

Lines 320-376 -- restructure the collapsed state:

```tsx
<div className={cn("border-b border-border/30", isCollapsed ? "p-3" : "px-4 py-3")}>
  <div className={cn(
    "flex items-center",
    isCollapsed ? "flex-col gap-2" : "justify-between"
  )}>
    {/* Logo link -- unchanged */}
    <Link to="/dashboard" className="block min-w-0">
      {/* ... collapsed/expanded logo rendering unchanged ... */}
    </Link>

    {/* Expand button -- collapsed state gets better visibility */}
    {isCollapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            onClick={onToggleCollapse}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Expand sidebar</TooltipContent>
      </Tooltip>
    ) : (
      /* Collapse button -- unchanged */
    )}
  </div>
</div>
```

Key changes:
- `flex-col gap-2` in collapsed state separates logo and button vertically with clear spacing
- Button gets `bg-muted/50 hover:bg-muted` background so it reads as an interactive element
- Button sized up to `h-7 w-7` for better tap target
- Removes the `mt-1.5` hack that was trying to offset the overlap
