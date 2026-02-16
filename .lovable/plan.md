

# Kiosk Features -- Independent Feature Toggles

## Problem

The current "Kiosk Mode" selector forces a choice between Check-In and Self-Service Booking. In reality, a salon kiosk should support both simultaneously -- a client walks up, checks in for their existing appointment OR books a new one. These are independent capabilities, not exclusive modes.

## Solution

Replace the exclusive radio-style mode selector with independent feature toggles. Each feature gets its own card with an enable/disable switch and contextual sub-settings that appear when the feature is active.

### New Layout

```text
+------------------------------------------+
| KIOSK FEATURES                           |
| Enable the capabilities your kiosk offers|
|                                          |
| +--------------------------------------+ |
| | [ON] Check-In                        | |
| |   Clients look up and check in for   | |
| |   existing appointments              | |
| |   > Require Confirmation Tap  [ON]   | |
| |   > Show Wait Time Estimate  [OFF]   | |
| |   > Show Stylist Photo       [ON]    | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | [ON] Walk-In Registration            | |
| |   Let clients register without an    | |
| |   appointment                        | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | [OFF] Self-Service Booking           | |
| |   Walk-in clients can browse         | |
| |   services and book appointments     | |
| |   > Allow Future Bookings    [OFF]   | |
| |   > Show Stylist Selection   [ON]    | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | [OFF] Form Signing                   | |
| |   Prompt new clients to sign intake  | |
| |   forms during check-in              | |
| +--------------------------------------+ |
+------------------------------------------+
```

### What Changes

1. **Remove** the "Kiosk Mode" card (the exclusive radio selector at lines 421-475)
2. **Replace** it with a "Kiosk Features" card containing independent feature toggles:
   - **Check-In** (always on, not toggleable -- this is the core kiosk purpose) with its sub-settings: Require Confirmation Tap, Show Wait Time Estimate, Show Stylist Photo
   - **Walk-In Registration** (`enable_walk_ins`) -- standalone toggle
   - **Self-Service Booking** (`enable_self_booking`) with sub-settings: Allow Future Bookings, Show Stylist Selection
   - **Form Signing** (`require_form_signing`) -- standalone toggle
   - **Feedback Prompt** (`enable_feedback_prompt`) -- standalone toggle

3. **Simplify the Behavior tab** -- Move feature-specific toggles out of the Behavior tab and into the Features card. The Behavior tab will retain only general device behavior: Idle Timeout and Exit PIN.

4. **Remove** `handleKioskModeChange` and the derived `kioskMode` variable -- no longer needed since features are independent.

5. **Validation guard**: If both Check-In and Self-Service Booking are disabled (edge case), show a subtle warning: "At least one feature should be enabled for the kiosk to be useful."

### Gap Analysis and Enhancements

- **Feature Feedback Loop**: When Self-Service Booking is enabled, the idle screen CTA text should hint at booking capability (e.g., "Tap to check in or book"). This is a follow-up enhancement in the kiosk idle screen, not part of this settings change.
- **Per-Feature Analytics**: The kiosk_analytics table already logs event types. No schema change needed, but a future enhancement could surface feature-specific usage stats in this settings card (e.g., "42 check-ins, 8 bookings this week").
- **Feature Dependencies**: If "Form Signing" is on but no forms exist, a warning could be shown. This is a future enhancement.

## Technical Details

**File modified:** `src/components/dashboard/settings/KioskSettingsContent.tsx`

1. Remove the Kiosk Mode card (lines 421-475) and replace with a "Kiosk Features" card containing grouped feature switches
2. Remove `kioskMode` derived variable and `handleKioskModeChange` handler (lines 408-417)
3. Move check-in-specific toggles (Require Confirmation, Show Wait Time, Show Stylist Photo) from the Behavior tab into the Check-In feature group
4. Move self-booking sub-settings (Allow Future Bookings, Show Stylist Selection) into the Self-Service Booking feature group
5. Move Form Signing and Feedback Prompt toggles from the Behavior tab into standalone feature toggles
6. Behavior tab retains only: Idle Timeout, Exit PIN, and Allow Walk-Ins
7. Each feature group uses a collapsible pattern: switch header with sub-settings revealed via `AnimatePresence` when enabled

No database changes, no hook changes, no new files.
