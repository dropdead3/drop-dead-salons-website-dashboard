

## Luxury Red Pipeline Status Badges

### What Changes

Restyle the pipeline status badges in `BookingPipelineContent.tsx` to feel premium and on-brand, with a richer red treatment for "Critical" and refined styling for all statuses. The badges will incorporate a subtle glow, a colored dot, and elevated glass-like styling.

### Visual Target

Each badge gets:
- A small colored dot (matching status)
- Luxury glass background with colored tint
- Subtle colored border
- Refined shadow/glow for depth

### File: `src/components/dashboard/analytics/BookingPipelineContent.tsx`

**1. Update `STATUS_CONFIG` chip values (lines 16-20)**

Replace the flat chip classes with richer, glass-style treatments:

| Status | Current | New |
|--------|---------|-----|
| Critical | `bg-destructive/15 text-destructive` | `bg-red-950/60 text-red-300 border-red-500/40 shadow-[0_0_8px_rgba(220,38,38,0.15)]` |
| Slowing | `bg-amber-500/15 text-amber-600` | `bg-amber-950/50 text-amber-300 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.1)]` |
| Healthy | `bg-emerald-500/15 text-emerald-600` | `bg-emerald-950/50 text-emerald-300 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.1)]` |

**2. Update badge markup (lines 264-269)**

Add a status dot inside the badge and refine the container styling:
- Add a small colored dot (`w-1.5 h-1.5 rounded-full`) before the label text
- Update the outer span classes: replace `border border-border/30` with just `border` (the border color comes from the chip class now), add `backdrop-blur-sm` for glass effect
- Keep the fixed width `w-[4.5rem]` and `justify-center`

### Result

Badges will have a deep, tinted glass look with a subtle colored glow -- red for Critical, amber for Slowing, green for Healthy -- each with a small status dot and refined border, matching the luxury aesthetic of the rest of the dashboard.

