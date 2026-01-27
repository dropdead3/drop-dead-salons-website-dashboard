
# Operations/Receptionist Check-In Workflow

## Overview

This plan creates a dedicated **Front Desk Command Center** for receptionists and operations staff. While the Schedule page provides full calendar functionality, this workflow focuses on the **today-only** arrival queue that receptionists need at a glance.

## Current State Analysis

| Component | What Exists |
|-----------|-------------|
| Schedule Page | Full calendar with Check In / Pay / Confirm action bar |
| Action Workflow | Status transitions: booked -> confirmed -> checked_in -> completed |
| Lead Sources | Walk-in and Phone Call tracked in LeadInbox |
| Receptionist Permissions | `view_team_appointments`, `view_all_locations_calendar`, `create_appointments` |
| Dashboard Template | "Operations View" with sections: `quick_stats`, `schedule`, `tasks`, `announcements` |

**Gap**: No dedicated "Today's Arrivals" view optimized for front desk workflow. Receptionists must navigate to full Schedule page and filter manually.

## Proposed Solution

Create a **Today's Queue** dashboard section specifically designed for receptionist workflows:

```text
+------------------------------------------+
|  TODAY'S QUEUE - Mesa Location           |
|  Jan 27, 2026 · 12 Appointments          |
+------------------------------------------+
|  ARRIVALS                                |
|  +-----------------+  +----------------+ |
|  | 9:00 AM         |  | 9:30 AM        | |
|  | Sarah J.        |  | Mike T.        | |
|  | Full Highlights |  | Men's Cut      | |
|  | with Eric D.    |  | with Amy L.    | |
|  | [Confirmed ✓]   |  | [Check In]     | |
|  +-----------------+  +----------------+ |
|                                          |
|  CHECKED IN (In Service)                 |
|  +-----------------+  +----------------+ |
|  | 8:30 AM         |  | 8:45 AM        | |
|  | Lisa M.         |  | John K.        | |
|  | Color Service   |  | Blowout        | |
|  | ~45 min left    |  | ~15 min left   | |
|  | [Pay & Checkout]|  | [Pay & Checkout]|
|  +-----------------+  +----------------+ |
+------------------------------------------+
```

## New Components

### 1. TodaysQueueSection Component

**File**: `src/components/dashboard/TodaysQueueSection.tsx`

A dashboard widget showing:
- **Arrivals Queue**: Upcoming appointments for today, sorted by time
- **In Service**: Currently checked-in clients with estimated completion
- **Quick Actions**: Check In, Pay, View Details buttons on each card
- **Location Filter**: Dropdown for multi-location operations

Key features:
- Auto-refreshes every 30 seconds
- Highlights late arrivals (15+ minutes past appointment time)
- Shows stylist assignments and service details
- Color-coded status badges (confirmed=green, waiting=amber, checked-in=blue)

### 2. QueueCard Component

**File**: `src/components/dashboard/operations/QueueCard.tsx`

Individual arrival card with:
- Client name and phone (click to copy)
- Service name and estimated duration
- Stylist assignment
- Time remaining estimate (for checked-in clients)
- Action buttons: Check In / Pay / View Notes

### 3. Operations Quick Stats

**File**: `src/components/dashboard/operations/OperationsQuickStats.tsx`

Real-time stats bar showing:
- **Waiting**: Count of confirmed clients not yet checked in
- **In Service**: Count of checked-in clients
- **Completed Today**: Finished appointments count
- **No-Shows**: Count of no-shows for the day

### 4. useTodaysQueue Hook

**File**: `src/hooks/useTodaysQueue.ts`

Data fetching hook that:
- Fetches today's appointments for selected location
- Groups by status (confirmed, checked_in, completed, etc.)
- Calculates wait times and estimated completion
- Provides status update mutations
- Subscribes to realtime updates

## Dashboard Integration

### Update Operations Template

Modify the seeded `operations` template in database to include `todays_queue`:

```sql
UPDATE dashboard_layout_templates 
SET layout = '{"sections": ["operations_quick_stats", "todays_queue", "schedule", "tasks"], "widgets": ["schedule", "birthdays"]}'
WHERE role_name = 'operations';
```

### Update DashboardHome Rendering

Add conditional rendering for the new operations sections:

```tsx
{/* Operations Quick Stats - receptionist role */}
{roles.includes('receptionist') && (
  <VisibilityGate elementKey="operations_quick_stats">
    <OperationsQuickStats locationId={selectedLocation} />
  </VisibilityGate>
)}

{/* Today's Queue - receptionist/operations role */}
{(roles.includes('receptionist') || layout.sections.includes('todays_queue')) && (
  <VisibilityGate elementKey="todays_queue">
    <TodaysQueueSection locationId={selectedLocation} />
  </VisibilityGate>
)}
```

## User Flow

### Receptionist Daily Workflow

```text
1. Login -> Dashboard shows Today's Queue automatically
2. See "Arrivals" section with upcoming clients
3. Client walks in -> Click "Check In" on their card
4. Card moves to "In Service" section with timer
5. Service completes -> Click "Pay & Checkout" 
6. Opens CheckoutSummarySheet (existing component)
7. Complete payment -> Card disappears
```

### Walk-In Handling

Add a "Quick Walk-In" button:
1. Opens simplified booking dialog (pre-set to today)
2. Select service and available stylist
3. Create appointment in "checked_in" status immediately
4. Client appears in "In Service" queue

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/TodaysQueueSection.tsx` | Main queue dashboard section |
| `src/components/dashboard/operations/QueueCard.tsx` | Individual appointment card |
| `src/components/dashboard/operations/OperationsQuickStats.tsx` | Real-time stats bar |
| `src/components/dashboard/operations/WalkInDialog.tsx` | Quick walk-in booking |
| `src/hooks/useTodaysQueue.ts` | Data fetching and mutations |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/DashboardHome.tsx` | Add TodaysQueueSection and OperationsQuickStats rendering |
| `src/hooks/useDashboardLayout.ts` | Add 'operations' sections to DEFAULT_LAYOUT sections array |

## Database Changes

Add `todays_queue` and `operations_quick_stats` to visibility elements:

```sql
INSERT INTO dashboard_element_visibility (element_key, element_name, element_category, role, is_visible)
SELECT 'todays_queue', 'Today''s Queue', 'operations', r.name, 
  CASE WHEN r.name IN ('receptionist', 'admin', 'manager', 'super_admin') THEN true ELSE false END
FROM roles r
ON CONFLICT DO NOTHING;

INSERT INTO dashboard_element_visibility (element_key, element_name, element_category, role, is_visible)
SELECT 'operations_quick_stats', 'Operations Quick Stats', 'operations', r.name,
  CASE WHEN r.name IN ('receptionist', 'admin', 'manager', 'super_admin') THEN true ELSE false END
FROM roles r
ON CONFLICT DO NOTHING;
```

Update operations template:
```sql
UPDATE dashboard_layout_templates 
SET layout = '{"sections": ["operations_quick_stats", "todays_queue", "schedule", "tasks"], "widgets": ["schedule", "birthdays"], "pinnedCards": []}'::jsonb
WHERE role_name = 'operations';
```

## Technical Details

### useTodaysQueue Hook Implementation

```typescript
interface QueueAppointment extends PhorestAppointment {
  waitTimeMinutes: number;       // Minutes since arrival time (if late)
  estimatedCompleteIn: number;   // Minutes until service ends
  isLate: boolean;               // Past appointment time without check-in
}

interface TodaysQueueData {
  waiting: QueueAppointment[];      // Confirmed, not yet arrived
  inService: QueueAppointment[];    // Checked in
  completed: QueueAppointment[];    // Paid out
  noShows: QueueAppointment[];      // Marked no-show
  stats: {
    waitingCount: number;
    inServiceCount: number;
    completedCount: number;
    noShowCount: number;
    totalRevenue: number;
  };
}
```

### Queue Card Status Logic

```typescript
// Status display logic
const getCardStatus = (apt: QueueAppointment) => {
  if (apt.status === 'confirmed') {
    if (apt.isLate) return { label: 'Late', color: 'amber' };
    return { label: 'Confirmed', color: 'green' };
  }
  if (apt.status === 'checked_in') {
    return { label: `~${apt.estimatedCompleteIn}min left`, color: 'blue' };
  }
  return { label: apt.status, color: 'gray' };
};
```

### Real-time Updates

Subscribe to appointment changes for live queue updates:

```typescript
const channel = supabase
  .channel('queue-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'phorest_appointments',
    filter: `appointment_date=eq.${format(new Date(), 'yyyy-MM-dd')}`,
  }, () => {
    refetch();
  })
  .subscribe();
```

## Benefits

1. **Dedicated View**: Receptionists get exactly what they need without navigating full calendar
2. **Visual Priority**: Late arrivals and in-service timers draw attention to action items
3. **Quick Actions**: One-click check-in and checkout from dashboard
4. **Walk-In Support**: Fast path for unscheduled arrivals
5. **Real-time**: Live updates as status changes occur
6. **Role-Appropriate**: Automatically shows for receptionist role, hidden for stylists

## Future Enhancements

- Add SMS notification trigger when client is next in queue
- Integrate waitlist for when stylists are running behind
- Add "Running Late" client notification button
- Show stylist availability for walk-in routing
