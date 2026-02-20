

# Upgrade Client Detail Panel to Luxury Glassmorphism Bento

## Problem

The panel currently uses `bg-popover`, `shadow-xl`, and a basic ease curve -- it doesn't match the platform's luxury glass aesthetic (`bg-card/80 backdrop-blur-xl`) or use a spring animation for that premium feel.

## Changes

### File: `src/components/dashboard/ClientDetailSheet.tsx`

**Lines 386-392** -- Update the floating panel's styling and animation:

1. **Glassmorphism treatment**: Replace `bg-popover shadow-xl` with `bg-card/80 backdrop-blur-xl shadow-2xl` to match the platform's standard card language.

2. **Spring animation**: Replace the ease-curve transition with a physics-based spring:
   - `initial`: `{ opacity: 0, x: 80 }` (starts further off-screen for a more dramatic entrance)
   - `animate`: `{ opacity: 1, x: 0 }`
   - `exit`: `{ opacity: 0, x: 80 }`
   - `transition`: `{ type: 'spring', damping: 26, stiffness: 300, mass: 0.8 }` (snappy with a subtle overshoot)

3. **Keep everything else**: `rounded-xl`, `border border-border`, `right-4 top-[50%] -translate-y-1/2`, responsive width, and all internal content remain unchanged.

**Line 382** -- Subtle overlay refinement: Keep `bg-black/20 backdrop-blur-sm` as-is (already matches the luxury overlay standard).

## Summary of class change

```text
Before:
  bg-popover shadow-xl
  transition: duration 0.2s, ease [0.16, 1, 0.3, 1]
  initial/exit: x: 40

After:
  bg-card/80 backdrop-blur-xl shadow-2xl
  transition: type spring, damping 26, stiffness 300, mass 0.8
  initial/exit: x: 80
```

## Result

The panel will slide in from the right with a satisfying spring bounce, featuring the same glassmorphism depth treatment used across all dashboard cards -- fully cohesive with the platform's luxury bento aesthetic.

