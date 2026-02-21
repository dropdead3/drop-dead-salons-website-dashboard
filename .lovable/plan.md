
# Rename Location to "Preferred Location" and Show Full Address

## What Changes

1. **Rename label** from "Location *" to "Preferred Location" in both the collapsed and expanded views of the location field in the New Client Dialog.

2. **Default to scheduler's active location** -- already happening via `defaultLocationId` prop. No change needed here.

3. **Show full address** in the dropdown options and the collapsed display. Instead of just "North Mesa", show something like:
   - "North Mesa -- 2036 N Gilbert Rd Ste 1, Mesa, AZ 85203"

## Technical Details

**File Modified:** `src/components/dashboard/schedule/NewClientDialog.tsx`

### Changes

- **Line 243**: Change `"Location: "` to `"Preferred Location: "`
- **Line 245**: Change display from `loc.name` to `loc.name + " -- " + loc.address + ", " + loc.city` (full address)
- **Line 260**: Change label from `"Location *"` to `"Preferred Location"`
- **Lines 267-268**: Change dropdown option text from `loc.name` to include address, e.g. `{loc.name} -- {loc.address}, {loc.city}`
- **Line 263**: Update placeholder from `"Select a location"` to `"Select preferred location"`

The `locations` data already includes `address` and `city` fields, so no new queries are needed. Address formatting will gracefully handle missing fields by only showing what is available.
