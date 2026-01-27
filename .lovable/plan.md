
# Combine My Stats & Leaderboard Pages

## Overview

Merge the Leaderboard page into the My Stats page as a new tab, creating a unified performance hub where stylists can view their personal stats and compare their performance with the team.

## Current Structure

| Page | Content | Route |
|------|---------|-------|
| My Stats | Personal Phorest metrics, goals, trends, achievements, conversion dashboard | `/dashboard/stats` |
| Leaderboard | Weekly rankings, achievements showcase, program progress | `/dashboard/leaderboard` |

## Proposed Structure

The combined My Stats page will use primary "pill" style tabs at the top:

```text
+--------------------------------------------------+
|  MY STATS & LEADERBOARD                          |
|  Track your performance and compare with team    |
+--------------------------------------------------+
|  [My Performance]  [Team Leaderboard]            |
+--------------------------------------------------+
|                                                  |
|  (Tab content here)                              |
|                                                  |
+--------------------------------------------------+
```

**Tab 1: My Performance** (default)
- Current My Stats content (Phorest card, goals, trends, service mix, achievements, conversion dashboard)

**Tab 2: Team Leaderboard**
- Current Leaderboard content (Weekly Rankings, Achievements, Program Progress sub-tabs)

## Files to Modify

### 1. `src/pages/dashboard/Stats.tsx`

Transform into a tabbed layout:
- Add `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` imports
- Wrap existing content in "performance" tab
- Extract Leaderboard content into a new component and render in "leaderboard" tab
- Update header to reflect combined purpose

```typescript
// New structure
<Tabs defaultValue="performance" className="space-y-6">
  <TabsList>
    <TabsTrigger value="performance">
      <BarChart3 className="w-4 h-4 mr-2" />
      My Performance
    </TabsTrigger>
    <TabsTrigger value="leaderboard">
      <Trophy className="w-4 h-4 mr-2" />
      Team Leaderboard
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="performance">
    {/* Existing My Stats content */}
  </TabsContent>
  
  <TabsContent value="leaderboard">
    <LeaderboardContent />
  </TabsContent>
</Tabs>
```

### 2. Create `src/components/dashboard/LeaderboardContent.tsx`

Extract the Leaderboard page's inner content (everything inside the `<div className="p-6 lg:p-8">`) into a reusable component. This keeps the Stats page clean and allows the content to be rendered without the `DashboardLayout` wrapper.

Contains:
- Score calculation logic
- Weekly Rankings tab (Phorest data)
- Achievements tab
- Program Progress tab
- History panel
- All existing Leaderboard functionality

### 3. `src/App.tsx`

Add redirect from old leaderboard route to stats page with tab parameter:

```typescript
// Change this:
<Route path="/dashboard/leaderboard" element={<ProtectedRoute requiredPermission="view_leaderboard"><Leaderboard /></ProtectedRoute>} />

// To this:
<Route path="/dashboard/leaderboard" element={<Navigate to="/dashboard/stats?tab=leaderboard" replace />} />
```

### 4. `src/components/dashboard/DashboardLayout.tsx`

Remove Leaderboard from sidebar navigation:

```typescript
// Before
const statsNavItems: NavItem[] = [
  { href: '/dashboard/stats', label: 'My Stats', icon: BarChart3, permission: 'view_own_stats' },
  { href: '/dashboard/my-clients', label: 'My Clients', icon: Users, permission: 'view_own_stats', roles: ['stylist', 'stylist_assistant'] },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy, permission: 'view_leaderboard' },
  { href: '/dashboard/admin/analytics', label: 'Analytics Hub', icon: TrendingUp, permission: 'view_team_overview' },
];

// After
const statsNavItems: NavItem[] = [
  { href: '/dashboard/stats', label: 'My Stats', icon: BarChart3, permission: 'view_own_stats' },
  { href: '/dashboard/my-clients', label: 'My Clients', icon: Users, permission: 'view_own_stats', roles: ['stylist', 'stylist_assistant'] },
  { href: '/dashboard/admin/analytics', label: 'Analytics Hub', icon: TrendingUp, permission: 'view_team_overview' },
];
```

### 5. Update Sidebar Editor Config Files

Remove Leaderboard from sidebar customization:
- `src/components/dashboard/settings/SidebarLayoutEditor.tsx`
- `src/components/dashboard/settings/SidebarPreview.tsx`

## URL Tab Persistence

Support deep linking with query parameter:
- `/dashboard/stats` → defaults to "performance" tab
- `/dashboard/stats?tab=leaderboard` → opens leaderboard tab

```typescript
import { useSearchParams } from 'react-router-dom';

const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') || 'performance';

const handleTabChange = (value: string) => {
  setSearchParams({ tab: value });
};

<Tabs value={activeTab} onValueChange={handleTabChange}>
```

## Permission Handling

The Leaderboard tab will only be visible if the user has `view_leaderboard` permission:

```typescript
const { hasPermission } = useAuth();
const canViewLeaderboard = hasPermission('view_leaderboard');

// In TabsList
{canViewLeaderboard && (
  <TabsTrigger value="leaderboard">
    <Trophy className="w-4 h-4 mr-2" />
    Team Leaderboard
  </TabsTrigger>
)}
```

## Files Summary

| File | Action |
|------|--------|
| `src/pages/dashboard/Stats.tsx` | Modify - Add tabs, integrate LeaderboardContent |
| `src/components/dashboard/LeaderboardContent.tsx` | Create - Extract from Leaderboard.tsx |
| `src/pages/dashboard/Leaderboard.tsx` | Delete - No longer needed |
| `src/App.tsx` | Modify - Redirect leaderboard route |
| `src/components/dashboard/DashboardLayout.tsx` | Modify - Remove leaderboard nav item |
| `src/components/dashboard/settings/SidebarLayoutEditor.tsx` | Modify - Remove leaderboard mapping |
| `src/components/dashboard/settings/SidebarPreview.tsx` | Modify - Remove leaderboard mapping |

## Benefits

1. **Unified Experience**: Stylists can see their personal stats and team comparison in one place
2. **Reduced Navigation**: One fewer sidebar item, cleaner navigation
3. **Context Preservation**: Easy to flip between "how am I doing" and "how does the team compare"
4. **Deep Linking**: URLs persist tab state for sharing and bookmarking
5. **Permission-Aware**: Leaderboard tab only shows if user has appropriate permission

## Updated Header

```typescript
<div className="flex items-center justify-between mb-8">
  <div>
    <h1 className="font-display text-3xl lg:text-4xl mb-2">
      MY STATS
    </h1>
    <p className="text-muted-foreground font-sans">
      Track your performance and compare with the team.
    </p>
  </div>
</div>
```
