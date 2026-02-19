

## Align Widget Cards with Simple Analytic Card Design

### What's Different

Comparing the two screenshots, the simple analytic cards have a taller, more spacious feel with bottom-aligned action links, while the widget cards feel cramped and inconsistently structured. Here are the specific mismatches:

| Property | Analytic Cards (correct) | Widget Cards (current) |
|----------|------------------------|----------------------|
| Padding | `p-5` | `p-4` (tokens.kpi.tile default) |
| Min height | `min-h-[160px]` | None (cards collapse) |
| Vertical layout | `justify-between` (pushes footer down) | No vertical distribution |
| Action links | Bottom-aligned with `border-t border-border/30` separator | Inline in header or scattered |
| Header structure | Icon + label only in top row | Some have action buttons in header row |

### Target Pattern (matching analytic cards exactly)

```tsx
<Card className={cn(tokens.kpi.tile, 'justify-between min-h-[160px] p-5')}>
  {/* Top: Icon + Label */}
  <div className="flex items-center gap-3">
    <div className={tokens.card.iconBox}>
      <Icon className={tokens.card.icon} />
    </div>
    <span className={cn(tokens.kpi.label, 'flex-1')}>WIDGET TITLE</span>
  </div>

  {/* Middle: Content */}
  <div className="mt-4 flex-1">
    {/* Widget-specific content */}
  </div>

  {/* Bottom: Action link with border separator */}
  <div className="flex justify-end mt-2 pt-2 border-t border-border/30 min-h-[28px]">
    <Link className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
      View Label <ChevronRight className="w-3 h-3" />
    </Link>
  </div>
</Card>
```

### Changes Per File

**1. `src/components/dashboard/ChangelogWidget.tsx`**
- Add `justify-between min-h-[160px] p-5` to Card className
- Remove unread badge from header row (keep it on individual entries)
- Move "View All Updates" link to a bottom footer row with `border-t border-border/30`, using `text-xs font-medium` link style with `ChevronRight` icon instead of a full-width ghost Button
- Change `<h3>` to `<span>` with `flex-1` to match analytic pattern

**2. `src/components/dashboard/HelpCenterWidget.tsx`**
- Add `justify-between min-h-[160px] p-5` to Card className
- Remove "View All" button from header row
- Move "Browse Help Center" to bottom footer row with `border-t border-border/30`, matching the "View Sales >" link style from analytic cards
- Change `<h3>` to `<span>` with `flex-1`

**3. `src/components/dashboard/BirthdayWidget.tsx`**
- Add `justify-between min-h-[160px] p-5` to Card className
- Change `<h3>` to `<span>` with `flex-1`
- Wrap content in `flex-1` div with `mt-4`

**4. `src/components/dashboard/AnniversaryWidget.tsx`**
- Add `justify-between min-h-[160px] p-5` to Card className
- Change `<h3>` to `<span>` with `flex-1`
- Wrap content in `flex-1` div with `mt-4`

**5. `src/components/dashboard/WorkScheduleWidgetCompact.tsx`**
- Add `justify-between min-h-[160px] p-5` to Card className
- Change `<h3>` to `<span>` with `flex-1`
- Move "Manage >" link to bottom footer row with `border-t border-border/30` instead of a full-width ghost Button
- Wrap schedule content in `flex-1` div with `mt-4`

**6. `src/components/dashboard/DayRateWidget.tsx`**
- Add `justify-between min-h-[160px] p-5` to Card className (replace `space-y-4`)
- Remove "View All" from header row
- Move it to bottom footer row with `border-t border-border/30` matching the analytic link style
- Change `<h3>` to `<span>` with `flex-1`
- Wrap stats content in `flex-1` div with `mt-4`

**7. `src/components/dashboard/AITasksWidget.tsx`**
- Add `justify-between min-h-[160px] p-5` to Card className
- Change `<h3>` to `<span>` with `flex-1`
- Wrap tasks content in `flex-1` div with `mt-4`

### What This Achieves
- All widget cards will have the same height, padding, and vertical rhythm as the simple analytic cards
- Action links consistently appear at the bottom right with a subtle border separator
- Headers are clean with just icon + label (no competing controls)
- The `justify-between` + `min-h` ensures content distributes vertically the same way

