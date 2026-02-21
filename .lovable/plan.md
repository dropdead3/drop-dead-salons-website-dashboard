

## Add-On Margin Analytics

### Overview
Surface add-on margin performance in two places: (1) a new "Add-On Margins" stat card on the Stylist Performance Dashboard (Stats page), and (2) an add-on margin data point injected into the lever-engine's evidence payload so the Weekly Zura Brief can recommend margin-related levers.

### What Changes

**1. New hook: `src/hooks/useAddonMarginAnalytics.ts`**
- Queries `service_addons` for the organization (price, cost, name)
- Calculates per-addon margin % as `((price - cost) / price) * 100` (only for addons where `cost` is not null)
- Returns: overall avg margin %, best/worst margin add-ons, total add-on count with cost data
- Accepts optional `organizationId` param

**2. Stats page: `src/pages/dashboard/Stats.tsx`**
- Add a new "Add-On Margins" card below the Conversion Dashboard
- Shows: Avg margin %, top 3 highest-margin add-ons, lowest-margin add-on (if any)
- Only renders when the org has add-ons with cost data defined
- Uses the `useAddonMarginAnalytics` hook
- Visible to admins/managers only (margin data is operator-level)

**3. Lever engine: `supabase/functions/lever-engine/index.ts`**
- After fetching KPI data, also fetch `service_addons` for the org (price, cost where cost is not null)
- Calculate avg add-on margin %
- Inject into the `evidence` payload of the generated recommendation as `addon_margin_avg_pct`
- Add a new lever mapping: if avg margin is below 40%, flag as a `pricing` driver with a note like "Add-on avg margin is X%, consider reviewing cost/pricing"
- This allows the AI summary to reference add-on margins when generating lever recommendations

### Technical Detail

**Hook structure:**
```typescript
// useAddonMarginAnalytics.ts
export interface AddonMarginData {
  avgMarginPct: number;
  addonsWithCost: number;
  totalAddons: number;
  topMargin: { name: string; marginPct: number; price: number; cost: number }[];
  lowMargin: { name: string; marginPct: number; price: number; cost: number }[];
}
```

**Stats card placement:** After the Conversion Dashboard card (~line 293), wrapped in a visibility check for admin roles and non-empty margin data.

**Lever engine addition:** ~10 lines added after the KPI readings fetch (around line 73) to pull add-on data and inject margin signals into the lever candidate calculation.

### Files

| File | Action |
|------|--------|
| `src/hooks/useAddonMarginAnalytics.ts` | Create |
| `src/pages/dashboard/Stats.tsx` | Edit - add margin card |
| `supabase/functions/lever-engine/index.ts` | Edit - add margin signal |

