
## Fix: Service Badge X Button Not Removing Services

### Root Cause

`selectedServices` is an array of `phorest_service_id` strings (set via `handleServiceToggle` at line 612). However, all three badge `onClick` removal handlers filter using `s.id` (the database UUID), which is a completely different field — so the filter never finds a match and the state never changes.

```
selectedServices = ["phorest-abc-123", ...]   // stores phorest_service_id

// BUG: s.id is the DB UUID, not phorest_service_id
onClick={() => setSelectedServices(prev => prev.filter(id => id !== s.id))}
//                                                                   ^^^^
//                                                    should be s.phorest_service_id
```

### Fix

Change `s.id` to `s.phorest_service_id` in all 3 badge `onClick` handlers — at lines 1112, 1202, and 1345.

**File:** `src/components/dashboard/schedule/QuickBookingPopover.tsx`

```tsx
// All 3 instances — change:
onClick={() => setSelectedServices(prev => prev.filter(id => id !== s.id))}

// To:
onClick={() => setSelectedServices(prev => prev.filter(id => id !== s.phorest_service_id))}
```

This is a pure one-field fix, three locations. No state, logic, or UI changes needed.
