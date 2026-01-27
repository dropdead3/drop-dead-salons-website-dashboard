
# Display Client Name and Booking Status on Queue Cards

## Overview

This plan updates the `QueueCard` component to properly display the client's name and their booking confirmation status (confirmed, unconfirmed/booked, cancelled, etc.) based on the actual appointment data.

## Current State

The `QueueCard` component has two issues:
1. **Client Name**: Shows "Walk-in" when `client_name` is null - this is working correctly, but your test data happens to have null names
2. **Status Badge**: The `getStatusBadge()` function always shows "Confirmed" for waiting/upcoming appointments, ignoring the actual `status` field from the database

The database shows appointments with status values like: `booked`, `confirmed`, `unknown`, `cancelled`, `no_show`, `checked_in`, `completed`

## Changes Required

### 1. Update QueueCard Status Badge Logic

Modify `getStatusBadge()` in `src/components/dashboard/operations/QueueCard.tsx` to show the actual booking status:

| Status Value | Badge Display | Style |
|--------------|---------------|-------|
| `confirmed` | Confirmed | Green |
| `booked` | Unconfirmed | Yellow/Amber |
| `unknown` | Unconfirmed | Yellow/Amber |
| `cancelled` | Cancelled | Red with strikethrough |
| `no_show` | No-Show | Red |
| `checked_in` | In Service | Blue (existing) |

### 2. Visual Design

```text
+-------------------------------------------+
| 12:00 PM                    [ Confirmed ] |  <-- Green badge
|-------------------------------------------|
| Sarah Johnson                       [NEW] |  <-- Client name
| (555) 123-4567                            |
|                                           |
| 1 Row Initial Install                     |
| with Eric T.                              |
|                                           |
| $228                                      |
|                                           |
| [ Check In Early ]                        |
+-------------------------------------------+

+-------------------------------------------+
| 1:00 PM                   [ Unconfirmed ] |  <-- Amber badge
|-------------------------------------------|
| Walk-in                                   |  <-- Fallback when no name
| ...                                       |
+-------------------------------------------+

+-------------------------------------------+
| 2:00 PM                     [ Cancelled ] |  <-- Red badge
|-------------------------------------------|
| Jane Doe                                  |
| ...                                       |
+-------------------------------------------+
```

## Implementation Details

### File: `src/components/dashboard/operations/QueueCard.tsx`

**Update `getStatusBadge()` function (lines 58-92):**

```typescript
const getStatusBadge = () => {
  // In-service appointments show time remaining
  if (variant === 'inService') {
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
        <Clock className="w-3 h-3 mr-1" />
        ~{appointment.estimatedCompleteIn}min left
      </Badge>
    );
  }

  // Late arrivals get priority warning
  if (appointment.isLate) {
    return (
      <Badge variant="destructive" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        <AlertCircle className="w-3 h-3 mr-1" />
        {appointment.waitTimeMinutes}min late
      </Badge>
    );
  }

  // Show actual booking status based on appointment.status
  switch (appointment.status) {
    case 'confirmed':
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Confirmed
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelled
        </Badge>
      );
    case 'no_show':
      return (
        <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          No-Show
        </Badge>
      );
    case 'booked':
    case 'unknown':
    default:
      // Unconfirmed appointments (booked but not confirmed)
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700">
          <Clock className="w-3 h-3 mr-1" />
          Unconfirmed
        </Badge>
      );
  }
};
```

**Add XCircle import:**
```typescript
import { 
  Clock, 
  User, 
  Phone, 
  Scissors, 
  CheckCircle2, 
  DollarSign,
  AlertCircle,
  Copy,
  Check,
  XCircle,  // Add this
} from 'lucide-react';
```

### Optional: Add strikethrough styling for cancelled appointments

For cancelled appointments, apply a subtle visual indicator:

```typescript
<Card className={cn(
  "p-4 transition-all duration-200 hover:shadow-md",
  variant === 'inService' && "border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20",
  appointment.isLate && variant === 'waiting' && "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20",
  appointment.status === 'cancelled' && "opacity-60 border-red-200 dark:border-red-900",
)}>
```

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/dashboard/operations/QueueCard.tsx` | Update `getStatusBadge()` to show actual status, add XCircle import, add cancelled styling |

## Notes

- The client name display already works correctly (`{appointment.client_name || 'Walk-in'}`)
- Your current test data has all `client_name` values as null, which is why everything shows "Walk-in"
- When Phorest syncs real appointments with client data, the names will display properly
- Cancelled appointments should rarely appear in the queue, but the logic handles them gracefully
