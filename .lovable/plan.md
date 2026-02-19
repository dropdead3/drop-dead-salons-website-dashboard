
## Fix Collapsed Sidebar Logo Size

### Problem
The DD secondary icon logo is a wide horizontal SVG (aspect ratio ~3.25:1). When the sidebar collapses, it's forced into a `w-6 h-6` (24x24px) square with `object-contain`, which shrinks it to nearly invisible.

### Solution
Replace the fixed square constraint with a more appropriate sizing for the collapsed state:

**File: `src/components/dashboard/SidebarNavContent.tsx` (lines 327-331)**

Change the custom icon rendering in collapsed state from:
- `w-6 h-6 object-contain` (24x24 square -- crushes wide logos)

To:
- `h-5 w-auto max-w-[40px] object-contain` -- this gives the logo a reasonable height and lets the width flex naturally up to 40px, fitting comfortably within the 64px (w-16) collapsed sidebar while staying visually legible.

Also adjust the fallback initials block (line 333) from `w-6 h-6` to `w-7 h-7` so it matches the visual weight of the icon logo.

### Technical Detail

```
// Before (line 330)
className="w-6 h-6 object-contain"

// After
className="h-5 w-auto max-w-[40px] object-contain"

// Before fallback (line 333)
className="w-6 h-6 rounded bg-foreground ..."

// After
className="w-7 h-7 rounded bg-foreground ..."
```

This is a single-file, two-line change. The logo will scale naturally within the collapsed sidebar width instead of being forced into a tiny square.
