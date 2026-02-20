

# Match Day View Time Labels to Week View

## Problem
The Day view's time label column uses different styling than the Week view:
- Different font sizes (`text-[11px]`/`text-[10px]` vs `text-xs`)
- Negative margin offsets (`-mt-2`/`-mt-1`) that misalign labels from their grid rows
- Border classes applied to each label row (Week view has none on the label column)
- Two separate conditional `<span>` elements instead of one unified span

## Changes to `src/components/dashboard/schedule/DayView.tsx`

### Update time label rendering (lines 634-661)

Replace the current two-span conditional rendering with the Week view's pattern:

**Current (Day view):**
```tsx
<div className={cn('h-5 text-right pr-2 flex items-center justify-end', borderClass)}>
  {isHour && <span className="text-[11px] text-foreground font-medium -mt-2">{label}</span>}
  {isHalf && <span className="text-[10px] text-muted-foreground/50 -mt-1">{label}</span>}
</div>
```

**Target (matching Week view):**
```tsx
<div className={cn(
  'h-[20px] text-xs text-muted-foreground pr-2 text-right flex items-center justify-end',
  isHour && 'font-medium'
)}>
  {label && (
    <span className={cn(isHour ? 'text-foreground' : 'text-muted-foreground/60')}>
      {label}
    </span>
  )}
</div>
```

This removes the border classes from time label rows, uses consistent `text-xs` sizing, removes the negative margins, and uses the same single-span pattern as the Week view.

