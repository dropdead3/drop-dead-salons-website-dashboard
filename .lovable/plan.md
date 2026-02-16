

# Kiosk Live Status -- Heartbeat System

## What This Does

Adds a real-time "Online" / "Offline" indicator to each row in the Kiosk Status by Location card. The kiosk iPad app will register itself as a device and send a heartbeat every 60 seconds. The dashboard checks the `last_heartbeat_at` timestamp -- if it's within the last 3 minutes, the kiosk is "Online."

## Good News: The Schema Already Exists

The `kiosk_devices` table was created in an earlier migration but never wired up. It already has:
- `last_heartbeat_at` (timestamp)
- `is_active` (boolean)
- `device_token` (unique identifier)
- `location_id` and `organization_id`
- `device_name` (e.g., "Front Desk iPad")
- RLS policies for org members to view and org admins to manage

No database schema changes needed.

## What Changes

### 1. Database Migration: Add public heartbeat policy

The kiosk runs unauthenticated, so it needs a public RLS policy to:
- INSERT its own device row (self-registration on first load)
- UPDATE its own row's `last_heartbeat_at` (heartbeat ping)

We add two policies:
- "Kiosk can self-register device" -- INSERT with `WITH CHECK (true)`
- "Kiosk can update own heartbeat" -- UPDATE using `device_token` match, restricted to only updating `last_heartbeat_at`

### 2. KioskProvider: Add heartbeat logic

When the kiosk loads, it will:
1. Generate or retrieve a stable `device_token` from `localStorage` (persists across reloads)
2. Upsert a row in `kiosk_devices` with its `location_id`, `organization_id`, and a device name derived from the User-Agent (e.g., "iPad - Safari")
3. Start an interval that updates `last_heartbeat_at` every 60 seconds
4. On unmount / page hide, send a final heartbeat (using `navigator.sendBeacon` pattern for reliability)

### 3. New hook: `useKioskDeviceStatus(orgId)`

A query hook that fetches all `kiosk_devices` rows for the org and returns a map of `location_id` to device status:
- **Online**: `last_heartbeat_at` is within the last 3 minutes and `is_active = true`
- **Offline**: `last_heartbeat_at` exists but is older than 3 minutes
- **Never Connected**: No device row exists for that location

### 4. KioskLocationStatusCard: Add "Device" column

Add a new column to the status table between "Location" and the feature columns:

| Location | Device | Check-In | Walk-In | Booking | Forms | Status |

The Device column shows:
- Green pulsing dot + "Online" -- heartbeat within 3 minutes
- Gray dot + "Offline" -- heartbeat older than 3 minutes
- Dash -- no device ever registered

This reuses the existing `OnlineIndicator` component from the platform UI.

## Technical Details

### Files

1. **Database migration** -- Add two RLS policies on `kiosk_devices`:
   - Public INSERT policy for kiosk self-registration
   - Public UPDATE policy scoped to heartbeat column only (uses a security definer function to restrict updates to `last_heartbeat_at` only)

2. **`src/components/kiosk/KioskProvider.tsx`** -- Add heartbeat effect:
   - Generate/retrieve `deviceToken` from localStorage
   - On mount: upsert device row with `location_id`, `organization_id`, `device_name`
   - Every 60 seconds: update `last_heartbeat_at = now()`
   - On `visibilitychange` (hidden): update `is_active = false`
   - On `visibilitychange` (visible): resume heartbeat, set `is_active = true`

3. **`src/hooks/useKioskSettings.ts`** -- Add `useKioskDeviceStatus(orgId)` hook:
   - Fetches `kiosk_devices` where `organization_id = orgId`
   - Returns `Map<locationId, { isOnline: boolean, lastSeen: Date | null, deviceName: string }>`
   - Uses `refetchInterval: 60000` (polls every minute on dashboard)

4. **`src/components/dashboard/settings/KioskLocationStatusCard.tsx`** -- Add "Device" column:
   - Import `useKioskDeviceStatus` and `OnlineIndicator`
   - Add column header with a `Tablet` icon
   - Render `OnlineIndicator` + tooltip showing device name and last seen time

### Heartbeat Thresholds

- **Online**: `last_heartbeat_at` within 3 minutes (allows for 2 missed beats + buffer)
- **Offline**: older than 3 minutes
- **Never Connected**: no row for that location

### Device Token Strategy

Uses `crypto.randomUUID()` stored in `localStorage` under key `zura-kiosk-device-token`. This:
- Persists across page reloads and browser restarts
- Is unique per physical device
- Allows the same iPad to reconnect after power cycles without creating duplicate entries

