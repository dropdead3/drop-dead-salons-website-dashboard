

## Make Feedback Buttons Icon-Only with Hover Tooltips

The "Request a Feature" and "Report a Bug" buttons currently show text labels that get truncated. This change makes them always icon-only (matching the collapsed behavior) with tooltip hints on hover.

### Changes

**`src/components/dashboard/SidebarFeedbackButtons.tsx`**

- Remove the `isCollapsed` conditional logic -- both buttons always render as icon-only.
- Wrap both buttons in `<Tooltip>` with `side="top"` so the label appears on hover.
- Use a compact `flex gap-1` row layout instead of the 2-column grid.
- Slightly increase icon size to `h-4 w-4` for better visibility as standalone icons.
- Remove the `isCollapsed` prop since it's no longer needed.

**`src/components/dashboard/SidebarNavContent.tsx`**

- Remove the `isCollapsed` prop passed to `<SidebarFeedbackButtons />`.

### Result

Two small icon buttons (lightbulb + bug) sit cleanly above Clock In / Lock Dashboard. Hovering reveals "Request a Feature" or "Report a Bug" tooltips.

