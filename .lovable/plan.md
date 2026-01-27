
# Faux Calendar Appointments - Demo Mode

## Overview

This plan adds a **Demo Mode** toggle to the Schedule page that generates realistic fake appointments for today's date. The mock data exists only in-memory (client-side) and never touches the database or Phorest integration.

## Strategy

Following the existing pattern used in `HomepagePreviewModal.tsx` (sample stylists with badge indicator), we'll:

1. Create a `mockAppointments.ts` data file with appointment generators
2. Add a "Demo Mode" toggle in the Schedule header
3. Blend mock appointments with real data when enabled
4. Show a visual indicator that demo data is active

## Mock Data Structure

Each appointment will use realistic data covering all UI scenarios:

| Scenario | Service Category | Status | Duration | Purpose |
|----------|------------------|--------|----------|---------|
| New client consultation | New Client Consultation | booked | 30 min | Test gradient styling |
| Short appointment | Haircut | confirmed | 30 min | Test compact card view |
| Medium appointment | Color | checked_in | 90 min | Test in-service display |
| Long appointment | Extensions | booked | 180 min | Test full card info |
| Blonding service | Blonding | confirmed | 150 min | Test category colors |
| Completed today | Styling | completed | 45 min | Test completed status |
| No-show | Color | no_show | 60 min | Test red ring overlay |
| Cancelled | Haircut | cancelled | 45 min | Test strikethrough |
| Overlapping slots | Various | booked | Various | Test overlap algorithm |
| Break block | Break | booked | 30 min | Test X pattern overlay |

## Files to Create

### 1. `src/data/mockAppointments.ts`

Generator functions for fake appointment data:

```typescript
export interface MockAppointmentConfig {
  date: Date;
  stylistIds: string[];
  locationId: string;
}

export function generateMockAppointments(config: MockAppointmentConfig): PhorestAppointment[]
```

Features:
- Generate 10-15 appointments spread throughout the day (8 AM - 6 PM)
- Distribute across provided stylists
- Use realistic client names (from existing client data patterns)
- Cover all service categories from `service_category_colors` table
- Include multiple statuses to test all visual states
- Create 2-3 overlapping appointments to test column layout

### 2. Sample Client Names

Using the pattern from existing mock data, include realistic names:
- Sarah Mitchell, Jessica Chen, Amanda Rodriguez, Michael Thompson, etc.

## Files to Modify

### 1. `src/pages/dashboard/Schedule.tsx`

Add demo mode state and toggle:

```typescript
const [demoMode, setDemoMode] = useState(false);

// Generate mock appointments when demo mode is on
const mockAppointments = useMemo(() => {
  if (!demoMode) return [];
  return generateMockAppointments({
    date: currentDate,
    stylistIds: allStylists.map(s => s.user_id),
    locationId: selectedLocation,
  });
}, [demoMode, currentDate, allStylists, selectedLocation]);

// Combine real and mock appointments
const displayAppointments = useMemo(() => {
  return [...appointments, ...mockAppointments];
}, [appointments, mockAppointments]);
```

Pass `displayAppointments` to views instead of `appointments`.

### 2. `src/components/dashboard/schedule/ScheduleHeader.tsx`

Add Demo Mode toggle button:

```tsx
<Button
  variant={demoMode ? "default" : "outline"}
  size="sm"
  onClick={() => setDemoMode(!demoMode)}
  className="gap-1.5"
>
  <FlaskConical className="h-4 w-4" />
  {demoMode ? 'Demo On' : 'Demo Mode'}
</Button>
```

When demo mode is active, show a small badge/indicator in the header.

## Mock Appointment Generator Logic

```typescript
const SAMPLE_CLIENTS = [
  { name: 'Sarah Mitchell', phone: '(480) 555-0123' },
  { name: 'Jessica Chen', phone: '(602) 555-0456' },
  { name: 'Amanda Rodriguez', phone: '(480) 555-0789' },
  { name: 'Michael Thompson', phone: '(623) 555-0234' },
  { name: 'Emily Parker', phone: '(480) 555-0567' },
  { name: 'David Wilson', phone: '(602) 555-0890' },
  { name: 'Sophia Lee', phone: '(480) 555-0321' },
  { name: 'Olivia Martinez', phone: '(623) 555-0654' },
  { name: 'Emma Johnson', phone: '(480) 555-0987' },
  { name: 'Ava Williams', phone: '(602) 555-0147' },
  { name: 'Isabella Brown', phone: '(480) 555-0258' },
  { name: 'Mia Davis', phone: '(623) 555-0369' },
];

const SERVICE_TEMPLATES = [
  { name: 'New Client Consultation', category: 'New Client Consultation', duration: 30, price: 0 },
  { name: 'Precision Haircut', category: 'Haircut', duration: 45, price: 65 },
  { name: 'Full Balayage', category: 'Blonding', duration: 180, price: 240 },
  { name: 'Partial Highlight', category: 'Blonding', duration: 150, price: 185 },
  { name: 'Single Process Color', category: 'Color', duration: 90, price: 95 },
  { name: 'Color Correction', category: 'Color', duration: 240, price: 350 },
  { name: 'Hand-Tied Extensions', category: 'Extensions', duration: 180, price: 850 },
  { name: 'Extension Move-Up', category: 'Extensions', duration: 120, price: 250 },
  { name: 'Blowout & Style', category: 'Styling', duration: 45, price: 55 },
  { name: 'Updo', category: 'Styling', duration: 60, price: 85 },
  { name: 'Deep Conditioning', category: 'Extras', duration: 30, price: 35 },
  { name: 'Olaplex Treatment', category: 'Extras', duration: 30, price: 45 },
  { name: 'Lunch Break', category: 'Break', duration: 30, price: 0 },
];

const STATUS_DISTRIBUTION: AppointmentStatus[] = [
  'booked', 'booked', 'booked',      // Most common
  'confirmed', 'confirmed',           // Client confirmed
  'checked_in',                       // Currently in chair
  'completed',                        // Done today
  'cancelled',                        // Show strikethrough
  'no_show',                          // Show red ring
];
```

## Time Slot Generation

Generate appointments at realistic times:
- Start between 8:00 AM and 4:00 PM
- 15-minute increments (8:00, 8:15, 8:30, etc.)
- Avoid excessive overlaps (max 2-3 at same time)
- Include 1-2 gaps for walk-in slots

```typescript
const generateTimeSlots = (hoursStart: number, hoursEnd: number): string[] => {
  const slots = [];
  for (let hour = hoursStart; hour < hoursEnd - 1; hour++) {
    for (let min = 0; min < 60; min += 15) {
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};
```

## Visual Indicators

When demo mode is active:

1. **Header Badge**: Show "Demo Mode" badge next to the date
2. **Toast on Enable**: "Demo mode enabled - showing sample appointments"
3. **Card Subtle Marker**: Optional dotted border or icon to distinguish fake appointments (can skip if too noisy)

## What This Tests

| UI Feature | How Mock Data Tests It |
|------------|------------------------|
| Category colors | Appointments across all 9 categories |
| Status colors | All 6 statuses represented |
| Gradient styling | New Client Consultation appointment |
| Compact cards | 30-minute appointments |
| Full cards | 60+ minute appointments |
| No-show ring | no_show status appointment |
| Strikethrough | cancelled status appointment |
| X pattern | Break/Block categories |
| Overlap columns | Multiple appointments at same time |
| Tooltip content | All fields populated |
| Time formatting | Various start/end times |

## Usage Flow

1. Navigate to Schedule page
2. Click "Demo Mode" toggle in header
3. Mock appointments appear blended with any real appointments
4. Select appointments to test action bar
5. Click again to disable demo mode

## Benefits

- No database changes required
- No impact on Phorest integration
- Instant on/off toggle
- Tests all visual edge cases
- Helps identify missing UI elements
- Useful for demos and screenshots
