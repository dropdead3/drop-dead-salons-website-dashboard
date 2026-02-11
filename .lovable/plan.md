

## Fix Counter Animations: Once-Only + Settle Effect

### Problem
Counter animations re-trigger every time elements scroll back into view. They should animate once on first load and stay put. The easing also needs a "laggy ramp down settle" -- the number should overshoot slightly then bounce back to the final value, like a dial settling.

### Files to Change

**3 files** share the same pattern and all need the same two fixes:

| File | Used By |
|---|---|
| `src/hooks/use-counter-animation.ts` | StatsSection (About), Extensions page |
| `src/components/ui/AnimatedNumber.tsx` | PlatformLiveAnalytics |
| `src/components/ui/AnimatedBlurredAmount.tsx` | Dashboard sales cards, forecasting, capacity |

### Change 1: Animate Once Only

All three currently use `IntersectionObserver` to trigger on scroll-into-view. The fix:
- Trigger the initial animation immediately on mount (or on first data load), not on intersection
- Remove the `IntersectionObserver` entirely from `AnimatedNumber` and `AnimatedBlurredAmount`
- For `useCounterAnimation`, the `startOnView` flag already exists -- default it to `false` and simplify
- Keep the "animate on value change" behavior in `AnimatedNumber` and `AnimatedBlurredAmount` (so when data updates, the number smoothly transitions from old to new)

### Change 2: Settle/Overshoot Easing

Replace the current `easeOut = 1 - Math.pow(1 - progress, N)` with a damped spring curve that:
- Ramps up fast to ~105% of the target
- Overshoots slightly
- Oscillates back below target (~99%)
- Settles exactly on target

The math (damped sine wave):

```text
const settle = 1 - Math.exp(-6 * progress) * Math.cos(4 * Math.PI * progress);
```

This produces a curve that hits ~1.05 around 15% progress, dips to ~0.99 around 40%, and fully settles by 85%. The result feels like a physical counter dial coming to rest.

### Technical Details

**`use-counter-animation.ts`**:
- Change `startOnView` default to `false`
- Replace easing function with damped spring
- Keep `hasStarted` guard so it only runs once

**`AnimatedNumber.tsx`**:
- Remove `IntersectionObserver` setup entirely
- Trigger initial animation immediately via `useEffect` on mount
- Replace easing with damped spring
- Keep the value-change re-animation (old value to new value transition)

**`AnimatedBlurredAmount.tsx`**:
- Same as AnimatedNumber: remove observer, animate on mount
- Replace easing with damped spring
- Keep value-change re-animation

### No Breaking Changes
- The settle effect is subtle (5% overshoot) so numbers won't look wrong mid-animation
- Cards that pass changing `value` props still get smooth transitions between values
- Public site counters (StatsSection, Extensions) get the same improved feel
