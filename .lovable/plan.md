

## Fix Scroll on Happening Now Drill-Down

The scroll isn't working because the Radix `ScrollArea` viewport needs its parent to have a definitive height constraint. While `flex-1 min-h-0` is on the `ScrollArea`, the internal viewport div uses `h-full w-full` which doesn't resolve correctly in this flex layout.

### Fix (single file)

**`src/components/dashboard/LiveSessionDrilldown.tsx`** -- line 95

Change the `ScrollArea` to also include `overflow-hidden` so it properly constrains within the flex column, and wrap it in a container that enforces the flex shrinking:

```
<ScrollArea className="flex-1 min-h-0 overflow-hidden">
```

If that alone isn't sufficient (Radix quirk), wrap the ScrollArea in a div that enforces the constraint:

```html
<div className="flex-1 min-h-0 overflow-hidden">
  <ScrollArea className="h-full">
    ...
  </ScrollArea>
</div>
```

This ensures the dialog's `max-h-[85vh] flex flex-col` layout properly caps the list height, and the ScrollArea's internal viewport gets a resolved height to enable scrolling.

### File Modified
- `src/components/dashboard/LiveSessionDrilldown.tsx` (line 95 area only)
