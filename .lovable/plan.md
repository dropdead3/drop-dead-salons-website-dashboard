

## Premium Task Detail Drilldown UI Enhancement

### Overview
Elevate the task detail drilldown dialog with improved padding, spacing, visual hierarchy, and a card-within-card metadata section that matches the platform's luxury glass aesthetic.

### Changes (Single File: `src/components/dashboard/TaskDetailDrilldown.tsx`)

**1. Header Section**
- Increase padding from `p-5 pb-4` to `p-6 pb-5` for more breathing room
- Ensure title uses `font-sans` (Aeonik Pro) consistently
- Slightly larger badges with better spacing between them

**2. Notes Section**
- Wrap in a subtle card-within-card container (`bg-muted/30 border border-border/30 rounded-lg p-4`) for visual separation
- Add a section label with icon (`StickyNote` or existing icon)

**3. Metadata Grid**
- Wrap the 2x2 grid in an elevated card-within-card (`bg-muted/20 border border-border/30 rounded-lg p-4`)
- Add subtle gradient divider between notes and metadata
- Better vertical spacing between label and value (`space-y-1`)
- Use `font-sans` (not `font-medium` which is fine, but ensure no Termina leaks)

**4. Footer Actions**
- Increase padding from `p-4 pt-3` to `p-5 pt-4`
- Center the action buttons for a more balanced layout
- Add subtle rounded-lg pill styling to buttons for premium feel

**5. Overall Content Area**
- Increase content padding from `p-5` to `p-6`
- Increase spacing between sections from `space-y-5` to `space-y-6`

### No new files or dependencies needed. All changes are in `TaskDetailDrilldown.tsx`.

