

## Extend Blur Effect Beyond the Top Bar

### What Changes

Currently, the backdrop blur only applies to the bar element itself -- content is only blurred where it passes directly behind the pill-shaped bar. The user wants a wider blur zone so content near the top of the viewport gets a soft blur fade, creating a more atmospheric effect where content dissolves as it approaches the bar area.

### Implementation

**Single file edit: `src/components/dashboard/DashboardLayout.tsx`**

Add a pseudo-element blur overlay to the sticky wrapper div that extends beyond the bar and fades out, blurring content in the surrounding area (not just behind the bar).

1. **Keep the bar's own backdrop-blur** (`bg-card/80 backdrop-blur-xl backdrop-saturate-150`) -- this stays as-is for the solid frosted-glass look on the bar itself.

2. **Add a blur gradient layer behind/around the bar** using a `::before` pseudo-element on the outer sticky wrapper:
   - Position it absolutely to cover the full width and extend below the bar (e.g., ~40px past the bar bottom)
   - Apply `backdrop-filter: blur(16px)` to blur content in that zone
   - Use a CSS mask that fades from fully opaque at the top to transparent at the bottom, so the blur dissolves smoothly
   - Set `pointer-events: none` so it doesn't interfere with clicks

3. **Practical approach**: Since Tailwind pseudo-element support for `backdrop-blur` with masks is limited, we'll add a small inline style or a dedicated `<div>` overlay inside the sticky wrapper, positioned behind the bar (via `z-[-1]`), that handles the extended blur zone.

**Concrete change on the sticky wrapper (lines 1117-1120):**

Add a sibling div inside the wrapper, before the bar, that acts as the extended blur zone:

```tsx
<div className={cn(
  "dashboard-top-bar hidden lg:block sticky top-0 z-30 px-3 pt-3 pb-3",
  hideFooter && "shrink-0"
)}>
  {/* Extended blur zone -- blurs content around/below the bar */}
  <div 
    className="absolute inset-0 -bottom-8 backdrop-blur-md pointer-events-none"
    style={{
      maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
    }}
  />
  <div className="relative w-full ...">
    {/* bar contents unchanged */}
  </div>
</div>
```

This creates a blur field that covers the bar area plus ~32px (2rem) below it, fading smoothly to no blur. Content scrolling into this zone gets progressively blurred before it reaches the bar.

### Technical Detail

- The outer sticky wrapper needs `position: relative` (already implied by sticky) for the absolute overlay to anchor correctly
- The overlay uses `-bottom-8` to extend 32px below the wrapper
- The CSS mask gradient ensures the blur fades out naturally rather than having a hard edge
- `pointer-events: none` keeps all interactions working normally
- The bar itself retains its own `bg-card/80 backdrop-blur-xl` for the solid frosted pill look

