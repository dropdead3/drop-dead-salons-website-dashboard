

## Remove Glass Styling from Top Menu Bar

### What Changes
Replace the glassmorphism treatment (translucent background, backdrop blur, rounded corners, shadow) on the desktop top bar with a clean, flat style: solid white background with a subtle gray bottom border -- matching the dashboard's card/page background.

### Changes

**File: `src/components/dashboard/DashboardLayout.tsx`**

Line 1118 -- Remove `top-3`, `mx-3`, `mt-3` spacing (bar should sit flush, not float)

Line 1121 -- Replace the glass classes:
- Before: `bg-card/50 backdrop-blur-2xl rounded-xl border border-border/15 shadow-sm overflow-hidden`
- After: `bg-card border-b border-border`

Remove `rounded-xl` (flush bar, no rounding), `shadow-sm` (no shadow), `backdrop-blur-2xl` (no blur), and change the border from a full 1px translucent border to just a bottom border with standard border color.

Also check for any bottom accent gradient element inside the bar and remove it if present, since that was part of the glass treatment.

### Result
The top bar will have a clean white background (respects theme via `bg-card`) with a single gray bottom stroke, matching the reference screenshot exactly.

