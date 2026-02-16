
# Client-Facing Kiosk Booking Wizard

## Overview

Add a self-service booking wizard to the kiosk tablet check-in system. When "Enable Walk-Ins" is active and a client taps "Continue as Walk-In," they will be guided through a touch-friendly booking flow: select services, optionally pick a stylist, choose a date/time, enter their name and phone, and confirm. All behavioral options (same-day vs. future booking, stylist selection visibility) are configurable per location in the dashboard settings.

## New Settings (Configurable per Location)

Three new settings added to the kiosk configuration, both in the dashboard settings panel and the on-device kiosk settings dialog:

| Setting | Description | Default |
|---------|-------------|---------|
| `enable_self_booking` | Master toggle -- when ON, walk-in clients see the booking wizard instead of a simple walk-in notification | `false` |
| `self_booking_allow_future` | When ON, clients can book up to 14 days ahead. When OFF, same-day only. | `false` |
| `self_booking_show_stylists` | When ON, clients see stylist photos and can choose. When OFF, auto-assigns first available. | `true` |

## User Flow (Kiosk)

```text
Idle -> Lookup -> No Appointment Found -> "Continue as Walk-In"
                                              |
                                    +--------------------+
                                    | KioskBookingWizard |
                                    +--------------------+
                                              |
                             1. Select Service Category
                                              |
                             2. Select Services
                                              |
                      3. Select Stylist (if setting enabled)
                                              |
                      4. Select Date + Time (date picker
                         shows today-only or 14-day range
                         based on setting)
                                              |
                             5. Enter Name + Phone
                                              |
                             6. Confirm + Book
                                              |
                                        Success Screen
```

## What Gets Built

### 1. Database Migration
Add three new columns to `organization_kiosk_settings`:
- `enable_self_booking` (boolean, default false)
- `self_booking_allow_future` (boolean, default false)
- `self_booking_show_stylists` (boolean, default true)

### 2. Update KioskSettings Type and Defaults
Add the three new fields to:
- `KioskSettings` interface in `useKioskSettings.ts`
- `DEFAULT_KIOSK_SETTINGS` constant
- `LocalSettings` type in `KioskSettingsContent.tsx`

### 3. Dashboard Settings UI (KioskSettingsContent.tsx)
In the "Behavior" tab, add a new "Self-Service Booking" section (below the existing "Allow Walk-Ins" toggle):
- **Enable Self-Service Booking** toggle -- with description: "Let walk-in clients book their own appointment from the kiosk"
- When enabled, show two sub-settings:
  - **Allow Future Bookings** toggle -- "Clients can book up to 14 days ahead (otherwise same-day only)"
  - **Show Stylist Selection** toggle -- "Let clients choose their stylist (otherwise first available is assigned)"
- These sub-settings are visually indented and only visible when `enable_self_booking` is ON

### 4. On-Device Kiosk Settings (KioskSettingsDialog.tsx)
Mirror the same three toggles in the on-device settings dialog's "Behavior" tab, so admins can configure directly from the tablet.

### 5. KioskBookingWizard Component (New)
Create `src/components/kiosk/KioskBookingWizard.tsx` -- a full-screen, touch-optimized, multi-step booking wizard that matches the existing kiosk glass aesthetic (backdrop blur, accent color borders, large touch targets).

**Steps:**
1. **Service Selection** -- Category-first navigation (like WalkInDialog), large touch targets, shows service name + duration + price
2. **Stylist Selection** (conditional) -- Grid of stylist cards with photos, "First Available" option always present. Only shown if `self_booking_show_stylists` is enabled
3. **Date + Time** -- If `self_booking_allow_future` is ON, show a horizontal scrollable date picker (next 14 days, skip Sundays). If OFF, date is auto-set to today. Time slots shown as a grid of large buttons (30-min intervals within operating hours)
4. **Client Info** -- Name (required) and phone number (required) with kiosk-style large input fields and the existing KioskNumberPad
5. **Review + Confirm** -- Summary card showing all selections, large "Book Appointment" button

**Data sources (all public/no-auth, using existing patterns):**
- Services: Query `phorest_services` filtered by `is_active` and the kiosk location's `phorest_branch_id`
- Stylists: Query `phorest_staff_mapping` + `employee_profiles` filtered by branch and `show_on_calendar`
- Booking: Insert into `phorest_appointments` with `status: 'checked_in'` and a `phorest_id` prefixed with `kiosk-walkin-`

### 6. Update KioskProvider + useKioskCheckin
- Add `'booking'` to the `KioskState` union type
- Add a `startBooking` action that transitions to the booking state
- Modify `startWalkIn` -- when `enable_self_booking` is ON, transition to `'booking'` state instead of `'walk_in'`
- Expose booking-related settings (allow_future, show_stylists) through the provider

### 7. Wire Up in Kiosk.tsx
Add the new state to the `AnimatePresence` block:
```
{state === 'booking' && <KioskBookingWizard key="booking" />}
```

### 8. Analytics
Log kiosk self-bookings to `kiosk_analytics` with `is_walk_in: true` and `check_in_method: 'self_booking'`

## Technical Details

### Files Modified:
- `src/hooks/useKioskSettings.ts` -- Add 3 new fields to interface + defaults
- `src/hooks/useKioskCheckin.ts` -- Add `'booking'` state, `startBooking` action
- `src/components/kiosk/KioskProvider.tsx` -- Expose new settings and `startBooking`
- `src/components/kiosk/KioskConfirmScreen.tsx` -- Route "Continue as Walk-In" to booking wizard when `enable_self_booking` is ON
- `src/components/dashboard/settings/KioskSettingsContent.tsx` -- Add 3 toggles in Behavior tab
- `src/components/kiosk/KioskSettingsDialog.tsx` -- Add 3 toggles in Behavior tab
- `src/pages/Kiosk.tsx` -- Add `booking` state rendering

### Files Created:
- `src/components/kiosk/KioskBookingWizard.tsx` -- The multi-step booking wizard component

### Database Migration:
```sql
ALTER TABLE organization_kiosk_settings
  ADD COLUMN enable_self_booking boolean DEFAULT false,
  ADD COLUMN self_booking_allow_future boolean DEFAULT false,
  ADD COLUMN self_booking_show_stylists boolean DEFAULT true;
```

### No Edge Function Changes
The kiosk booking wizard will insert directly into `phorest_appointments` using existing public RLS policies (same pattern as the browse/walk-in flow already uses). If the existing RLS doesn't allow anonymous inserts, we'll add a policy for kiosk walk-in bookings matching the existing kiosk insert patterns.

### Design Principles
- All UI follows existing kiosk glass aesthetic (backdrop blur, accent borders, large rounded corners)
- Touch targets are minimum 48x48px, most are 60px+
- Uses the kiosk's configured colors (background, text, accent) for consistency
- Back button on every step to allow corrections
- Idle timer continues during booking flow (auto-resets if abandoned)
