

# Leaderboard Configurator Implementation Plan

## Overview

Create a dedicated **Leaderboard Configurator** settings section that houses all leaderboard-related configuration, following the same pattern as the OnboardingConfigurator.

---

## Current State

The LeaderboardWeightsManager is currently misplaced inside the **Onboarding** settings section (lines 1064-1072 of Settings.tsx). This creates confusion since leaderboard scoring has nothing to do with onboarding.

### Existing Leaderboard Features

| Feature | Description | Current Status |
|---------|-------------|----------------|
| **Scoring Weights** | Configure weight distribution for metrics | ✅ Exists (LeaderboardWeightsManager) |
| **Achievements** | Badge definitions and categories | ✅ Exists in DB (`leaderboard_achievements`) |
| **History** | Weekly snapshots of rankings | ✅ Exists in DB (`leaderboard_history`) |

---

## Solution

Create a new **"Leaderboard"** settings category with a dedicated **LeaderboardConfigurator** component that organizes all leaderboard settings with tabs.

### New Settings Card

| Property | Value |
|----------|-------|
| ID | `leaderboard` |
| Label | Leaderboard |
| Description | Scoring weights & achievements |
| Icon | Trophy |

---

## Component Structure

```text
LeaderboardConfigurator
├── Tab: Scoring Weights
│   └── LeaderboardWeightsManager (existing component, moved here)
│
└── Tab: Achievements
    └── AchievementsConfigPanel (new)
        ├── List of achievement definitions
        ├── Enable/disable achievements
        └── Edit badge colors and requirements
```

---

## Implementation Details

### 1. Add New Settings Category

**File: `src/hooks/useSettingsLayout.ts`**

Add `leaderboard` to the color defaults and section groups:

```typescript
// In DEFAULT_ICON_COLORS
leaderboard: '#EAB308', // Gold/Trophy color

// In SECTION_GROUPS - add to 'operations' group
categories: ['business', 'locations', 'schedule', 'dayrate', 'forms', 'levels', 'leaderboard', 'onboarding', 'handbooks', 'loyalty', 'feedback'],
```

### 2. Create LeaderboardConfigurator Component

**File: `src/components/dashboard/settings/LeaderboardConfigurator.tsx`**

Main component with tabbed interface:

```typescript
export function LeaderboardConfigurator() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="scoring">
        <TabsList>
          <TabsTrigger value="scoring">
            <Scale className="w-4 h-4 mr-2" />
            Scoring Weights
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scoring">
          <Card>
            <CardHeader>
              <CardTitle>SCORING ALGORITHM</CardTitle>
              <CardDescription>
                Configure how the overall leaderboard score is calculated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardWeightsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <AchievementsConfigPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 3. Create AchievementsConfigPanel

**File: `src/components/dashboard/settings/AchievementsConfigPanel.tsx`**

Manage achievement definitions:

```typescript
export function AchievementsConfigPanel() {
  // Fetch achievements from leaderboard_achievements table
  // Display as cards with:
  // - Icon preview
  // - Badge color picker
  // - Toggle for is_active
  // - Edit button for name/description/requirements
}
```

### 4. Update Settings.tsx

**File: `src/pages/dashboard/admin/Settings.tsx`**

#### a) Update SettingsCategory type (line 120):
```typescript
type SettingsCategory = '...' | 'leaderboard' | '...' | null;
```

#### b) Add category to categoriesMap:
```typescript
leaderboard: {
  id: 'leaderboard',
  label: 'Leaderboard',
  description: 'Scoring weights & achievements',
  icon: Trophy,
},
```

#### c) Update onboarding section (remove LeaderboardWeightsManager):
```typescript
{activeCategory === 'onboarding' && (
  <OnboardingConfigurator />
)}
```

#### d) Add leaderboard section:
```typescript
{activeCategory === 'leaderboard' && (
  <LeaderboardConfigurator />
)}
```

#### e) Update onboarding description:
```typescript
onboarding: {
  id: 'onboarding',
  label: 'Onboarding',
  description: 'Tasks & role configuration',  // Changed from 'Tasks & leaderboard scoring'
  icon: Rocket,
},
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/settings/LeaderboardConfigurator.tsx` | Main configurator with tabs |
| `src/components/dashboard/settings/AchievementsConfigPanel.tsx` | Manage achievement definitions |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/admin/Settings.tsx` | Add leaderboard category, remove weights from onboarding |
| `src/hooks/useSettingsLayout.ts` | Add `leaderboard` to defaults and section groups |

---

## Visual Layout

```text
+----------------------------------------------+
| 🏆 LEADERBOARD CONFIGURATOR                  |
+----------------------------------------------+
| Tabs: [ Scoring Weights ] [ Achievements ]   |
+----------------------------------------------+
| [Scoring Weights Tab]                        |
| +------------------------------------------+ |
| | ⚖️  SCORING ALGORITHM                    | |
| | Configure how the overall score is       | |
| | calculated from metrics.                 | |
| +------------------------------------------+ |
| | New Clients ====[=====]======  30%       | |
| | Retention   ====[===]========  25%       | |
| | Retail      ====[==]=========  20%       | |
| | Extensions  ====[===]========  25%       | |
| |                                          | |
| | Total: 100%                              | |
| | [Reset Defaults]          [Save Weights] | |
| +------------------------------------------+ |
+----------------------------------------------+

+----------------------------------------------+
| [Achievements Tab]                           |
| +------------------------------------------+ |
| | 🏅 ACHIEVEMENT DEFINITIONS               | |
| +------------------------------------------+ |
| | ☑ 🥇 Top Performer          [Edit] [●]   | |
| | ☑ 🔥 5-Week Streak          [Edit] [●]   | |
| | ☑ 💎 100 New Clients        [Edit] [●]   | |
| | ☐ 🚀 Rising Star (disabled) [Edit] [○]   | |
| +------------------------------------------+ |
+----------------------------------------------+
```

---

## Migration Notes

1. No database changes required - uses existing tables
2. LeaderboardWeightsManager component is reused, not modified
3. Settings card order will auto-update with new category (handled by useSettingsLayout)

