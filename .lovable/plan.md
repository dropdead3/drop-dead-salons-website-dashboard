

## Corner Radii — Current State

All dashboard elements now use `rounded-xl` (20px) for a tight, refined bento aesthetic:

- **Tokens**: `kpi.tile`, `card.wrapper`, `layout.cardBase` → `rounded-xl`
- **Base Card component** (`src/components/ui/card.tsx`) → `rounded-xl`
- **Sidebar, Top bar, Trial banner** (`DashboardLayout.tsx`) → `rounded-xl`
