
# Dynamic Onboarding Label: "START HERE" → "Finish Your Onboarding"

## Overview

Update the sidebar onboarding indicator to show a dynamic label based on user progress. Users who have completed at least one onboarding item will see "FINISH YOUR ONBOARDING" instead of "START HERE" to encourage completion.

---

## Current Behavior

- The sidebar shows "START HERE" with a progress bar when onboarding is incomplete
- The label is static regardless of whether the user has made any progress
- The `onboardingProgress` object already tracks `completedCount` (number of items completed)

---

## Proposed Behavior

| User State | Completed Count | Label |
|------------|-----------------|-------|
| Brand new user | 0 | START HERE |
| User has completed 1+ items | 1 or more | FINISH YOUR ONBOARDING |
| Onboarding complete | N/A | (Section hidden) |

---

## Technical Implementation

### Update SidebarNavContent.tsx

The `onboardingProgress` prop already includes `completedCount`. We just need to use it to determine the label.

**Change 1 - Expanded sidebar label (line 364):**

```tsx
// Before
<span className="flex-1 font-display">START HERE</span>

// After
<span className="flex-1 font-display">
  {onboardingProgress && onboardingProgress.completedCount > 0 
    ? 'FINISH YOUR ONBOARDING' 
    : 'START HERE'}
</span>
```

**Change 2 - Collapsed sidebar tooltip (line 348):**

```tsx
// Before
START HERE {onboardingProgress && `(${onboardingProgress.percentage}%)`}

// After
{onboardingProgress && onboardingProgress.completedCount > 0 
  ? 'Finish Your Onboarding' 
  : 'START HERE'} {onboardingProgress && `(${onboardingProgress.percentage}%)`}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/SidebarNavContent.tsx` | Update label text at lines 348 and 364 to be conditional based on `completedCount` |

---

## User Experience

| Action | Result |
|--------|--------|
| First login, 0 tasks completed | Sees "START HERE" with 0% progress |
| Completes first task/handbook | Label updates to "FINISH YOUR ONBOARDING" |
| Tooltip on collapsed sidebar | Shows matching contextual label |

---

## Data Flow

No changes to data flow are required. The `completedCount` value is already:
1. Calculated in `DashboardLayout.tsx` (line 227)
2. Passed to `SidebarNavContent` via the `onboardingProgress` prop (line 229)
3. Available for use in the label logic

---

## Technical Notes

- No database changes required
- No new API calls needed
- The change is purely presentational
- Progress persistence already exists through the `onboarding_task_completions`, `handbook_acknowledgments`, `business_card_requests`, and `headshot_requests` tables
