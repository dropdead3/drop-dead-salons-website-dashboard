

## Unify Corner Radii Across Dashboard Elements

### Problem
The analytics cards (Sales Overview, Week Ahead Forecast, etc.) use `rounded-xl` (20px) via the `tokens.kpi.tile` token, while the My Tasks card and top bar use `rounded-2xl` (30px). This creates a visual inconsistency where the corners don't match.

### Solution
Standardize everything to `rounded-2xl` so the sidebar, top bar, analytics cards, and My Tasks card all share the same corner radius.

### Changes

**1. `src/lib/design-tokens.ts` -- KPI tile token**
Update the `kpi.tile` token from `rounded-xl` to `rounded-2xl`. This propagates the correct radius to all analytics cards that use this token (Sales Overview, Week Ahead Forecast, New Bookings, Goal Tracker, and all pinned analytics cards).

**2. `src/components/ui/card.tsx` -- Base Card component**
Update the default Card border-radius from `rounded-xl` to `rounded-2xl`. This catches any cards not using the token system directly, ensuring all Card instances match.

**3. `src/lib/design-tokens.ts` -- Layout cardBase token**
The `layout.cardBase` token is already `rounded-2xl`, so no change needed there. Just the `kpi.tile` token needs updating.

### Result
After these two changes:
- Sidebar: `rounded-2xl` (already correct)
- Top bar: `rounded-2xl` (already correct)
- Analytics cards: `rounded-2xl` (updated via token)
- My Tasks card: `rounded-2xl` (already correct)
- All other Card instances: `rounded-2xl` (updated via base component)

Everything shares the same 30px corner radius for a cohesive bento aesthetic.
