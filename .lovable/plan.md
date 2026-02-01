
# Plan: Move Rent Payments Inside Renter Hub

## Overview
Convert the Renter Hub page into a tabbed interface that consolidates booth renter management and rent payment tracking into a single unified hub. This follows the same pattern as the Analytics Hub.

## Changes

### 1. Update BoothRenters.tsx to Tabbed Renter Hub
Transform the current page into a tabbed layout with two main tabs:

| Tab | Label | Icon | Description |
|-----|-------|------|-------------|
| `renters` | Renters | `Users` | Current booth renter management (default) |
| `payments` | Payments | `Receipt` | Rent payment tracking and recording |

**Structure:**
```text
+--------------------------------------------------+
|  [Store Icon] Renter Hub                         |
|  Manage booth renters and rent payments          |
+--------------------------------------------------+
|  [Renters] [Payments]  <- Tab navigation         |
+--------------------------------------------------+
|                                                  |
|  Tab Content (switches between views)            |
|                                                  |
+--------------------------------------------------+
```

### 2. Extract Renters Content to Component
Create a new component `RentersTabContent.tsx` containing:
- Search and status filters
- Summary cards (Total, Active, Pending, Monthly Revenue)  
- Renter cards list
- Existing dialog handlers (AddRenter, RenterDetail, IssueContract)

### 3. Extract Payments Content to Component
Create a new component `PaymentsTabContent.tsx` containing:
- All logic from current `RentPayments.tsx`
- Summary cards (Total Due, Collected, Outstanding, Overdue)
- Payments table with filters
- Record Payment dialog

### 4. Update Navigation
- Remove the standalone "Rent Payments" link from the sidebar
- Keep only the "Renter Hub" link (already exists)

### 5. Update Routing
- Remove the standalone `/dashboard/admin/rent-payments` route from `App.tsx`
- The Renter Hub will handle both views internally via tabs

## Files to Create
| File | Purpose |
|------|---------|
| `src/components/dashboard/booth-renters/RentersTabContent.tsx` | Extracted renters list and management UI |
| `src/components/dashboard/booth-renters/PaymentsTabContent.tsx` | Extracted payments tracking UI |

## Files to Modify
| File | Changes |
|------|---------|
| `src/pages/dashboard/admin/BoothRenters.tsx` | Convert to tabbed hub layout |
| `src/components/dashboard/booth-renters/index.ts` | Export new tab components |
| `src/components/dashboard/DashboardLayout.tsx` | Remove "Rent Payments" nav link |
| `src/App.tsx` | Remove rent-payments route |

## Technical Details

### Tab State Management
Use URL search params for tab persistence (same pattern as AnalyticsHub):
```typescript
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') || 'renters';

const handleTabChange = (value: string) => {
  setSearchParams({ tab: value });
};
```

### Shared Organization Context
Both tabs will use the same `DEFAULT_ORG_ID` constant (to be replaced with organization context in the future).

### Component Props
```typescript
// RentersTabContent
interface RentersTabContentProps {
  organizationId: string;
}

// PaymentsTabContent  
interface PaymentsTabContentProps {
  organizationId: string;
}
```

## Benefits
- Single entry point for all booth renter operations
- Cleaner navigation with fewer sidebar items
- Consistent hub pattern matching Analytics Hub
- Better UX for admins managing renters and their payments
