
## Reposition Info Icon to Top-Right Corner of Simplified Analytics Cards

### Problem
The circle info icon (`MetricInfoTooltip`) currently sits inline in the flex row with the icon box and label. This causes inconsistent positioning depending on label length. It should be pinned to the top-right corner of the card with equal padding from the top and right edges.

### Changes

**1. Add a KPI info-icon token to `src/lib/design-tokens.ts`**

Add a new token under `kpi`:
```
infoIcon: 'absolute top-4 right-4'
```

This creates a reusable positioning rule for all simplified analytics cards.

**2. Update `src/components/dashboard/PinnedAnalyticsCard.tsx` (line ~474-481)**

- Make the Card's inner layout `relative` so the icon can be absolutely positioned
- Move `MetricInfoTooltip` out of the flex row and apply the new `kpi.infoIcon` token
- Remove it from the icon+label flex row

Before:
```
<Card className={cn(tokens.kpi.tile, 'justify-between min-h-[160px] p-5')}>
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 ...">
      <Icon ... />
    </div>
    <span ...>{meta.label}</span>
    {description && <MetricInfoTooltip description={description} />}
  </div>
```

After:
```
<Card className={cn(tokens.kpi.tile, 'justify-between min-h-[160px] p-5 relative')}>
  {description && <MetricInfoTooltip description={description} className={tokens.kpi.infoIcon} />}
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 ...">
      <Icon ... />
    </div>
    <span ...>{meta.label}</span>
  </div>
```

**3. Update `src/components/dashboard/AITasksWidget.tsx`** (same pattern if applicable)

Apply the same absolute-positioning pattern so all simplified KPI-style cards are consistent.

### Design rule update

Document in `CARD_HEADER_DESIGN_RULES.md` that simplified/KPI-tile cards position the info icon absolutely at `top-4 right-4`, not inline with the title.

### Files modified
- `src/lib/design-tokens.ts` -- add `kpi.infoIcon` token
- `src/components/dashboard/PinnedAnalyticsCard.tsx` -- reposition MetricInfoTooltip
- `src/components/dashboard/AITasksWidget.tsx` -- apply same pattern if it has an info icon
- `src/CARD_HEADER_DESIGN_RULES.md` -- document the rule for simplified cards
