

# Restrict Today's Queue to Front Desk Only

## Overview

This change restricts the "Today's Queue" section on the Command Center dashboard to only display for users with the **Front Desk** (`receptionist`) role. Currently, it shows for receptionists, admins, and all leadership roles.

---

## Current State

The Today's Queue section is visible to:
- `receptionist` (Front Desk)
- `admin` (Director Of Operations)
- `manager` 
- `super_admin`
- Other leadership roles

This is controlled by the condition:
```typescript
{(isReceptionist || isLeadership) && (
  <VisibilityGate elementKey="todays_queue" ...>
    <TodaysQueueSection />
  </VisibilityGate>
)}
```

Where `isReceptionist` includes both `receptionist` AND `admin` roles.

---

## Solution

### File: `src/pages/dashboard/DashboardHome.tsx`

**Change 1: Add a dedicated Front Desk check**

Add a new flag specifically for front desk users (around line 100-101):

```typescript
// Current:
const isReceptionist = roles.includes('receptionist') || roles.includes('admin');

// Add new:
const isFrontDesk = roles.includes('receptionist');
```

**Change 2: Update Today's Queue visibility condition**

Update lines 273-282 to use the new `isFrontDesk` flag:

```typescript
// Before:
{(isReceptionist || isLeadership) && (
  <VisibilityGate 
    elementKey="todays_queue"
    elementName="Today's Queue"
    elementCategory="operations"
  >
    <TodaysQueueSection />
  </VisibilityGate>
)}

// After:
{isFrontDesk && (
  <VisibilityGate 
    elementKey="todays_queue"
    elementName="Today's Queue"
    elementCategory="operations"
  >
    <TodaysQueueSection />
  </VisibilityGate>
)}
```

---

## Impact Summary

| Role | Before | After |
|------|--------|-------|
| `receptionist` (Front Desk) | ✅ Visible | ✅ Visible |
| `admin` (Director of Ops) | ✅ Visible | ❌ Hidden |
| `manager` | ✅ Visible | ❌ Hidden |
| `super_admin` | ✅ Visible | ❌ Hidden |
| `stylist` | ❌ Hidden | ❌ Hidden |

---

## Notes

- The **Operations Quick Stats** section will remain visible to receptionists and leadership per the existing `isReceptionist || isLeadership` logic (no change there unless requested)
- Leadership users can still access the full schedule at `/dashboard/schedule` or the Operations page if needed
- The `VisibilityGate` wrapper is preserved, allowing the section to still be toggled via the Visibility Console if needed in the future

