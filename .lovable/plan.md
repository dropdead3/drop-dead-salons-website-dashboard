

## Bento Grid Layout for Simple View Analytics Cards

### What Changes

The current simple/compact view renders each pinned analytics card as a flat single-line row (56px tall). This will be redesigned into a **bento-style tile grid** inspired by the reference screenshot -- each card becomes its own standalone tile displaying the primary metric prominently, matching the existing KPI tile design system.

### Visual Design Per Tile

Each compact tile will follow this structure:

```text
+---------------------------------------+
| [icon]  EXECUTIVE SUMMARY  (i)        |
|                                        |
|  $12,450                               |
|                                        |
|  revenue                               |
|                         View Details > |
+---------------------------------------+
```

- **Top row**: Icon (muted container) + uppercase Termina label (using `tokens.kpi.label`)
- **Hero metric**: Large display value (using `tokens.kpi.value` or `tokens.stat.large`)
- **Metric sublabel**: Small muted text beneath the value
- **Bottom-right**: Optional "View [X] >" link to the full analytics tab
- Card uses `tokens.kpi.tile` styling (rounded-xl, border, bg-card, padding)

### Grid Layout

Compact cards will render in a responsive bento grid instead of a vertical stack:

- **Desktop**: `grid-cols-4` (4 tiles per row)
- **Tablet**: `grid-cols-2`
- **Mobile**: `grid-cols-1`

The grid wrapper will be added in `DashboardHome.tsx` around the pinned card renders when `compact` is true.

### Technical Plan

| Step | File | Change |
|------|------|--------|
| 1 | `src/components/dashboard/PinnedAnalyticsCard.tsx` | Redesign the compact return block from a single-line `h-14` row to a bento tile using KPI token classes. Add a `CARD_LINK` map for optional "View X >" navigation links per card. |
| 2 | `src/pages/dashboard/DashboardHome.tsx` | Wrap pinned card renders in a responsive grid container (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`) when `compactView` is true, instead of rendering them as sequential full-width blocks. |

### Compact Tile Anatomy (code sketch)

```tsx
<Card className="rounded-xl border border-border/50 bg-card p-5 flex flex-col justify-between min-h-[140px]">
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <span className="font-display text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
      {meta.label}
    </span>
  </div>
  <div className="mt-3">
    <p className="font-display text-xl font-medium">{metricValue}</p>
    {metricLabel && (
      <p className="text-xs text-muted-foreground mt-0.5">{metricLabel}</p>
    )}
  </div>
  {linkHref && (
    <div className="flex justify-end mt-2">
      <Link to={linkHref} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
        View {linkLabel} <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  )}
</Card>
```

### Link Mapping Per Card

| Card | Link Text | Route |
|------|-----------|-------|
| executive_summary | View Brief | /dashboard/admin/analytics?tab=leadership |
| sales_overview | View Sales | /dashboard/admin/analytics?tab=sales |
| top_performers | View Team | /dashboard/admin/analytics?tab=sales&subtab=team |
| capacity_utilization | View Capacity | /dashboard/admin/analytics?tab=operations&subtab=capacity |
| client_funnel | View Clients | /dashboard/admin/analytics?tab=marketing |
| goal_tracker | View Goals | /dashboard/admin/analytics?tab=sales&subtab=goals |
| new_bookings | View Pipeline | /dashboard/admin/analytics?tab=operations&subtab=booking-pipeline |
| All others | (no link or generic "View Details") | Respective analytics subtab |

### What Stays the Same

- All metric extraction logic (the existing switch/case)
- PinnableCard wrapper and hover interactions (Zura AI + pin icons)
- VisibilityGate gating
- The toggle button in the filter bar
- localStorage persistence of view mode
- Widgets section (completely untouched)
- Detailed view rendering (untouched)

### Files Modified

- `src/components/dashboard/PinnedAnalyticsCard.tsx` -- compact tile redesign
- `src/pages/dashboard/DashboardHome.tsx` -- grid wrapper for compact mode

No database changes. Two files modified.
