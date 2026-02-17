

## Standardize Card Header Styling Across Command Center and Analytics

### Problem

Card headers across the dashboard are inconsistent in multiple ways:

1. **Icon containers vary in size and style**
   - Most cards: `w-10 h-10 bg-muted rounded-lg` (correct standard)
   - AIInsightsCard (dashboard): `w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20` (smaller, custom gradient)
   - AITasksWidget: `w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20` (even smaller, gradient)
   - NewBookingsCard: `w-10 h-10 bg-blue-500/10 rounded-lg` (custom color instead of `bg-muted`)

2. **Card wrapper classes differ**
   - GoalTrackerCard: `Card className="shadow-2xl rounded-2xl"` (explicit)
   - AIInsightsCard: `Card className="rounded-2xl shadow-2xl"` (explicit)
   - ForecastingCard, ClientFunnelCard: `Card` (bare, no shadow/radius)
   - HiringCapacityCard: `Card className="premium-card"` (`premium-card` is undefined -- does nothing)
   - NewBookingsCard: `Card className="p-6"` (padding only, no CardHeader)

3. **Header structure varies**
   - Some use `CardHeader` + `CardTitle`
   - Some use raw `div` with manual padding
   - Title text is sometimes `CardTitle`, sometimes raw `h2` or `h3`

4. **Title text patterns differ**
   - Most: `font-display text-base tracking-wide` with text already uppercase in JSX
   - Some add `font-medium uppercase` redundantly
   - AIInsightsSection adds `font-medium uppercase` on CardTitle

5. **`premium-card` is a ghost class** -- used in 7 files but not defined anywhere in CSS. It has zero effect.

### Solution

Create standardized card tokens in the design token system and systematically update all Command Center / Analytics cards to use them.

### Changes

**1. Add card tokens to `src/lib/design-tokens.ts`**

Add a new `card` token group:

```text
card: {
  /** Standard dashboard card wrapper */
  wrapper: 'rounded-2xl shadow-2xl',
  /** Standard icon container (10x10, muted bg, rounded) */
  iconBox: 'w-10 h-10 bg-muted flex items-center justify-center rounded-lg shrink-0',
  /** Standard icon inside the icon box */
  icon: 'w-5 h-5 text-primary',
  /** Standard card title (Termina, base, tracked) */
  title: 'font-display text-base tracking-wide',
}
```

**2. Update inconsistent cards (approximately 8 files)**

| File | What Changes |
|------|-------------|
| `AIInsightsCard.tsx` | Icon box from `w-7 h-7 gradient` to standard `w-10 h-10 bg-muted` |
| `AITasksWidget.tsx` | Icon box from `w-6 h-6 gradient` to standard token |
| `NewBookingsCard.tsx` | Icon box from `bg-blue-500/10` to `bg-muted`; wrap in `CardHeader`/`CardTitle` structure |
| `HiringCapacityCard.tsx` | Replace `premium-card` with `tokens.card.wrapper` |
| `StaffingTrendChart.tsx` | Replace `premium-card` with `tokens.card.wrapper` |
| `AIInsightsSection.tsx` | Remove redundant `font-medium uppercase` from CardTitle |
| Marketing cards (4 files) | Replace `premium-card` with `tokens.card.wrapper` |
| `ClientFunnelCard.tsx` | Add `rounded-2xl shadow-2xl` to bare `Card` |
| `ForecastingCard.tsx` | Add `rounded-2xl shadow-2xl` to bare `Card` |
| `GoalTrackerCard.tsx` | Use token instead of inline classes |

**3. Ensure PinnableCard icon detection still works**

PinnableCard finds the icon box via `querySelector('[class*="bg-muted"][class*="rounded-lg"][class*="w-10"]')`. All cards will now use the standard `w-10 h-10 bg-muted rounded-lg` pattern, so this selector will work universally. Cards that previously used different icon sizes or gradients were invisible to the PinnableCard hover swap -- this fix resolves that too.

**4. Remove `premium-card` references**

Since `premium-card` is not defined in any CSS file, all 7 files using it will be updated to use `tokens.card.wrapper` instead.

### What Does NOT Change

- Card content, data logic, and functionality remain untouched
- Dark mode behavior unchanged
- No new dependencies
- Hover effects on chart elements (inside Recharts) stay as-is -- those are chart-internal interactions, not card-level styling

### File Count

- 1 token file updated
- ~12 card component files updated (class string replacements only)

