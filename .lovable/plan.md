
# Fix "Get back on track" Button Styling

## Problem
The button currently uses `text-destructive hover:text-destructive` which gives it a red color that clashes with the page's premium aesthetic. It should match the subtle, muted style used by other ghost buttons on the page.

## Change

### File: `src/components/dashboard/sales/SalesGoalProgress.tsx`
- **Line 236**: Replace `text-destructive hover:text-destructive` with `text-muted-foreground hover:text-foreground` so the button uses the same neutral tones as other interactive elements on the page.

Before:
```
className="h-auto py-0.5 px-2 text-[11px] text-destructive hover:text-destructive ml-1 gap-1"
```

After:
```
className="h-auto py-0.5 px-2 text-[11px] text-muted-foreground hover:text-foreground ml-1 gap-1"
```

1 line change, 1 file. No structural changes.
