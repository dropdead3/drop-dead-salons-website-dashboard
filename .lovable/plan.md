
# Schedule Feature Enhancement Plan

## Current State Summary

The Schedule feature already includes:
- Day, Week, Month, and Agenda views with appointment management
- Booking wizard with client/service/stylist steps
- Checkout flow with tip recording, promo codes, and receipt PDF
- Calendar filters (client type, confirmation status, lead source)
- Staff filtering and location selection
- Appointment detail sheet with notes, status transitions
- AI Scheduling Copilot panel (exists but not integrated into the schedule page)
- Reschedule hook (exists but no drag-and-drop UI wired to it)

## Phase 1: Visual Polish and UX Refinements

### 1A. Design Token Alignment
Align the Schedule page to the Zura Design Token System. Currently, the schedule header, action bar, and views use hardcoded Tailwind classes instead of importing from `design-tokens.ts`.

**Changes:**
- `ScheduleHeader.tsx`: Replace inline typography with `tokens.heading.page` for the date display and `tokens.label.tiny` for sub-labels like "Today"
- `ScheduleActionBar.tsx`: Use `tokens.body.muted` for the appointment count text
- `DayView.tsx` and `WeekView.tsx`: Use `tokens.status` for appointment card status backgrounds instead of locally defined `STATUS_COLORS` maps (deduplicate the 3 separate copies of status color configs into the shared token system)

### 1B. Status Color Consolidation
There are currently **4 separate copies** of status color mappings (in `usePhorestCalendar.ts`, `DayView.tsx`, `WeekView.tsx`, `AgendaView.tsx`). Consolidate into a single export from `design-tokens.ts` and import everywhere.

### 1C. Action Bar Refinement
- Add a subtle animated highlight when an appointment is selected (pulse border on the action bar)
- Show the selected client name and service in the center of the action bar instead of just the count
- Add a "View Details" button alongside existing actions for quick access to the detail sheet

## Phase 2: Drag-and-Drop Rescheduling (Day View)

### 2A. DnD Integration
Wire up `@dnd-kit/core` (already installed) to the DayView component. The `useRescheduleAppointment` hook already exists and handles both local and Phorest-synced updates.

**Changes:**
- `DayView.tsx`: Wrap the calendar grid in a `DndContext` provider
- Make each `AppointmentCard` a draggable item using `useDraggable`
- Make each 15-minute time slot row a droppable target using `useDroppable`
- On drop, calculate the new date, time, and staff column, then call `useRescheduleAppointment`
- Add a drag overlay that shows the appointment card following the cursor
- Add visual feedback: highlight valid drop zones (slots within working hours), dim invalid zones (past slots)

### 2B. Drag Confirmation
After a drop, show a brief toast confirmation with "Undo" option (using sonner's action toast) that reverts the move within 5 seconds if clicked.

### 2C. Cross-Staff Drag
When dragging between stylist columns in Day View, the appointment can be reassigned to a different staff member. The `useRescheduleAppointment` hook already accepts `newStaffId`.

## Phase 3: Integrated AI Scheduling Copilot Panel

### 3A. Collapsible Side Panel
Add the existing `SchedulingCopilotPanel` component to the Schedule page as a collapsible right-side panel (resizable via `react-resizable-panels`, already installed).

**Changes:**
- `Schedule.tsx`: Import `SchedulingCopilotPanel` and wrap the calendar + copilot in a `PanelGroup` with `Panel` + `PanelResizeHandle`
- Add a toggle button in the ScheduleHeader (Sparkles icon) to show/hide the copilot panel
- Pass the current `date`, `selectedLocation`, and selected service duration to the copilot
- Wire the `onSelectSlot` callback to open the BookingWizard with pre-filled defaults

### 3B. Contextual Suggestions
When a user clicks an empty slot in Day View, the copilot panel automatically focuses on that time range and shows why it's a good or suboptimal slot.

## Phase 4: Schedule Utilization Metrics

### 4A. Utilization Bar in Header
Add a compact utilization indicator to the ScheduleHeader showing:
- **Fill Rate**: Booked hours / Available hours for the selected day or week
- **Gap Count**: Number of 30+ minute gaps in today's schedule
- **Revenue Potential**: Estimated revenue from open slots (based on average service price)

**Implementation:**
- Create a new component `ScheduleUtilizationBar.tsx` that calculates metrics from the appointments array and staff working hours
- Display as a thin progress bar + micro-stats row between the header and the calendar grid
- Use `tokens.stat.large` for key numbers and `tokens.body.muted` for labels

### 4B. Gap Highlighting
In DayView, visually highlight gaps (empty periods between appointments) with a subtle dashed-border overlay and a "Fill Gap" quick action that opens the booking wizard for that slot.

## Phase 5: Mobile Schedule Improvements

### 5A. Touch-Optimized Agenda View
The AgendaView already renders on mobile, but enhance it:
- Add pull-to-refresh using a touch gesture that triggers calendar sync
- Add swipe-left on appointment cards to reveal quick actions (Check In, Confirm, Cancel)
- Increase card touch targets to minimum 44px

### 5B. Mobile Navigation
- Replace the desktop header with a mobile-specific compact header
- Add swipe-left/right gesture on the calendar area to navigate between days
- Bottom sheet for filters instead of popover (already using vaul, which is installed)

### 5C. Mobile Day View
Create a simplified single-column mobile day view (no side-by-side stylist columns) that stacks appointments chronologically with larger touch targets.

## Technical Approach Summary

| Phase | Files Created | Files Modified | Complexity |
|-------|--------------|----------------|------------|
| 1: Visual Polish | 0 | 5-6 | Low |
| 2: Drag-and-Drop | 1 (DragOverlay component) | 2 (DayView, Schedule) | Medium |
| 3: Copilot Panel | 0 | 2 (Schedule, ScheduleHeader) | Low |
| 4: Utilization | 1 (ScheduleUtilizationBar) | 2 (Schedule, DayView) | Medium |
| 5: Mobile | 1-2 (MobileDayView, mobile header) | 3-4 (AgendaView, Schedule, ScheduleHeader) | Medium |

## Recommended Build Order

Start with Phase 1 (polish) since it cleans up the foundation. Then Phase 3 (Copilot) since it reuses existing components. Then Phase 2 (DnD) and Phase 4 (utilization) in parallel. Phase 5 (mobile) last since it builds on all prior work.

## What This Does NOT Change
- The BookingWizard flow remains unchanged
- The CheckoutSummarySheet remains unchanged
- Backend appointment sync logic is untouched
- Permission model and RLS policies stay the same
