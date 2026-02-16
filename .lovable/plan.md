

## Compact Weekly Lever in Business Insights

### Problem
The Weekly Lever section inside the Zura Business Insights card/drawer is too large. The `SilenceState` component uses `py-16` padding with a big icon, creating a massive vertical block that dominates the card (as shown in the screenshot). When there IS a recommendation, `WeeklyLeverBrief` is similarly tall.

### Solution
Replace the inline lever rendering with a compact, collapsible row:
- **Collapsed (default):** A single-line row showing a green checkmark + "Operations within thresholds" (or the lever title if one exists), with a chevron to expand
- **Expanded:** Shows the full `SilenceState` or `WeeklyLeverBrief` content, but with reduced padding

### Changes

**1. `src/components/executive-brief/SilenceState.tsx`**
- Add an optional `compact` prop
- When `compact=true`: render a single-line row (icon + text + timestamp) instead of the large centered card with `py-16`
- When `compact=false` (default): keep current behavior for the Analytics Hub leadership tab

**2. `src/components/dashboard/AIInsightsDrawer.tsx`** (lines 390-408)
- Replace the inline lever section with a collapsible button row
- Collapsed: compact single line with chevron toggle
- Expanded: shows the full lever content with modest padding
- Uses `Collapsible` from radix for smooth open/close

**3. `src/components/dashboard/AIInsightsCard.tsx`** (lines 346-362)
- Same collapsible pattern as the drawer
- Compact row that expands on click

### Visual (Collapsed State)
```text
|---------------------------------------------------------|
| [checkmark] Operations within thresholds    [chevron v] |
|---------------------------------------------------------|
```

### Visual (Expanded State)
```text
|---------------------------------------------------------|
| [checkmark] Operations within thresholds    [chevron ^] |
|                                                         |
|   No high-confidence lever detected this period.        |
|   Last reviewed: Monday, February 16                    |
|---------------------------------------------------------|
```

### Technical Details

- `SilenceState` gets a `compact?: boolean` prop. Compact renders: `h-10` row with inline icon, text, and timestamp.
- Both `AIInsightsDrawer` and `AIInsightsCard` wrap the lever section in a `Collapsible` (already installed via radix). Default state is collapsed.
- When a lever recommendation exists (not silence), the collapsed row shows the lever title and confidence badge instead, making it clear there is an action to review. In that case, default to expanded so the user sees it.
- The full `WeeklyLeverBrief` component is unchanged for the Analytics Hub leadership tab.

### Files to Modify
- `src/components/executive-brief/SilenceState.tsx` -- add compact variant
- `src/components/dashboard/AIInsightsDrawer.tsx` -- collapsible lever row
- `src/components/dashboard/AIInsightsCard.tsx` -- collapsible lever row
