

## Show Appointments in Drilldown Even Without Staff Mapping

### Problem

The hook (`useLiveSessionSnapshot.ts`) correctly finds 5 active appointments, but when it tries to resolve staff identities via `phorest_staff_mapping`, it finds zero matches (none of today's 9 active Phorest staff IDs exist in the mapping table). At that point it returns empty `stylistDetails`, so the drilldown shows "0 stylists working" and no appointment rows.

### Solution

Remove the early-return bailout when staff aren't mapped. Instead, build `StylistDetail` entries directly from the appointment data, using fallback names.

### Changes

**`src/hooks/useLiveSessionSnapshot.ts`**

1. After resolving staff mappings, also query `phorest_staff_mapping` for `phorest_staff_name` to get Phorest-side names (even if `user_id` is null).
2. Remove the early return at line 94 that skips everything when `userIds.length === 0`.
3. When building `StylistDetail` entries, use this name resolution waterfall:
   - Employee profile display name (if mapped to a user)
   - `phorest_staff_name` from the mapping table (if exists but not linked)
   - Sequential fallback: "Stylist 1", "Stylist 2", etc.
4. All appointment data (service name, client name, start/end times, progress) is already available from the appointments query, so rows will be fully populated regardless of mapping status.

### Technical Detail

The mapping table already stores `phorest_staff_name` from Phorest syncs. The query at line 80-83 just needs to also select that column. Then for unmapped staff, we use that name. For staff not in the mapping table at all, we use the "Stylist N" fallback pattern already established elsewhere in the codebase.

### Result

- The pill will still show "5 stylists, 0 assistants in service now" (correctly reflecting 5 unique staff IDs with active appointments)
- The drilldown will show "5 appointments in progress . 5 stylists working"
- Each row will display the staff member's Phorest name (or "Stylist N" fallback), their current service, client name, appointment progress, and wrap-up time
- Once staff are linked in Settings, real profile photos and display names will automatically appear

