

## Enhance Desktop Top Bar: More Glass + Stronger Bottom Stroke

### What's Changing

The desktop top bar (visible in your screenshot) will get a more pronounced glassmorphism treatment and a stronger bottom border stroke for visual definition.

### Changes

1. **More Glass Effect**: Increase the translucency and add a subtle border/ring to enhance the frosted glass feel
   - Change `bg-card/70` to `bg-card/50` (more translucent)
   - Add `border-b border-border/20` on the outer wrapper for a subtle structural edge
   - Add a soft top-to-bottom gradient overlay for depth

2. **Stronger Bottom Stroke**: Replace the current very faint gradient line (`via-border/30`) with a more visible one
   - Change `via-border/30` to `via-border/60` for a crisper, more defined bottom edge

3. **Sticky Stays**: The `sticky top-0 z-30` classes are already in place and will remain untouched

### Technical Details

**File:** `src/components/dashboard/DashboardLayout.tsx`

| Line | Current | New |
|------|---------|-----|
| 1052 | `bg-card/70 backdrop-blur-xl` | `bg-card/50 backdrop-blur-2xl` (more blur, more transparent) |
| 1053 | `via-border/30` | `via-border/60` (stronger bottom stroke) |
| 1048-1050 | outer wrapper | Add `border-b border-border/15` for glass edge framing |

This keeps the existing sticky behavior intact while giving the bar a more refined, luxury glass appearance consistent with the sidebar's `bg-card/90 backdrop-blur-xl` treatment.
