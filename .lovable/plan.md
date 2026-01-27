

# Simplify Sales KPIs - Remove Redundant Expected Rev

## The Problem

Currently:
- "Total Revenue" shows `$X` (from all scheduled appointments)
- "Expected Rev" shows `$X` (same data, same value)

This is redundant and confusing. The "Expected Rev" card we just added shows the exact same number as "Total Revenue".

---

## Solution

**Remove the "Expected Rev" card entirely** and update the "Total Revenue" card to clarify what it represents.

When "Today" is selected, the Total Revenue already shows expected revenue from all scheduled appointments for the full day - not just what's been completed.

---

## Technical Changes

**File: `src/components/dashboard/sales/SalesBentoCard.tsx`**

1. **Remove the Expected Rev KPICell** (lines 240-248)

2. **Update Total Revenue tooltip** to clarify it's based on scheduled appointments:

```typescript
// Updated tooltip for Total Revenue
tooltip="Total expected revenue from all scheduled appointments in the selected date range."
```

3. **Remove unused CalendarCheck import** (line 15)

---

## Updated KPI Grid (5 cards)

| Position | Metric | Description |
|----------|--------|-------------|
| 1 | Total Revenue | Expected revenue from scheduled appointments |
| 2 | Services | Service revenue |
| 3 | Products | Product revenue |
| 4 | Transactions | Number of appointments |
| 5 | Avg Ticket | Average per appointment |

---

## Result

- Cleaner UI with 5 KPIs instead of 6
- "Total Revenue" now clearly communicates it's based on scheduled appointments
- When you select "Today", you see the full day's expected earnings from all booked appointments

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/sales/SalesBentoCard.tsx` | Remove Expected Rev KPICell, update Total Revenue tooltip |

