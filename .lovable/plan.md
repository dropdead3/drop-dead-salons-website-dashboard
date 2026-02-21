

## Redo Feature Gap Closure -- COMPLETED

### All Gaps Resolved

| # | Gap | Status | Fix |
|---|-----|--------|-----|
| 1 | Redo total not reflected in booking Total | ✅ Done | Confirm step now shows redo-adjusted price with strikethrough of original |
| 2 | Reason validation not enforced | ✅ Done | `canBook` now blocks submission when reason is required but empty |
| 3 | Edge function writes to wrong table | ✅ Done | Added redo columns to `phorest_appointments` via migration |
| 4 | `isManagerOrAdmin` check broken | ✅ Done | Now uses `useAuth().roles` instead of `(user as any).roles` |
| 5 | No redo-of-redo chain | ✅ Done | Original appointment picker no longer filters `is_redo = false` |
| 6 | No pending redo visual treatment | ✅ Done | Amber dashed border on Day + Week view cards, RotateCcw icon |
| 7 | Picker queries wrong table | ✅ Done | Now queries `phorest_appointments` with stylist name enrichment |
| 8 | Client redo history | ✅ Done | New "Redos" tab on ClientDetailSheet with timeline + revenue impact |

### Files Changed
- `src/hooks/usePhorestCalendar.ts` — Added redo fields to PhorestAppointment interface
- `src/components/dashboard/schedule/QuickBookingPopover.tsx` — Fixed picker table, validation, total price display
- `src/components/dashboard/schedule/AppointmentDetailSheet.tsx` — Fixed role check, removed `as any` casts
- `src/components/dashboard/schedule/DayView.tsx` — Pending redo visual + RotateCcw icon
- `src/components/dashboard/schedule/WeekView.tsx` — Pending redo visual + RotateCcw icon
- `src/components/dashboard/ClientDetailSheet.tsx` — Added Redos tab
- `src/components/dashboard/clients/ClientRedoHistory.tsx` — New component
- `src/components/dashboard/TodaysQueueSection.tsx` — Added missing redo fields
- `src/data/mockAppointments.ts` — Added missing redo fields
- Migration: Added redo columns to `phorest_appointments` table
