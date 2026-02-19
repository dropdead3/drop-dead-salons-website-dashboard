

## Enhance Simplified Analytics Card UI

### Current State
The compact bento tiles are functional but feel flat and utilitarian. The icon container, metric value, label, and link are all present but lack visual refinement -- spacing feels cramped, the hierarchy between the metric value and its label is weak, and the "View X >" links blend into the card.

### Enhancements (single file: `PinnedAnalyticsCard.tsx`, lines 464-500)

| Enhancement | Detail |
|-------------|--------|
| Larger icon container | Increase from `w-8 h-8` to `w-10 h-10` for better visual weight and consistency with full-size card headers |
| Icon color upgrade | Change from `text-muted-foreground` to `text-primary` to add warmth and match the full analytics cards |
| Bump metric value size | Change token from `tokens.kpi.value` (text-xl) to `font-display text-2xl font-medium` for a stronger hero metric |
| Improved metric label | Add `tracking-wide` and slightly larger text (`text-xs` to `text-[13px]`) for the sub-label |
| Better vertical spacing | Increase `mt-3` to `mt-4` on the metric section; add `pt-2 border-t border-border/30` on the link row for a subtle divider |
| Link styling | Add `font-medium` to the "View X >" link for better tap target visibility |
| Min height increase | Bump `min-h-[140px]` to `min-h-[160px]` to give the cards breathing room |
| Padding increase | Add `p-5` instead of relying on the token's `p-4` for more generous internal spacing |

### Technical Details

All changes are in the compact-mode return block (lines ~464-500) of `PinnedAnalyticsCard.tsx`:

```tsx
<Card className={cn(tokens.kpi.tile, 'justify-between min-h-[160px] p-5')}>
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <span className={cn(tokens.kpi.label, 'flex-1')}>{meta.label}</span>
    {description && <MetricInfoTooltip description={description} />}
  </div>
  <div className="mt-4 flex-1">
    <p className="font-display text-2xl font-medium">{metricValue}</p>
    {metricLabel && (
      <p className="text-[13px] text-muted-foreground mt-1 tracking-wide">{metricLabel}</p>
    )}
  </div>
  <div className="flex justify-end mt-2 pt-2 border-t border-border/30 min-h-[28px]">
    {link && (
      <Link 
        to={link.href} 
        className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
      >
        View {link.label} <ChevronRight className="w-3 h-3" />
      </Link>
    )}
  </div>
</Card>
```

### Visual Result

```text
+------------------------------------------------+
|                                                |
|  [icon]  SALES OVERVIEW              (i)       |
|                                                |
|  $2,313                                        |
|  revenue                                       |
|                                                |
|  ----------------------------------------      |
|                           View Sales >         |
+------------------------------------------------+
```

- Larger icon with brand color creates visual anchor
- Bigger metric value creates clear hierarchy
- Subtle divider separates navigation from content
- More padding gives the card a calmer, more luxurious feel

One file modified. No new dependencies.
