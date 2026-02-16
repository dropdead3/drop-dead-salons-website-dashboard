
# Restore Zura/Chat Icon on Non-Schedule Pages

## Problem
When the FAB icon was changed to `CalendarClock` for the scheduling copilot, it was applied globally. The non-schedule pages (Dashboard, Clients, etc.) should still show the original help/chat icon with the Zura/Chat popover -- only the Schedule page should use the `CalendarClock` icon.

## Changes

### File: `src/components/dashboard/HelpFAB.tsx`

1. **Re-add the original icon import** -- Add `MessageCircleQuestion` back from `lucide-react` (the original help icon)
2. **Line 63**: Change `aria-label` from `"Scheduling Co-Pilot"` to `"Help & Support"` for the non-schedule popover button
3. **Line 84**: Replace `<CalendarClock>` with `<MessageCircleQuestion>` inside the non-schedule popover (the closed-state icon)

The schedule-page branch (lines 30-48) stays exactly as-is with `CalendarClock` and "Scheduling Co-Pilot."

### Result
- **Schedule page**: `CalendarClock` icon, toggles copilot panel
- **All other pages**: `MessageCircleQuestion` icon, opens Zura/Chat popover
