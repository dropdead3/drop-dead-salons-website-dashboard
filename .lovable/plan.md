
## Update Happening Now Drill-Down: Name Periods and Client Names

Two formatting changes to each stylist row in the drill-down dialog.

### 1. Add period after last-name initials
All shortened last names (single letter) get a trailing period. This applies to:
- Stylist names (e.g., "Sarah M" becomes "Sarah M.")
- "Assisted by" names (e.g., "Jamie R" becomes "Jamie R.")
- Both demo data and live data from the hook

### 2. Show "on [Client Name]" after the service
The service line changes from "Balayage & Tone" to "Balayage & Tone on Jessica Smith", showing which client is in the chair.

---

### Technical Details

**`src/hooks/useLiveSessionSnapshot.ts`**
- Add `clientName: string | null` to the `StylistDetail` interface
- Include `client_name` in the appointment select query
- Pass the client name from the current in-session appointment into the detail object

**`src/components/dashboard/LiveSessionDrilldown.tsx`**
- Update all demo data names to include trailing periods (e.g., "Sarah M.")
- Update demo data to include `clientName` values (e.g., "Jessica Smith")
- Update "Assisted by" names in demo data to include periods
- Modify the service display line to append "on {clientName}" when available
- Add a helper or inline logic to ensure any single-letter last name from live data also gets a period appended (defensive formatting)

### Files Modified
- `src/hooks/useLiveSessionSnapshot.ts`
- `src/components/dashboard/LiveSessionDrilldown.tsx`
