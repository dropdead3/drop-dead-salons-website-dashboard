
## Location Seats Model - Self-Service Capacity Management

This plan transforms the location billing model from "platform admin adds locations" to a **seat-based system** where:
1. Platform admin allocates location seats to organizations
2. Business owners/admins fill those seats with actual location data in their Settings
3. Business users can self-service add more seats when needed

---

### Current State

| Component | Current Behavior |
|-----------|------------------|
| Platform Admin → Locations Tab | Placeholder: "Location management coming soon" |
| Business Dashboard → Location Settings | Allows unlimited location creation (no seat enforcement) |
| Billing Configuration | Tracks `included_locations` + `additional_locations_purchased` but doesn't enforce |
| Self-Service Upgrade | Does not exist for business users |

---

### Target Architecture

```text
PLATFORM ADMIN                         BUSINESS OWNER/ADMIN
+-------------------------+            +---------------------------+
| Account Billing Tab     |            | Settings → Locations      |
| - Set included seats    |            | - See "X of Y seats used" |
| - Set per-location fee  |            | - Add locations (if seats |
| - View utilization      |            |   available)              |
+-------------------------+            | - "Add More Seats" button |
                                       +---------------------------+
                                                    |
                                                    v
                                       +---------------------------+
                                       | Add Location Seats Dialog |
                                       | - Show current vs new cost|
                                       | - Payment confirmation    |
                                       | - Audit trail logged      |
                                       +---------------------------+
```

---

### Implementation Summary

#### Phase 1: Platform Admin - Seat Allocation View
Update the Locations tab in Account Detail to show seat allocation instead of location CRUD:
- Display current seat allocation (included + purchased)
- Show utilization: "2 of 3 seats filled"
- Link to Billing tab to adjust seats
- Read-only list of locations the org has created (for visibility)

#### Phase 2: Business Dashboard - Seat Enforcement
Update `LocationsSettingsContent.tsx` to:
- Display capacity bar: "2 of 3 location seats used"
- Block "Add Location" button when at capacity
- Show "Need more locations? Add seats" prompt
- Trigger upgrade dialog when user wants more

#### Phase 3: Self-Service Seat Purchase Dialog
Create a new dialog for business users to purchase additional location seats:
- Show current cost breakdown
- Preview new monthly cost after adding seats
- Confirm payment method (Stripe integration placeholder)
- Log the change to `billing_changes` table

---

### Component Changes

#### 1. Platform Admin: Locations Tab Update
**File:** `src/pages/dashboard/platform/AccountDetail.tsx`

Transform the Locations tab from "coming soon" to a seat allocation view:

```text
+-------------------------------------------------------+
| LOCATION SEATS                                        |
+-------------------------------------------------------+
| Allocated Seats: 3 (1 base + 2 purchased)            |
| Filled Seats: 2 of 3                                 |
| [===========>--------] 67%                           |
|                                                       |
| Filled Locations:                                    |
| +-------------------------------------------------+  |
| | Maple Avenue Salon    | 123 Maple Ave, Austin  |  |
| | Downtown Studio       | 456 Main St, Austin    |  |
| +-------------------------------------------------+  |
|                                                       |
| [Adjust Seats in Billing →]                          |
+-------------------------------------------------------+
```

Changes:
- Fetch actual locations for the organization
- Use existing capacity metrics from `useOrganizationCapacity`
- Display read-only location list
- Link to Billing tab for seat adjustments

---

#### 2. Business Dashboard: Capacity-Aware Location Settings
**File:** `src/components/dashboard/settings/LocationsSettingsContent.tsx`

Add capacity awareness:

```text
+-------------------------------------------------------+
| ALL LOCATIONS                                         |
| Add, edit, and manage salon locations                |
|                                                       |
| +---------------------------------------------------+|
| | [====>------] 2 of 3 seats used | [+ Add Seat]   ||
| +---------------------------------------------------+|
|                                                       |
| [+ Add Location] (disabled if at capacity)           |
+-------------------------------------------------------+
```

Changes:
- Import and use capacity data from organization billing
- Show capacity bar with utilization
- Conditionally disable "Add Location" button when `remaining === 0`
- Add "Add More Seats" button that opens upgrade dialog
- Toast message when trying to add at capacity: "You've used all your location seats. Add more to continue."

---

#### 3. New Component: Add Location Seats Dialog
**File:** `src/components/dashboard/settings/AddLocationSeatsDialog.tsx`

Self-service upgrade flow:

```text
+-------------------------------------------------------+
| ADD LOCATION SEATS                                    |
+-------------------------------------------------------+
| Current Plan: Professional                            |
| Included Locations: 1                                 |
| Additional Seats: 2 × $49/mo = $98/mo                |
|                                                       |
| How many seats to add?                               |
| [-] 1 [+]                                            |
|                                                       |
| NEW MONTHLY COST:                                     |
| Base Plan           $299/mo                          |
| Location Add-Ons    $147/mo (+$49)                   |
| ─────────────────────────────                        |
| Total               $446/mo                          |
|                                                       |
| [ ] I agree to the updated billing terms             |
|                                                       |
| [Cancel]                    [Confirm & Add Seats]    |
+-------------------------------------------------------+
```

Features:
- Quantity selector for new seats
- Shows current vs. projected cost
- Agreement checkbox
- On confirm: updates `organization_billing.additional_locations_purchased`
- Logs change to `billing_changes` with type `add_locations`
- Future: Stripe integration for actual payment

---

#### 4. New Hook: Business Capacity Data
**File:** `src/hooks/useBusinessCapacity.ts`

A simplified hook for business users (wraps existing capacity logic):

```typescript
interface BusinessCapacity {
  locations: {
    total: number;
    used: number;
    remaining: number;
    isUnlimited: boolean;
  };
  users: {
    total: number;
    used: number;
    remaining: number;
    isUnlimited: boolean;
  };
  canAddLocation: boolean;
  canAddUser: boolean;
  perLocationFee: number;
  perUserFee: number;
}
```

This hook:
- Gets the current user's organization ID
- Fetches billing config and usage
- Returns capacity metrics relevant to business decisions

---

### Database Considerations

No schema changes required. The existing structure already supports this model:

| Table | Field | Purpose |
|-------|-------|---------|
| `organization_billing` | `included_locations` | Base seats from plan |
| `organization_billing` | `additional_locations_purchased` | Extra purchased seats |
| `organization_billing` | `per_location_fee` | Cost per additional seat |
| `billing_changes` | `change_type = 'add_locations'` | Audit trail for seat purchases |

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/dashboard/platform/AccountDetail.tsx` | **Edit** | Transform Locations tab to seat allocation view |
| `src/components/dashboard/settings/LocationsSettingsContent.tsx` | **Edit** | Add capacity bar, enforce limits, add upgrade button |
| `src/components/dashboard/settings/AddLocationSeatsDialog.tsx` | **Create** | Self-service seat purchase dialog |
| `src/hooks/useBusinessCapacity.ts` | **Create** | Business-facing capacity hook |

---

### UX Flow Walkthrough

**Scenario: Business owner wants to add a 4th location but only has 3 seats**

1. Owner navigates to Settings → Locations
2. Sees capacity bar: "3 of 3 seats used"
3. "Add Location" button is disabled with tooltip: "All location seats are in use"
4. Clicks "Add More Seats" button
5. Dialog opens showing:
   - Current: 3 seats (1 included + 2 purchased @ $49/mo = $98/mo)
   - Adding 1 seat → $147/mo in location add-ons
   - Total monthly cost increases from $397 to $446
6. Owner checks agreement box and clicks "Confirm & Add Seats"
7. System updates `organization_billing.additional_locations_purchased` from 2 to 3
8. Creates `billing_changes` record with type `add_locations`
9. Toast: "Location seat added! You now have 4 available seats."
10. "Add Location" button is now enabled
11. Owner proceeds to add their new location

---

### Future Enhancements

The following would be valuable follow-up work but are not part of this initial implementation:

1. **Stripe Integration**: Connect the "Add Seats" action to actual Stripe subscription modification
2. **User Seats**: Apply the same pattern to user/team member seats
3. **Downgrade Protection**: Handle reducing seats when locations already exist
4. **Self-Service Plan Upgrades**: Let business owners upgrade their entire plan, not just add-ons
5. **Billing History Page**: Show business owners their billing history and upcoming charges

---

### Technical Notes

1. **Organization Context**: The business dashboard already has organization context via auth. We'll use this to fetch the correct billing configuration.

2. **Optimistic Updates**: The seat purchase should optimistically update UI while the mutation is in flight.

3. **Permission Gating**: The "Add Seats" functionality should be gated to business admin/owner roles only.

4. **Stripe Placeholder**: For now, the confirmation simply updates the database. When Stripe is integrated, this will create a subscription modification.

5. **Concurrency**: The current `additional_locations_purchased` field is a simple counter. For production, consider using a transactional increment to avoid race conditions.
