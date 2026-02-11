

# Show "Today's Schedule" Only for Appointment-Taking Roles

## What Changes
The "Today's Schedule" card on the Command Center dashboard will only appear for roles that take appointments: **stylist**, **stylist_assistant**, and **booth_renter**. All other roles (admin, manager, receptionist, etc.) will no longer see this card.

## Technical Details

### File: `src/pages/dashboard/DashboardHome.tsx`

Wrap the existing `VisibilityGate` for "Today's Schedule" (lines 482-500) with the already-defined `hasStylistRole` check:

```tsx
{hasStylistRole && (
  <VisibilityGate elementKey="todays_schedule">
    <Card ...>
      {/* Today's Schedule content */}
    </Card>
  </VisibilityGate>
)}
```

The variable `hasStylistRole` (already on line 129) covers all three appointment-taking roles:
- stylist
- stylist_assistant
- booth_renter

No new files, hooks, or database changes needed. One small conditional wrapper is all that is required.

| File | Change |
|---|---|
| `src/pages/dashboard/DashboardHome.tsx` | Wrap Today's Schedule card with `hasStylistRole` conditional |

