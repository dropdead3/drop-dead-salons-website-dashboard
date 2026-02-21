
## Fix Faux Bolding on Time Slot Badge

### Problem
The time badge currently uses `style={{ fontWeight: 700 }}` inline, but Aeonik Pro only ships weights 400 and 500. Weight 700 triggers ugly browser-synthesized (faux) bolding -- exactly what the screenshot shows.

### Solution
Switch the time badge to use **Termina** (`font-display`) instead of Aeonik Pro. Termina naturally reads heavier and more architectural at `font-medium` (500), eliminating the need for any synthetic bolding. This also aligns with the design system rule that Termina is used for stats and labels.

### Changes

**File: `src/components/dashboard/schedule/DayView.tsx`**
- Remove `fontWeight: 700` from both badge inline styles (available slot badge and past-slot tooltip)
- Add `font-display font-medium tracking-wide` classes to the badge divs

**File: `src/components/dashboard/schedule/WeekView.tsx`**
- Remove `fontWeight: 700` from the badge inline style
- Add `font-display font-medium tracking-wide` classes to the badge div

This keeps the badge visually prominent using a real font weight rather than faux bolding.
