

## Fix Widget Cards to Match Simple Analytic Card Tokens

### The Problem
The widget cards (Birthdays, Anniversaries, My Schedule, Day Rate, What's New, Help Center, AI Tasks) currently use `tokens.card.*` tokens, which produce a different visual treatment than the simple analytic cards (Sales Overview, Week Ahead Forecast, New Bookings, Goal Tracker) shown in the screenshot.

### What the Simple Analytic Cards Use (the target)

From `PinnedAnalyticsCard.tsx` (line 473):
```tsx
<Card className={cn(tokens.kpi.tile, 'justify-between min-h-[160px] p-5')}>
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <span className={cn(tokens.kpi.label, 'flex-1')}>TITLE</span>
  </div>
```

### Key Differences

| Property | Current (tokens.card) | Target (tokens.kpi) |
|----------|----------------------|---------------------|
| Container | `tokens.card.wrapper` = `rounded-2xl` | `tokens.kpi.tile` = `rounded-xl border border-border bg-card p-4 flex flex-col gap-1` |
| Title | `tokens.card.title` = `font-display text-base tracking-wide` | `tokens.kpi.label` = `font-display text-[11px] font-medium text-muted-foreground uppercase tracking-wider` |
| Icon box | `tokens.card.iconBox` (same dimensions) | Same: `w-10 h-10 rounded-lg bg-muted` (already matching) |
| Icon | `tokens.card.icon` (same) | Same: `w-5 h-5 text-primary` (already matching) |

The main visual mismatch is:
1. **Title typography**: `text-base` (16px) vs `text-[11px]` -- the analytic cards have much smaller, more muted titles
2. **Container**: `rounded-2xl` vs `rounded-xl border border-border bg-card` -- different rounding and explicit border

### Changes Required (7 files)

For each widget, replace:
- `tokens.card.wrapper` with `tokens.kpi.tile`
- `tokens.card.title` with `tokens.kpi.label`
- Keep `tokens.card.iconBox` and `tokens.card.icon` (these already match the analytic card pattern)

**Files:**
1. `src/components/dashboard/BirthdayWidget.tsx`
2. `src/components/dashboard/AnniversaryWidget.tsx`
3. `src/components/dashboard/WorkScheduleWidgetCompact.tsx`
4. `src/components/dashboard/DayRateWidget.tsx`
5. `src/components/dashboard/ChangelogWidget.tsx`
6. `src/components/dashboard/HelpCenterWidget.tsx`
7. `src/components/dashboard/AITasksWidget.tsx`

### Technical Detail per File

Each file gets two token swaps:

**Card container**: Replace `cn("p-4", tokens.card.wrapper)` with `tokens.kpi.tile` (which already includes `p-4` padding, so remove duplicate padding class).

**Title**: Replace `tokens.card.title` with `tokens.kpi.label`.

No other content changes. Icon boxes and internal widget content remain identical.

