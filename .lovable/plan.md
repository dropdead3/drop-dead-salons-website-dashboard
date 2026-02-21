
## Add Subtle Stroke to Add-On Row Items

### The Problem

The add-on line items in the "Service Add-Ons and Extras" card lack the subtle border/stroke that other line items (like Service Categories) have. This creates visual inconsistency.

### The Fix

Add `border border-border/60 bg-card` to the `SortableAddonRow` wrapper div class list, matching the pattern used by category rows in `ServicesSettingsContent.tsx` (`rounded-lg border bg-card`).

### Change

| File | Line | Current | Updated |
|------|------|---------|---------|
| `ServiceAddonsLibrary.tsx` | ~79 | `rounded-lg hover:bg-muted/40` | `rounded-lg border border-border/60 bg-card hover:bg-muted/30` |

One line change. Purely visual.
