

# Rename "Check-In Kiosk" to "Kiosks" + Add Kiosk Mode Selector

## What Changes

### 1. Rename the Settings Card

In `Settings.tsx`, update the kiosk category definition:
- **Label**: "Check-In Kiosk" becomes **"Kiosks"**
- **Description**: "Device appearance, branding & behavior" becomes **"Check-in, self-service booking & device configuration"**

### 2. Add a Kiosk Mode Selector (Top of KioskSettingsContent)

Replace the deeply nested self-booking toggles in the Behavior tab with a prominent **Kiosk Mode** card at the top of the settings content (above the Appearance/Content/Behavior tabs). This gives immediate visibility into what type of kiosk is being configured.

The mode selector will be a styled toggle group with two options:

| Mode | Icon | Label | Description |
|------|------|-------|-------------|
| Check-In Only | `UserCheck` | Check-In | Clients look up appointments and check in |
| Self-Service Booking | `CalendarPlus` | Self-Service Booking | Walk-in clients can also book their own appointments |

- Selecting "Self-Service Booking" automatically enables both `enable_walk_ins` and `enable_self_booking`
- Selecting "Check-In Only" sets `enable_self_booking` to false (preserves `enable_walk_ins` state independently)
- The mode selector is a visual radio group with large touch-friendly cards, consistent with the existing appearance mode selector pattern already in the file

### 3. Restructure the Behavior Tab

- Remove the nested self-booking toggles from inside the "Allow Walk-Ins" section
- Keep the "Allow Walk-Ins" toggle as a standalone toggle (still relevant for check-in mode)
- When "Self-Service Booking" mode is selected, show the two sub-settings (**Allow Future Bookings** and **Show Stylist Selection**) as a dedicated "Booking Options" section in the Behavior tab -- no longer nested 2 levels deep
- This makes the configuration hierarchy flatter and easier to understand

### Summary of Visual Layout

```text
+------------------------------------------+
| KIOSK MODE                               |
|  [Check-In]    [Self-Service Booking]     |
+------------------------------------------+

+------------------------------------------+
| Location Selector | Save | Reset         |
+------------------------------------------+
| Tabs: Appearance | Content | Behavior    |
|                                          |
| (Behavior tab when Self-Service active): |
|   Idle Timeout: [60]                     |
|   [x] Allow Walk-Ins                     |
|   --- Booking Options ---                |
|   [x] Allow Future Bookings             |
|   [x] Show Stylist Selection            |
|   [x] Require Confirmation Tap          |
|   ...remaining toggles...               |
+------------------------------------------+
```

## Technical Details

**Files modified:**
- `src/pages/dashboard/admin/Settings.tsx` -- Update label and description for kiosk category (2 lines)
- `src/components/dashboard/settings/KioskSettingsContent.tsx` -- Add kiosk mode selector card above tabs; restructure Behavior tab to flatten self-booking options

**No database changes, no new files, no hook changes.** The underlying settings fields (`enable_self_booking`, `self_booking_allow_future`, `self_booking_show_stylists`) remain the same -- this is purely a UI reorganization for clarity.
