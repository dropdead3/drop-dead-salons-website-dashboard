

# Make "Synced to Phorest" Description Dynamic

## Problem
The `NewClientDialog` description is hardcoded to "Create a new client in the system. They will be synced to Phorest." -- regardless of the organization's actual integration status. This violates the standalone-detach-Phorest doctrine and would be inaccurate for orgs using a different CRM or no CRM at all.

## Solution

**File:** `src/components/dashboard/schedule/NewClientDialog.tsx`

Use the existing `usePOSConfig()` hook to determine the organization's POS/CRM integration and render the description dynamically:

- **Phorest connected:** "Create a new client in the system. They will be synced to Phorest."
- **Other POS connected:** "Create a new client in the system. They will be synced to {provider name}."
- **No integration:** "Create a new client in the system."

### Technical Details

1. Import `usePOSConfig` from `@/hooks/usePOSData`
2. Call `usePOSConfig()` inside the component to get `posConfig`
3. Build a dynamic description string based on `posConfig?.posType`:
   - If a POS type exists and sync is enabled, append the sync message with the provider name (title-cased)
   - Otherwise, show only the base message
4. Replace the hardcoded `DialogDescription` text (line 199) with the dynamic string

This is a single-file change, fully aligned with the POS adapter pattern and the Phorest detach strategy.
