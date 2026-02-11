

## Fix Duplicate Pin Icons on Command Center Cards

### Problem
Cards like New Bookings show **two pin icons** on hover because they have their own internal `CommandCenterVisibilityToggle` AND are wrapped by `PinnableCard` in `PinnedAnalyticsCard.tsx`. The internal controls were needed when the cards lived standalone in the Analytics Hub, but now `PinnableCard` provides the hover-reveal everywhere -- so the internal ones create duplicates.

### Solution
Remove the manual hover-reveal pattern (and direct `CommandCenterVisibilityToggle` usage) from inside each card component. The cards should render only their content -- the `PinnableCard` wrapper handles the Zura AI button and pin toggle externally.

### Cards to Fix

| File | Issue | Fix |
|---|---|---|
| `NewBookingsCard.tsx` | Manual `relative group` wrapper + hover-reveal footer | Remove outer `div.relative.group`, remove hover-reveal `div`, remove `CommandCenterVisibilityToggle` import |
| `StylistWorkloadCard.tsx` | 3 render paths each with manual hover-reveal | Remove from all 3 paths (loading, empty, and main) |
| `StaffingTrendChart.tsx` | Manual hover-reveal footer | Remove wrapper and footer |
| `StylistsOverviewCard.tsx` | 2 render paths with manual hover-reveal | Remove from both paths |
| `HiringCapacityCard.tsx` | Manual hover-reveal footer | Remove wrapper and footer |
| `ClientEngineOverview.tsx` | Manual hover-reveal footer | Remove wrapper and footer |
| `ProgramCompletionFunnel.tsx` | 2 render paths with manual hover-reveal | Remove from both paths |
| `TeamGoalsCard.tsx` | `CommandCenterVisibilityToggle` in card header | Remove from header |
| `CapacityUtilizationCard.tsx` | `CommandCenterVisibilityToggle` in card header | Remove from header |
| `ClientFunnelCard.tsx` | `CommandCenterVisibilityToggle` imported/used | Remove usage |

### Pattern Change Per Card

**Before (e.g., NewBookingsCard):**
```text
<div className="relative group">
  <Card>...content...</Card>
  <div className="max-h-0 opacity-0 group-hover:max-h-10 ...">
    <CommandCenterVisibilityToggle ... />
  </div>
</div>
```

**After:**
```text
<Card>...content...</Card>
```

The `PinnableCard` wrapper in the Analytics Hub pages and `PinnedAnalyticsCard.tsx` already provides the hover-reveal with both Zura AI and pin toggle. Removing the internal one eliminates the duplication.

### Why This Is Safe
Every place these cards are rendered is already wrapped with `PinnableCard`:
- **Command Center**: via `PinnedAnalyticsCard.tsx` (recently added)
- **Analytics Hub**: the parent pages (Sales, Operations, Marketing dashboards) already use `PinnableCard` wrappers around these cards

Removing the internal toggle does not remove the pin functionality -- it just stops it from appearing twice.

### No Database Changes Required
This is a pure frontend cleanup across ~10 component files.
