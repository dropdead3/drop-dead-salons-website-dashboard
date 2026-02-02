
# Plan: Add Ring the Bell Quick Action for Specific Roles

## Overview
Enable the "Ring the Bell" quick action button on the Command Center (Dashboard Home) for users with **Stylist**, **Stylist Assistant**, **Booth Renter**, and **Front Desk (Receptionist)** roles.

## Current Behavior
The Quick Actions section visibility is controlled by:
```typescript
const hasStylistRole = roles.includes('stylist') || roles.includes('stylist_assistant');
const showQuickActions = hasStylistRole || (!isLeadership);
```

This logic already shows Quick Actions to non-leadership roles (including receptionists), but it doesn't explicitly include `booth_renter` in the role check.

## Changes Required

### File: `src/pages/dashboard/DashboardHome.tsx`

**Update 1: Expand `hasStylistRole` to include Booth Renters**
```typescript
// Before (line 121)
const hasStylistRole = roles.includes('stylist') || roles.includes('stylist_assistant');

// After
const hasStylistRole = roles.includes('stylist') || roles.includes('stylist_assistant') || roles.includes('booth_renter');
```

**Update 2: Ensure Front Desk is explicitly covered**
The current `showQuickActions = hasStylistRole || (!isLeadership)` already covers receptionists because they are not in leadership. However, for clarity and future-proofing, we'll add an explicit check:

```typescript
// Updated logic
const showQuickActions = hasStylistRole || isFrontDesk || (!isLeadership);
```

Where `isFrontDesk` is already defined as `roles.includes('receptionist')` on line 127.

## Role Visibility Matrix

| Role | Sees Quick Actions | Sees Ring the Bell |
|------|-------------------|-------------------|
| Stylist | ✅ | ✅ (via VisibilityGate) |
| Stylist Assistant | ✅ | ✅ (via VisibilityGate) |
| Booth Renter | ✅ (after fix) | ✅ (via VisibilityGate) |
| Receptionist/Front Desk | ✅ | ✅ (via VisibilityGate) |
| Admin/Manager | ❌ (leadership) | N/A |
| Super Admin | ❌ (leadership) | N/A |

## Technical Notes

### Visibility Gate System
The individual "Ring the Bell" button is wrapped in:
```tsx
<VisibilityGate elementKey="ring_the_bell_action">
  <Button>...</Button>
</VisibilityGate>
```

This means even after making Quick Actions visible, the specific button can still be hidden/shown per-role via the **Role Access Configurator** (Settings > Access & Visibility > Role Access). The database table `dashboard_element_visibility` controls this.

### Program Enrollment Note
Users clicking "Ring the Bell" navigate to `/dashboard/ring-the-bell`. To actually submit an entry, they must be enrolled in the Client Engine Program. This is a separate validation handled in `RingTheBell.tsx`.

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/DashboardHome.tsx` | Add `booth_renter` to `hasStylistRole` check and add `isFrontDesk` to `showQuickActions` for clarity |

## Summary
A single file change with ~2 line modifications to expand role coverage for the Quick Actions section, ensuring Booth Renters and Front Desk staff can access the Ring the Bell button on their Command Center.
