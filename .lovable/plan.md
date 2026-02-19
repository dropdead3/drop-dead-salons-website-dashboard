

## Tighten Corner Radii Across Dashboard

### Problem
The current `rounded-2xl` (30px) radius feels too rounded. You want a tighter, more refined corner radius across all dashboard elements.

### Solution
Switch from `rounded-2xl` to `rounded-xl` (20px) across all tokens and components. This creates a cleaner, more structured look while still maintaining soft corners.

### Changes

**1. `src/lib/design-tokens.ts` -- Update all radius tokens**
- `kpi.tile`: `rounded-2xl` to `rounded-xl`
- `card.wrapper`: `rounded-2xl` to `rounded-xl`
- `layout.cardBase`: `rounded-2xl` to `rounded-xl`

**2. `src/components/ui/card.tsx` -- Base Card component**
- Default Card class: `rounded-2xl` to `rounded-xl`

**3. `src/components/dashboard/DashboardLayout.tsx` -- Sidebar + Top bar + Banner**
- Sidebar (`lg:rounded-2xl`): change to `lg:rounded-xl`
- Top bar (`rounded-2xl`): change to `rounded-xl`
- Trial banner (`rounded-2xl`): change to `rounded-xl`

### Result
All dashboard elements (sidebar, top bar, analytics cards, My Tasks, Help Center, and all other cards) will share a consistent 20px corner radius for a tighter, more refined bento aesthetic.
