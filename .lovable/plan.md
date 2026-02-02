

# Separate Team Leaderboard and Restrict My Stats Visibility

## Overview

This plan separates the **Team Leaderboard** from the **My Stats** page, making them two distinct navigation entries. The leaderboard will become its own standalone page, while "My Stats" will be restricted to only Stylist and Stylist Assistant roles.

---

## Changes Summary

| Change | Description |
|--------|-------------|
| New page | Create `/dashboard/leaderboard` as a standalone page |
| Route update | Remove redirect, add proper protected route with `view_leaderboard` permission |
| Nav update | Add "Team Leaderboard" to `statsNavItems` with Trophy icon |
| Role restriction | Add `roles: ['stylist', 'stylist_assistant']` to "My Stats" nav item |
| Remove tab | Remove the leaderboard tab from the Stats page |

---

## Technical Details

### 1. Create New Leaderboard Page

**File: `src/pages/dashboard/Leaderboard.tsx`** (New file)

A simple wrapper page that renders `LeaderboardContent` within `DashboardLayout`:

```typescript
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LeaderboardContent } from '@/components/dashboard/LeaderboardContent';

export default function Leaderboard() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl mb-2">
              TEAM LEADERBOARD
            </h1>
            <p className="text-muted-foreground font-sans">
              See how the team is performing this week.
            </p>
          </div>
        </div>
        <LeaderboardContent />
      </div>
    </DashboardLayout>
  );
}
```

---

### 2. Update Routing

**File: `src/App.tsx`**

**Changes:**
- Import new Leaderboard page
- Replace redirect with a proper protected route

```typescript
// Add import
import Leaderboard from "./pages/dashboard/Leaderboard";

// Replace line 168:
// Before: <Route path="/dashboard/leaderboard" element={<Navigate to="/dashboard/stats?tab=leaderboard" replace />} />
// After:
<Route path="/dashboard/leaderboard" element={<ProtectedRoute requiredPermission="view_leaderboard"><Leaderboard /></ProtectedRoute>} />
```

---

### 3. Update Navigation Items

**File: `src/components/dashboard/DashboardLayout.tsx`**

**Changes to `statsNavItems` (lines 162-166):**

```typescript
const statsNavItems: NavItem[] = [
  { 
    href: '/dashboard/stats', 
    label: 'My Stats', 
    icon: BarChart3, 
    permission: 'view_own_stats',
    roles: ['stylist', 'stylist_assistant']  // <-- ADD: Restrict to these roles only
  },
  { 
    href: '/dashboard/leaderboard',          // <-- ADD: New entry
    label: 'Team Leaderboard', 
    icon: Trophy,                            // Already imported
    permission: 'view_leaderboard' 
  },
  { href: '/dashboard/my-pay', label: 'My Pay', icon: Wallet, permission: 'view_my_pay' },
  { href: '/dashboard/admin/analytics', label: 'Analytics Hub', icon: TrendingUp, permission: 'view_team_overview' },
];
```

**Why this works:**
- The `filterNavItems` function checks both `permission` AND `roles`
- For "My Stats": permission `view_own_stats` must pass AND user must have `stylist` or `stylist_assistant` role
- For "Team Leaderboard": only permission `view_leaderboard` is checked (visible to all roles with that permission)

---

### 4. Clean Up Stats Page

**File: `src/pages/dashboard/Stats.tsx`**

**Remove:**
1. The leaderboard permission check (line 37)
2. The leaderboard tab trigger (lines 95-106)  
3. The leaderboard tab content (lines 266-270)
4. The `Trophy` icon import and `LeaderboardContent` import

**Before (simplified):**
```tsx
<Tabs value={activeTab} onValueChange={handleTabChange}>
  <TabsList>
    <TabsTrigger value="performance">My Performance</TabsTrigger>
    <TabsTrigger value="leaderboard">Team Leaderboard</TabsTrigger>  // REMOVE
  </TabsList>
  
  <TabsContent value="performance">...</TabsContent>
  <TabsContent value="leaderboard"><LeaderboardContent /></TabsContent>  // REMOVE
</Tabs>
```

**After:**
```tsx
<Tabs value={activeTab} onValueChange={handleTabChange}>
  <TabsList>
    <TabsTrigger value="performance">My Performance</TabsTrigger>
  </TabsList>
  
  <TabsContent value="performance">...</TabsContent>
</Tabs>
```

The page becomes purely about personal stats with no team leaderboard tab.

---

### 5. Update Landing Page Preferences

**File: `src/hooks/useLandingPagePreference.ts`**

Add the leaderboard as a landing page option:

```typescript
// Around line 21, add:
{ path: '/dashboard/leaderboard', label: 'Team Leaderboard', permission: 'view_leaderboard' },
```

And update the My Stats entry to restrict by role:
```typescript
{ path: '/dashboard/stats', label: 'My Stats', permission: 'view_own_stats', roles: ['stylist', 'stylist_assistant'] },
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/pages/dashboard/Leaderboard.tsx` | Create new |
| `src/App.tsx` | Update route + add import |
| `src/components/dashboard/DashboardLayout.tsx` | Update `statsNavItems` |
| `src/pages/dashboard/Stats.tsx` | Remove leaderboard tab |
| `src/hooks/useLandingPagePreference.ts` | Add leaderboard option |

---

## Role Access Summary

| Page | Visible To |
|------|-----------|
| My Stats | `stylist`, `stylist_assistant` only (with `view_own_stats` permission) |
| Team Leaderboard | Anyone with `view_leaderboard` permission (most roles) |
| My Pay | Anyone with `view_my_pay` permission |
| Analytics Hub | Anyone with `view_team_overview` permission |

