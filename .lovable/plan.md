

# Remove Redundant Dollar Sign Icon from Total Revenue

## Overview

Remove the `DollarSign` icon that appears above the Total Revenue number since the section already has multiple dollar sign indicators:
- Card header icon ($ in the top-left badge)
- "$" prefix on Total Revenue amount
- "$" prefix on Services and Products amounts

---

## Current State

```text
┌─────────────────────────────────────────┐
│  $  SALES OVERVIEW                      │  ← Dollar sign in header
│                                         │
│               $                         │  ← REDUNDANT - remove this
│            $1,424                       │  ← Already has $ prefix
│         Total Revenue                   │
│                                         │
│   ┌─────────────┐  ┌─────────────┐     │
│   │ $1,424      │  │ $0          │     │  ← Already have $ prefix
│   │ Services    │  │ Products    │     │
│   └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────┘
```

---

## After Change

```text
┌─────────────────────────────────────────┐
│  $  SALES OVERVIEW                      │
│                                         │
│            $1,424                       │  ← Clean, no redundant icon
│         Total Revenue                   │
│                                         │
│   ┌─────────────┐  ┌─────────────┐     │
│   │ $1,424      │  │ $0          │     │
│   │ Services    │  │ Products    │     │
│   └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────┘
```

---

## Technical Change

**File:** `src/components/dashboard/AggregateSalesCard.tsx`

Remove lines 305-307:

```typescript
// DELETE these lines:
<div className="flex justify-center mb-2">
  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
</div>
```

The Total Revenue hero section will simply start with the `AnimatedBlurredAmount` component, creating a cleaner visual.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/AggregateSalesCard.tsx` | Remove the DollarSign icon div (lines 305-307) from the Total Revenue hero section |

