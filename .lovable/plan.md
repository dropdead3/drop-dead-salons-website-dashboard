
# Restrict Review Settings Tab to Super Admins & Add Settings Link

## Overview
The **Review Settings** tab in the Feedback Hub (shown in your screenshot) configures thresholds for routing customers to public review platforms. This is a sensitive configuration that should only be accessible to Super Admins. Additionally, we'll add a quick-access link from the Dashboard Settings page.

---

## Current State

| Location | Current Access |
|----------|----------------|
| Feedback Hub "Review Settings" tab | All users with `manage_settings` permission |
| Dashboard Settings page | No link to Review Settings |

---

## Changes

### 1. Hide "Review Settings" Tab from Non-Super Admins

**File**: `src/pages/dashboard/admin/FeedbackHub.tsx`

The tab and its content will be conditionally rendered only when the user is a super admin. We'll use the `useEmployeeProfile` hook which includes the `is_super_admin` field.

```text
Before:
┌────────────┬───────────────┬────────────┬──────────────────┐
│  Overview  │  Responses    │  By Staff  │  Review Settings │
└────────────┴───────────────┴────────────┴──────────────────┘
                                            (visible to all)

After:
┌────────────┬───────────────┬────────────┬──────────────────┐
│  Overview  │  Responses    │  By Staff  │  Review Settings │
└────────────┴───────────────┴────────────┴──────────────────┘
                                            (super admin only)
```

**Implementation**:
- Import `useEmployeeProfile` hook
- Check `profile?.is_super_admin` before rendering the tab
- Also conditionally render the `TabsContent` for "settings"

### 2. Add "Review Settings" Category to Dashboard Settings

**Files to modify**:
- `src/pages/dashboard/admin/Settings.tsx`
- `src/hooks/useSettingsLayout.ts`

Add a new settings category called **"Review Settings"** (or "Feedback Settings") that is only visible to super admins. When clicked, it will navigate to the Feedback Hub's settings tab.

**Category Card Details**:
| Property | Value |
|----------|-------|
| ID | `feedback` |
| Label | Feedback Settings |
| Description | Review thresholds & platform links |
| Icon | `MessageSquareHeart` (Lucide) |
| Color | `#10B981` (Emerald) |
| Access | Super Admin only |

---

## Technical Implementation

### FeedbackHub.tsx Changes

```tsx
// Add import
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';

// Inside component
const { data: profile } = useEmployeeProfile();
const isSuperAdmin = profile?.is_super_admin;

// In TabsList - conditionally render
{isSuperAdmin && (
  <TabsTrigger value="settings" className="gap-2">
    <Settings className="h-4 w-4" />
    Review Settings
  </TabsTrigger>
)}

// In TabsContent - conditionally render
{isSuperAdmin && (
  <TabsContent value="settings" className="mt-6">
    <ReviewThresholdSettings />
  </TabsContent>
)}
```

### Settings.tsx Changes

1. Add to `SettingsCategory` type:
   ```tsx
   type SettingsCategory = '...' | 'feedback' | null;
   ```

2. Add to `categoriesMap`:
   ```tsx
   feedback: {
     id: 'feedback',
     label: 'Feedback Settings',
     description: 'Review thresholds & platform links',
     icon: MessageSquareHeart,
   },
   ```

3. Add to imports:
   ```tsx
   import { MessageSquareHeart } from 'lucide-react';
   import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
   import { ReviewThresholdSettings } from '@/components/feedback/ReviewThresholdSettings';
   ```

4. Add conditional rendering for super admin:
   ```tsx
   // Only show feedback category to super admins
   const { data: profile } = useEmployeeProfile();
   const isSuperAdmin = profile?.is_super_admin;
   
   // Filter categories in grid to exclude 'feedback' for non-super admins
   ```

5. Add content handler:
   ```tsx
   {activeCategory === 'feedback' && <ReviewThresholdSettings />}
   ```

### useSettingsLayout.ts Changes

1. Add to `DEFAULT_ICON_COLORS`:
   ```tsx
   feedback: '#10B981',  // Emerald (client feedback theme)
   ```

2. Add to `SECTION_GROUPS` under "Business Operations":
   ```tsx
   categories: ['business', 'locations', 'schedule', 'dayrate', 'forms', 'levels', 'onboarding', 'handbooks', 'loyalty', 'feedback'],
   ```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/admin/FeedbackHub.tsx` | Hide "Review Settings" tab for non-super admins |
| `src/pages/dashboard/admin/Settings.tsx` | Add "Feedback Settings" category card (super admin only) |
| `src/hooks/useSettingsLayout.ts` | Add 'feedback' to default order and icon colors |

---

## Access Control Summary

| Feature | Required Access |
|---------|-----------------|
| Feedback Hub (Overview, Responses, By Staff tabs) | `manage_settings` permission |
| Review Settings tab (in Feedback Hub) | `is_super_admin = true` |
| Feedback Settings card (in Settings page) | `is_super_admin = true` |

This ensures:
- Account Owners (who are super admins) can configure review thresholds
- Super Admins can configure review thresholds
- Regular admins/managers can view feedback data but cannot modify gating settings
