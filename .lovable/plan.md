

# Move Onboarding Overview to Onboarding Hub

## Overview

This plan moves the `OnboardingTrackerOverview` card off the Command Center and into the Onboarding Tracker page (which will be renamed to "Onboarding Hub"). The overview card will become a summary section at the top of the Onboarding Hub page.

## Current State

| Location | Component | Purpose |
|----------|-----------|---------|
| Command Center | `OnboardingTrackerOverview` | Pinnable summary card (via `onboarding_overview` visibility key) |
| Analytics Hub > Staffing | `OnboardingTrackerOverview` | Summary with link to full tracker |
| Onboarding Tracker page | Stats cards (separate implementation) | Duplicative stats display |

## Problem

1. The `OnboardingTrackerOverview` component is a summary card intended for quick glances
2. It's currently pinnable to the Command Center, but the user wants it moved permanently to the Onboarding page
3. The page is called "Onboarding Tracker" but should be renamed to "Onboarding Hub"

## Solution

1. **Rename page**: "Onboarding Tracker" → "Onboarding Hub" (title, sidebar labels, route stays the same)
2. **Integrate overview**: Add `OnboardingTrackerOverview` as a summary section at the top of the Onboarding Hub page
3. **Remove from Command Center**: Remove the pinning toggle and Command Center rendering for this card
4. **Remove from Analytics Hub Staffing**: Remove from StaffingContent.tsx (consolidate in Onboarding Hub)

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/admin/OnboardingTracker.tsx` | Change title to "ONBOARDING HUB", add `OnboardingTrackerOverview` at top, remove pin toggle |
| `src/components/dashboard/DashboardLayout.tsx` | Change sidebar label to "Onboarding Hub" |
| `src/components/dashboard/settings/SidebarLayoutEditor.tsx` | Change label to "Onboarding Hub" |
| `src/components/dashboard/settings/SidebarPreview.tsx` | Change label to "Onboarding Hub" |
| `src/components/dashboard/CommandCenterAnalytics.tsx` | Remove `OnboardingTrackerOverview` import and rendering |
| `src/components/dashboard/analytics/StaffingContent.tsx` | Remove `OnboardingTrackerOverview` import and section |
| `src/components/dashboard/OnboardingTrackerOverview.tsx` | Remove `CommandCenterVisibilityToggle` (no longer pinnable), update info button tooltip |

## Updated Page Layout

```text
Onboarding Hub (/dashboard/admin/onboarding-tracker)
┌──────────────────────────────────────────────────────────────┐
│  ONBOARDING HUB                                              │
│  Monitor team onboarding progress                            │
├──────────────────────────────────────────────────────────────┤
│  OnboardingTrackerOverview (Summary Card)                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Team Completion ██████████░░░░░░░░░░  50%              │  │
│  │ ┌────────┬────────┬────────┬────────┐                  │  │
│  │ │ Total  │  Done  │ Active │Pending │                  │  │
│  │ │   7    │   0    │   7    │   0    │                  │  │
│  │ └────────┴────────┴────────┴────────┘                  │  │
│  │ Handbooks: 100%  │  Tasks: 0%                          │  │
│  │ Business Cards: 0 │  Headshots: 0                      │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  [Existing detailed tracker content - filters, staff list]  │
└──────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. OnboardingTracker.tsx Changes

**Header update (line 424):**
```tsx
// Before
<h1 className="font-display text-2xl lg:text-3xl mb-1">ONBOARDING TRACKER</h1>

// After
<h1 className="font-display text-2xl lg:text-3xl mb-1">ONBOARDING HUB</h1>
```

**Remove pin toggle (lines 429-432):** Delete `CommandCenterVisibilityToggle`

**Add overview card after header, before stats cards:**
```tsx
import { OnboardingTrackerOverview } from '@/components/dashboard/OnboardingTrackerOverview';

// After header, before Stats Cards section:
<OnboardingTrackerOverview />
```

### 2. Remove existing stats cards

The page currently has its own stats cards (lines 436-481) that duplicate what `OnboardingTrackerOverview` shows. These can be removed since the overview component now provides this functionality.

### 3. Sidebar Labels

Update all three files with the label change:
```tsx
// Before
{ label: 'Onboarding Tracker', ... }

// After
{ label: 'Onboarding Hub', ... }
```

### 4. CommandCenterAnalytics.tsx

Remove:
- Import of `OnboardingTrackerOverview` (line 8)
- `hasOnboardingOverview` variable (line 67)
- Reference in `hasAnyPinned` (line 81)
- Rendering block (lines 243-248)

### 5. StaffingContent.tsx

Remove:
- Import of `OnboardingTrackerOverview` (line 6)
- Onboarding Tracker section (lines 24-27)

### 6. OnboardingTrackerOverview.tsx

Since it's no longer pinnable to Command Center:
- Remove `CommandCenterVisibilityToggle` import and usage
- Remove or update the info button (currently links to the tracker page - can be removed since it's now on that page)

## Benefits

1. **Consolidated**: All onboarding data in one dedicated hub
2. **Simplified**: No pinning complexity for this component
3. **Better naming**: "Hub" implies a comprehensive destination
4. **Reduced redundancy**: Single source of truth for onboarding overview

