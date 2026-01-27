

# Hide Revenue Analytics from Front Desk Dashboard

## Problem

The "Quick Stats" section on the dashboard shows revenue metrics ("$0 This Week") to Front Desk users. Front Desk staff should not see sales/revenue analytics - only operational metrics (waiting, in service, completed, etc.).

Screenshot shows Front Desk view with:
- Today's Clients (OK to show)
- **This Week: $0** (should be hidden)
- New Clients (OK to show)
- Rebooking Rate (OK to show)

---

## Current Logic

| Section | Visibility Condition | Shows Revenue? |
|---------|---------------------|----------------|
| Operations Quick Stats | `isReceptionist \|\| isLeadership` | Conditionally hidden via `hideRevenue` prop |
| Quick Stats (personal) | `!isLeadership` | **Always shows revenue** |

The Quick Stats section condition `!isLeadership` matches Front Desk users, showing them the "$0 This Week" revenue card.

---

## Solution

Change the Quick Stats visibility from `!isLeadership` to `hasStylistRole` so it only shows to stylists and stylist assistants who should see personal performance metrics.

### File: `src/pages/dashboard/DashboardHome.tsx`

**Line 301 - Current:**
```typescript
{!isLeadership && (
```

**Updated:**
```typescript
{hasStylistRole && (
```

This ensures:
- **Stylists/Assistants**: See personal Quick Stats (clients, revenue, rebooking)
- **Front Desk**: See only Operations Quick Stats (waiting, in service, completed, no-shows) without revenue
- **Leadership**: See Command Center analytics

---

## Verification

### Front Desk (Receptionist) will see:
| Section | Visible |
|---------|---------|
| Today's Queue | Yes |
| Operations Quick Stats | Yes (without revenue card) |
| Quick Stats (with $0 This Week) | **No** |

### Stylist will see:
| Section | Visible |
|---------|---------|
| Quick Actions | Yes |
| Quick Stats (personal metrics) | Yes |
| Client Engine | Yes |

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/dashboard/DashboardHome.tsx` | Line 301: Change `!isLeadership` to `hasStylistRole` |

