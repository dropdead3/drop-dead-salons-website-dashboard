

# Browse Upcoming Appointments Feature

## Overview

Add a "Can't find your appointment?" flow that allows clients without phone numbers (or with phone lookup failures) to browse upcoming appointments within a time window and self-select for check-in, based on integrity.

---

## Current Flow Analysis

```text
CURRENT CHECK-IN FLOW
+--------+     +----------+     +-----------+     +---------+
| Idle   | --> | Lookup   | --> | Confirm   | --> | Success |
| Screen |     | (Phone)  |     | (Select)  |     | Screen  |
+--------+     +----------+     +-----------+     +---------+
                    |
                    v (No match)
              +-----------+
              | Confirm   | --> "No Appointment Found"
              | (Empty)   |     + Walk-In option
              +-----------+
```

**Problem**: Clients booked without a phone number cannot check in via the kiosk.

---

## Solution: Browse Mode

Add a new `browse` state that displays upcoming appointments within a configurable time window (e.g., 90 minutes), allowing clients to find and select their appointment by name.

```text
ENHANCED CHECK-IN FLOW
+--------+     +----------+     +-----------+     +---------+
| Idle   | --> | Lookup   | --> | Confirm   | --> | Success |
| Screen |     | (Phone)  |     | (Select)  |     | Screen  |
+--------+     +----------+     +-----------+     +---------+
                    |
                    v (No match)
              +-----------+
              | Confirm   | --> "No Appointment Found"
              | (Empty)   |     + Walk-In option
              +-----------+     + [Browse Appointments] <-- NEW
                    |
                    v (click Browse)
              +-----------+     +-----------+
              | Browse    | --> | Confirm   | --> Success
              | Screen    |     | (Select)  |
              +-----------+     +-----------+
```

---

## Implementation Details

### Part 1: Add Browse State

Update `KioskState` in `useKioskCheckin.ts`:

```typescript
export type KioskState = 
  | 'idle' 
  | 'lookup' 
  | 'confirm' 
  | 'browse'  // NEW
  | 'wrong_location' 
  | 'signing' 
  | 'success' 
  | 'walk_in' 
  | 'error';
```

### Part 2: Add Browse Action

Add a new mutation in `useKioskCheckin.ts` to fetch upcoming appointments:

```typescript
const fetchUpcomingAppointments = useMutation({
  mutationFn: async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Calculate time window: -30min to +60min from now
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const windowStart = Math.max(0, currentMinutes - 30);
    const windowEnd = currentMinutes + 60;
    
    const startTimeStr = `${Math.floor(windowStart/60).toString().padStart(2,'0')}:${(windowStart%60).toString().padStart(2,'0')}:00`;
    const endTimeStr = `${Math.floor(windowEnd/60).toString().padStart(2,'0')}:${(windowEnd%60).toString().padStart(2,'0')}:00`;

    const { data: appointments, error } = await supabase
      .from('phorest_appointments')
      .select(`
        id,
        phorest_id,
        appointment_date,
        start_time,
        end_time,
        service_name,
        status,
        stylist_user_id,
        client_name,
        stylist:employee_profiles!phorest_appointments_stylist_user_id_fkey(
          display_name,
          photo_url
        )
      `)
      .eq('appointment_date', today)
      .eq('location_id', locationId)
      .gte('start_time', startTimeStr)
      .lte('start_time', endTimeStr)
      .in('status', ['booked', 'confirmed', 'pending'])
      .order('start_time');

    return appointments || [];
  },
  onSuccess: (appointments) => {
    setSession(prev => prev ? {
      ...prev,
      lookupMethod: 'browse',
      appointments: appointments.map(a => ({
        id: a.id,
        phorest_id: a.phorest_id || undefined,
        appointment_date: a.appointment_date,
        start_time: a.start_time,
        end_time: a.end_time,
        service_name: a.service_name,
        status: a.status,
        stylist_user_id: a.stylist_user_id,
        stylist_name: (a.stylist as any)?.display_name,
        stylist_photo: (a.stylist as any)?.photo_url,
        client_name: a.client_name || undefined,
      })),
    } : null);
    setState('browse');
  },
});

const startBrowse = useCallback(() => {
  fetchUpcomingAppointments.mutate();
}, [fetchUpcomingAppointments]);
```

### Part 3: Create KioskBrowseScreen Component

New file: `src/components/kiosk/KioskBrowseScreen.tsx`

Key features:
- Display appointments grouped by time slot (e.g., every 15 minutes)
- Show privacy-safe client names: "John S." format (First name + Last initial)
- Show service name and stylist
- Glass morphism styling matching existing screens
- Large tap targets for touch interaction
- "Not listed? Try phone lookup" fallback button

```typescript
// Privacy-safe name formatting
const formatPrivacyName = (fullName: string | null) => {
  if (!fullName) return 'Guest';
  const parts = fullName.trim().split(' ');
  const firstName = parts[0];
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] + '.' : '';
  return `${firstName} ${lastInitial}`.trim();
};
```

**UI Layout:**

```text
+--------------------------------------------------+
| [← Back]              [LOGO]           [Timer] |
+--------------------------------------------------+
|                                                  |
|           Find Your Appointment                  |
|     Select your name from the list below         |
|                                                  |
|  +--------------------------------------------+  |
|  | 10:00 AM                                   |  |
|  +--------------------------------------------+  |
|  | [Photo] Sarah M. • Haircut • with Jessica  |  |
|  | [Photo] John D. • Color • with Amanda      |  |
|  +--------------------------------------------+  |
|  | 10:15 AM                                   |  |
|  +--------------------------------------------+  |
|  | [Photo] Mike R. • Blowout • with Sarah     |  |
|  +--------------------------------------------+  |
|                                                  |
|        [ Not listed? Try phone lookup ]          |
|                                                  |
+--------------------------------------------------+
```

### Part 4: Update KioskConfirmScreen

Add a "Browse Appointments" button to the "No Appointment Found" view:

```typescript
{/* Add after Walk-In button */}
<motion.button
  className="flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-xl font-medium min-w-[280px] backdrop-blur-md transition-all"
  style={{
    backgroundColor: `${textColor}10`,
    border: `1.5px solid ${textColor}20`,
    color: textColor,
  }}
  onClick={startBrowse}
  whileHover={{ 
    scale: 1.02, 
    backgroundColor: `${textColor}18`,
  }}
  whileTap={{ scale: 0.98 }}
>
  <Calendar className="w-6 h-6" />
  Browse Upcoming Appointments
</motion.button>
```

### Part 5: Update Provider and Router

**KioskProvider.tsx:**
- Add `startBrowse` action and `isBrowsing` loading state to context

**Kiosk.tsx:**
- Add `{state === 'browse' && <KioskBrowseScreen key="browse" />}`

---

## Privacy & Integrity Considerations

| Concern | Mitigation |
|---------|------------|
| Privacy | Show only "FirstName L." format, never full names |
| Time window | Limit to ~90 minute window to reduce list size |
| Abuse prevention | Log all browse-based check-ins with `check_in_method: 'browse'` |
| Analytics | Track browse usage in `kiosk_analytics` for monitoring |

---

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/hooks/useKioskCheckin.ts` | Modify | Add `browse` state, `startBrowse` action, `fetchUpcomingAppointments` mutation |
| `src/components/kiosk/KioskProvider.tsx` | Modify | Add `startBrowse` and `isBrowsing` to context |
| `src/components/kiosk/KioskBrowseScreen.tsx` | Create | New browse screen component |
| `src/components/kiosk/KioskConfirmScreen.tsx` | Modify | Add "Browse Appointments" button |
| `src/pages/Kiosk.tsx` | Modify | Add browse state rendering |

---

## Analytics Integration

When checking in via browse mode, update the analytics logging:

```typescript
await supabase.from('kiosk_analytics').insert({
  // ... existing fields
  check_in_method: 'browse',  // Track specifically
  browse_list_size: appointments.length,  // How many were shown
});
```

---

## Summary

This feature adds a secondary path for clients who can't be found by phone number:

1. Phone lookup fails -> Show "No Appointment Found"
2. Client taps "Browse Upcoming Appointments"
3. Kiosk shows appointments within a 90-minute window (30min past to 60min future)
4. Client finds their name (privacy-formatted) and taps to select
5. Normal check-in flow continues

The integrity-based approach is balanced with privacy protections (first name + last initial only) and analytics tracking to monitor for any misuse patterns.

