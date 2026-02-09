
# Fix: Table Rounded Corners and Inconsistent Border Brightness

## Problems Identified

### 1. Square corners on the "By Location" table
The `Table` UI component (table.tsx) wraps every `<table>` in an inner `<div class="relative w-full overflow-auto">`. When the parent wrapper in `AggregateSalesCard.tsx` applies `rounded-lg border overflow-hidden`, the inner div renders on top without inheriting those rounded corners -- making the table appear square.

**Fix**: Add `rounded-[inherit] overflow-hidden` to the inner wrapper div inside the `Table` component so it always respects the parent's border-radius. This is a one-line change in the global component, fixing it everywhere.

### 2. Bright/harsh table row borders in dark mode
The `TableRow` component uses a bare `border-b` class which resolves to `hsl(var(--border))`. The dark mode `--border` value is `0 0% 18%` which is correct and subtle. However, the UI "flickers" between bright and subtle because:

- Dark mode classes are applied in a `useEffect` (after first render), causing a brief flash of light-mode borders
- The ThemeInitializer also runs async (fetching from the database), adding another timing window where defaults show

**Fix**: Add `border-border` explicitly to the `TableRow` component to ensure it always uses the CSS variable (not a Tailwind default). Additionally, reduce the border opacity on table rows to make them more subtle: change `border-b` to `border-b border-border/50` for a softer separation that works well in both themes.

## Technical Changes

### File: `src/components/ui/table.tsx`

**Table component (line 7)**: Change the inner wrapper div from:
```
<div className="relative w-full overflow-auto">
```
to:
```
<div className="relative w-full overflow-auto rounded-[inherit]">
```
This ensures any parent `rounded-*` class is inherited by the table's scroll container.

**TableRow component (line 37)**: Change from:
```
border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50
```
to:
```
border-b border-border/50 transition-colors data-[state=selected]:bg-muted hover:bg-muted/50
```
This makes row borders explicitly use the theme-aware `--border` variable at 50% opacity for a subtler, more consistent look.

### File: `src/components/dashboard/AggregateSalesCard.tsx`

No changes needed -- the existing `rounded-lg border overflow-hidden` wrapper is correct; the table component fix will make it work as intended.

## Impact
- Global fix: all `Table` instances across the app will respect parent rounded corners
- Subtler row borders everywhere, consistent across light and dark modes
- No visual changes to non-rounded tables (they inherit `rounded-[inherit]` which is a no-op without a parent radius)
