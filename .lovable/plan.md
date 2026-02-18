

## Restructure KPI Tiles into Visual Hierarchy

### What Changes

The current flat 3+2 bento grid treats all 5 KPIs equally. The new layout establishes the Experience Score as the primary metric with the four components visually subordinate beneath it.

### New Layout Structure

```text
+--------------------------------------------------+
|  EXPERIENCE SCORE                                 |
|  0 / 100                    [change badge]        |
|  (larger, prominent, full-width hero tile)        |
+--------------------------------------------------+

+----------------------+  +----------------------+
|  AVG TIP             |  |  TIP RATE            |
|  $0.00               |  |  0%                  |
+----------------------+  +----------------------+
+----------------------+  +----------------------+
|  FEEDBACK RATE       |  |  REBOOK RATE         |
|  0%                  |  |  0%                  |
+----------------------+  +----------------------+
```

### Design Details

**Hero Tile (Experience Score)**
- Full-width single tile at the top
- Larger value typography (`tokens.stat.large` or `text-3xl font-display`)
- Subtle connecting label: a small muted line like "Composed from" or a thin separator between the hero and the 2x2 grid to visually link them
- Same click-to-activate behavior (selects composite ranked view)

**Component Tiles (2x2 grid)**
- `grid-cols-2` on all breakpoints, consistent 2x2
- Slightly smaller styling than the hero to reinforce hierarchy
- Each still clickable to toggle bar chart drill-down
- A subtle visual indicator (e.g. lighter border or `bg-muted/20` vs the hero's `bg-primary/5` when active) to show they feed into the score above

**Connecting Element**
- A small centered label between hero and grid: `text-[10px] text-muted-foreground uppercase tracking-widest` reading "Based on" with a thin horizontal rule on each side, giving the user a clear signal that the 4 tiles compose the score

### Technical Details

**File modified:** `src/components/dashboard/sales/ClientExperienceCard.tsx`

Changes to the KPI rendering section (lines 230-268):

1. Extract the composite KPI from the `kpis` array and render it first as a standalone full-width tile with enlarged typography
2. Add a connecting separator element
3. Render the remaining 4 KPIs in a `grid-cols-2 gap-3` grid
4. Update the skeleton loading state to match the new layout (1 large skeleton + 4 smaller)
5. Default `activeMetric` to `'composite'` since it is now the hero — the ranked list view shows first

No hook changes needed. No new files.
