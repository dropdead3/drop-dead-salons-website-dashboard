
# Change Help FAB Icon to Scheduling Co-Pilot

## What Changes
Replace the `MessageCircleQuestion` icon on the floating action button (bottom-right corner) with a scheduling co-pilot icon. The `CalendarClock` icon from Lucide is a strong fit -- it combines calendar + clock to convey "scheduling intelligence."

## Technical Details

### File: `src/components/dashboard/HelpFAB.tsx`
- Replace the `MessageCircleQuestion` import with `CalendarClock` from `lucide-react`
- Update the icon usage on line 54 from `<MessageCircleQuestion>` to `<CalendarClock>`
- Update the `aria-label` from "Help & Support" to "Scheduling Co-Pilot" for accessibility

### Single file change, 3 lines touched
1. **Line 4** (import): `MessageCircleQuestion` becomes `CalendarClock`
2. **Line 33** (aria-label): Update to "Scheduling Co-Pilot"
3. **Line 54** (icon): `<MessageCircleQuestion>` becomes `<CalendarClock>`
