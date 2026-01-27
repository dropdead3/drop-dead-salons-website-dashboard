
# Enhanced Walk-In Dialog with Multi-Service, Level Pricing, and Same-Day Restrictions

## Overview

This plan enhances the Walk-In Dialog with three major capabilities:
1. **Multi-service selection** - Add multiple services to a single walk-in appointment
2. **Level-based pricing** - Dynamically adjust prices based on the selected stylist's level
3. **Same-day booking restrictions** - Gray out services that require lead time (e.g., extensions needing custom orders)

Additionally, we'll add a **Services Editor** enhancement to manage the "Allow same day booking" setting per service.

---

## Database Changes

### New Columns on `phorest_services`

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `allow_same_day_booking` | `BOOLEAN` | `true` | Whether service can be booked same-day |
| `lead_time_days` | `INTEGER` | `0` | Minimum days of advance notice required |
| `same_day_restriction_reason` | `TEXT` | `null` | Reason shown to user (e.g., "Extensions require 7-day custom order") |

```sql
ALTER TABLE phorest_services
ADD COLUMN allow_same_day_booking BOOLEAN DEFAULT true,
ADD COLUMN lead_time_days INTEGER DEFAULT 0,
ADD COLUMN same_day_restriction_reason TEXT;
```

---

## Part 1: Update Stylist Availability Hook

### File: `src/hooks/useStylistAvailability.ts`

Add `stylist_level` to the `StylistWithAvailability` interface and include it in all queries:

```typescript
export interface StylistWithAvailability {
  user_id: string;
  full_name: string;
  display_name: string | null;
  availableMinutes: number;
  isWorkingToday: boolean;
  phorest_staff_id?: string;
  stylist_level?: string | null;  // NEW
}
```

Update the `employee_profiles` queries to select `stylist_level`:
- Line 120: `select('user_id, full_name, display_name, stylist_level')`
- Line 155: `select('user_id, full_name, display_name, stylist_level')`

Include `stylist_level` in the returned object (line 210).

---

## Part 2: Enhanced Walk-In Dialog

### File: `src/components/dashboard/operations/WalkInDialog.tsx`

### 2.1 Multi-Service State

Replace single `serviceId` with array:

```typescript
const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
```

### 2.2 Service Selection UI

Replace the single-select dropdown with a multi-select interface similar to `QuickBookingPopover`:

```text
+----------------------------------------+
| Services                               |
| +------------------------------------+ |
| | [x] Full Highlight         $276    | |
| | [x] Add-On Cut              $52    | |
| | [ ] Wash + Blowout          $58    | |
| | [DISABLED] 2 Row Initial Install   | |
| |   "Requires 7-day custom order"    | |
| +------------------------------------+ |
|                                        |
| Selected: 2 services                   |
| Total Duration: 180 min                |
+----------------------------------------+
```

**Service list behavior:**
- Services with `allow_same_day_booking = false` are **grayed out and disabled**
- Disabled services show `same_day_restriction_reason` as subtitle
- Selected services show checkmarks and contribute to total

### 2.3 Level-Based Pricing

Import level pricing utilities:

```typescript
import { getLevelSlug, findLevelBasedPrice, getLevelNumber } from '@/utils/levelPricing';
```

Calculate dynamic price when stylist is selected:

```typescript
const selectedStylist = availableStylists?.find(s => s.user_id === stylistId);
const levelSlug = getLevelSlug(selectedStylist?.stylist_level);

const calculatedTotalPrice = useMemo(() => {
  return selectedServiceDetails.reduce((sum, service) => {
    if (levelSlug) {
      const levelPrice = findLevelBasedPrice(service.name, levelSlug);
      return sum + (levelPrice ?? service.price ?? 0);
    }
    return sum + (service.price ?? 0);
  }, 0);
}, [selectedServiceDetails, levelSlug]);
```

### 2.4 Updated Mutation

Update `createWalkIn` to handle multiple services:

```typescript
// Combine service names
const serviceNames = selectedServiceDetails.map(s => s.name).join(' + ');

// Calculate total duration
const totalDuration = selectedServiceDetails.reduce(
  (sum, s) => sum + (s.duration_minutes || 60), 0
);

const { error } = await supabase
  .from('phorest_appointments')
  .insert({
    phorest_id: `walk-in-${Date.now()}`,
    appointment_date: today,
    start_time: now,
    end_time: calculateEndTime(now, totalDuration),
    client_name: clientName || 'Walk-in',
    service_name: serviceNames,
    service_category: selectedServiceDetails[0]?.category || null,
    total_price: calculatedTotalPrice,
    stylist_user_id: stylistId || null,
    // ...
  });
```

### 2.5 UI Layout Updates

Expand dialog width to accommodate multi-service list:

```typescript
<DialogContent className="sm:max-w-[500px]">
```

Add a **Running Total** section that updates dynamically:

```text
+----------------------------------------+
|                              Subtotal  |
| Full Highlight (Level 3)      $152     |
| Add-On Cut (Level 3)           $60     |
|                              --------  |
|                        Total: $212     |
+----------------------------------------+
```

---

## Part 3: Services Manager Enhancement

### File: `src/pages/dashboard/admin/ServicesManager.tsx`

Add "Same-Day Booking" toggle to the service edit dialog:

```text
+------------------------------------------+
| Edit Service                             |
|------------------------------------------|
| Service Name: [Full Highlight          ] |
| Description:  [All-over dimensional... ] |
|                                          |
| [ ] Allow Same-Day Booking               |
|                                          |
| Lead Time Required: [7] days             |
|                                          |
| Restriction Reason:                      |
| [Extensions require custom order...    ] |
|                                          |
| Pricing by Level:                        |
| Level 1: [$152]  Level 2: [$175]  ...    |
+------------------------------------------+
```

### New Component: Service Booking Settings Section

```typescript
<div className="space-y-4 border-t pt-4 mt-4">
  <Label className="text-sm font-medium">Booking Settings</Label>
  
  <div className="flex items-center justify-between">
    <div>
      <Label>Allow Same-Day Booking</Label>
      <p className="text-xs text-muted-foreground">
        Enable this for services that can be booked on the same day
      </p>
    </div>
    <Switch 
      checked={editingService.allowSameDayBooking}
      onCheckedChange={(checked) => /* update state */}
    />
  </div>

  {!editingService.allowSameDayBooking && (
    <>
      <div className="space-y-2">
        <Label>Lead Time Required (days)</Label>
        <Input 
          type="number" 
          min="1"
          value={editingService.leadTimeDays}
          onChange={(e) => /* update state */}
        />
      </div>
      <div className="space-y-2">
        <Label>Restriction Reason</Label>
        <Textarea 
          placeholder="e.g., Extensions require 7-day custom order"
          value={editingService.restrictionReason}
          onChange={(e) => /* update state */}
        />
      </div>
    </>
  )}
</div>
```

---

## Part 4: Service Query Updates

### File: `src/hooks/usePhorestServices.ts`

Ensure the service query includes the new booking restriction fields:

```typescript
const { data, error } = await supabase
  .from('phorest_services')
  .select('*, allow_same_day_booking, lead_time_days, same_day_restriction_reason')
  .eq('is_active', true)
  .order('category')
  .order('name');
```

### Type Extension

Update the `PhorestService` interface:

```typescript
export interface PhorestService {
  id: string;
  phorest_service_id: string;
  phorest_branch_id: string;
  name: string;
  category: string | null;
  duration_minutes: number;
  price: number | null;
  requires_qualification: boolean;
  is_active: boolean;
  // NEW fields
  allow_same_day_booking: boolean;
  lead_time_days: number;
  same_day_restriction_reason: string | null;
}
```

---

## Visual Flow Summary

```text
Walk-In Dialog Flow:
                                    
+------------------+    +------------------+    +------------------+
|  Select Service  | -> |  Select Stylist  | -> |  Review & Submit |
|  (multi-select)  |    |  (with level)    |    |  (with total)    |
+------------------+    +------------------+    +------------------+
        |                       |                       |
        v                       v                       v
  - Gray out services     - Show availability     - Display level-based
    with lead time          + free time             pricing breakdown
  - Show restrictions     - Show stylist level    - Total price updates
  - Calculate duration                              when stylist changes
```

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/...` | Create | Add `allow_same_day_booking`, `lead_time_days`, `same_day_restriction_reason` columns |
| `src/hooks/useStylistAvailability.ts` | Modify | Include `stylist_level` in returned data |
| `src/hooks/usePhorestServices.ts` | Modify | Include new booking restriction fields |
| `src/components/dashboard/operations/WalkInDialog.tsx` | Modify | Multi-service selection, level-based pricing, disabled services |
| `src/pages/dashboard/admin/ServicesManager.tsx` | Modify | Add booking settings to service editor |

---

## Default Values for Existing Services

After migration, services will default to:
- `allow_same_day_booking = true` (all existing services remain bookable)
- `lead_time_days = 0`
- `same_day_restriction_reason = null`

Extension services (e.g., "1 Row Initial Install", "2 Row Initial Install") should be manually updated via the Services Manager to:
- `allow_same_day_booking = false`
- `lead_time_days = 7`
- `same_day_restriction_reason = "Extensions require custom order (7+ days)"`
