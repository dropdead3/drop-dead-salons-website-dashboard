

## Add Backdrop Blur to Dashboard Top Bar on Scroll

### What Changes
The sticky top bar will get a frosted-glass backdrop blur effect so that content scrolling underneath it appears blurred, creating a clean visual separation between the bar and the page content.

### Implementation

**Single file edit: `src/components/dashboard/DashboardLayout.tsx`**

On the outer sticky wrapper div (line 1118), add `backdrop-blur-xl` and make the inner bar's background semi-transparent:

- **Outer wrapper** (line 1118): Add `pb-3` so the blur zone extends slightly below the bar for a softer edge
- **Inner bar** (line 1121): Change `bg-card` to `bg-card/80 backdrop-blur-xl backdrop-saturate-150` -- this makes the bar background 80% opaque with a strong blur applied to content behind it

The effect is always-on (no scroll listener needed) since the bar is `sticky top-0` -- content only appears behind it when scrolling. When not scrolling, nothing is behind it, so it looks normal.

### Technical Detail

```
Before: bg-card border border-border rounded-full
After:  bg-card/80 backdrop-blur-xl backdrop-saturate-150 border border-border rounded-full
```

This follows the same frosted-glass pattern used elsewhere in the project and requires zero JavaScript -- pure CSS.
