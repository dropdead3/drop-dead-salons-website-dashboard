

# Sidebar Navigation Enhancement Plan

## Current State Analysis

### Navigation Sections (9 total)

| Section | Items | Primary Audience |
|---------|-------|------------------|
| **Main** | 2 (Command Center, Schedule) | Everyone |
| **Growth** | 5 (Training, Program, Team Overview, Ring the Bell, My Graduation) | Stylists/Assistants + Management |
| **Stats & Leaderboard** | 3 (My Stats, Leaderboard, My Pay) | Stylists/Assistants |
| **Team Tools** | 4 (Shift Swaps, Rewards, Assistant Schedule, Meetings) | Team Members |
| **Housekeeping** | 4 (Onboarding, Handbooks, What's New, Help Center) | Everyone |
| **Management** | 8 items | Managers/Admins |
| **Website** | 1 (Website Editor) | Admins |
| **Super Admin** | 2 (Invitations, Access Hub) | Admins |
| **Platform Admin** | 6 items | Platform Team |

### Key Issues Identified

1. **Management Section Overload**: 8 items creates visual clutter and excessive scrolling
2. **Naming Inconsistency**: "Super Admin" section contains Access Hub, which is available to admins too
3. **Redundant Items**: Team Stats and Leaderboard appear in both "Stats & Leaderboard" and "Management" sections
4. **Low-Value Space Usage**: "Housekeeping" uses sidebar real estate for items that could live elsewhere (What's New, Help)
5. **Single-Item Section**: "Website" section has only 1 item

---

## Proposed Consolidation

### New Structure (6 sections instead of 9)

```text
+----------------------------+
| Main                       |
|   Command Center           |
|   Schedule                 |
+----------------------------+
| Growth & Development       |  (renamed from "Growth")
|   Training                 |
|   Program                  |
|   Ring the Bell            |
|   My Graduation            |
+----------------------------+
| My Performance             |  (renamed from "Stats & Leaderboard")
|   My Stats / Team Stats    |
|   Team Leaderboard         |
|   My Pay                   |
+----------------------------+
| Team Tools                 |
|   Shift Swaps              |
|   Rewards                  |
|   Assistant Schedule       |
|   Meetings & Accountability|
+----------------------------+
| Management                 |  (consolidated)
| > Analytics & Insights     |  <- Collapsible group
|     Analytics Hub          |
|     Team Stats             |
|     Team Leaderboard       |
| > People                   |  <- Collapsible group
|     Team Directory         |
|     Client Directory       |
|     Program Team Overview  |
| > Operations               |  <- Collapsible group
|     Management Hub         |
|     Payroll Hub            |
|     Renter Hub             |
|     Website Editor         |
+----------------------------+
| Admin                      |  (renamed from "Super Admin")
|   Invitations & Approvals  |
|   Access Hub               |
+----------------------------+
| [Settings]                 |  <- Fixed footer (already implemented)
+----------------------------+
```

### Housekeeping Items Relocation

| Item | New Location |
|------|--------------|
| **Onboarding** | Keep as "START HERE" priority section (already exists) |
| **Handbooks** | Move to quick-access menu in top bar (accessible via Help icon) |
| **What's New** | Move to top bar notification bell dropdown |
| **Help Center** | Move to top bar (dedicated help icon already exists) |

---

## Implementation Details

### 1. Collapsible Sub-Groups for Management

Add collapsible groups using the existing Collapsible component from Radix UI.

```typescript
// New component: CollapsibleNavGroup
interface CollapsibleNavGroupProps {
  label: string;
  icon: React.ComponentType;
  items: NavItem[];
  defaultOpen?: boolean;
}
```

Each group expands/collapses independently, with state persisted to localStorage.

### 2. Section Consolidation

**Merge these sections:**
- "Website" (1 item) into "Management > Operations"
- Remove "Housekeeping" entirely (items relocated)
- Rename "Super Admin" to "Admin"

**Update constants in `useSidebarLayout.ts`:**

```typescript
export const DEFAULT_SECTION_ORDER = [
  'main',
  'growth',
  'stats',
  'teamTools',
  'manager',     // Now includes website + sub-groups
  'adminOnly',   // Renamed display label to "Admin"
  'platform',
];
```

### 3. Relocate Housekeeping Items

**Top Bar Changes:**
- Add "What's New" badge/indicator to the existing notification bell
- Add Handbooks to the Help dropdown menu
- Help Center already accessible via search (Cmd+K)

### 4. Label Updates

| Old | New |
|-----|-----|
| Stats & Leaderboard | My Performance |
| Growth | Growth & Development |
| Super Admin | Admin |
| Housekeeping | *removed* |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useSidebarLayout.ts` | Update `DEFAULT_SECTION_ORDER`, `SECTION_LABELS`, and `DEFAULT_LINK_ORDER` |
| `src/components/dashboard/DashboardLayout.tsx` | Restructure nav item arrays, add collapsible group logic |
| `src/components/dashboard/SidebarNavContent.tsx` | Implement `CollapsibleNavGroup` for Management section |
| `src/components/dashboard/TopBarSearch.tsx` | Add Handbooks and What's New to quick access |
| `src/components/dashboard/NotificationsPanel.tsx` | Add "What's New" tab or section |

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/CollapsibleNavGroup.tsx` | Reusable collapsible group for sidebar |

---

## Visual Summary

```text
BEFORE (9 sections, flat)     AFTER (6 sections, grouped)
+------------------------+    +------------------------+
| Main (2)               |    | Main (2)               |
| Growth (5)             |    | Growth & Development (4)|
| Stats (3)              |    | My Performance (3)     |
| Team Tools (4)         |    | Team Tools (4)         |
| Housekeeping (4)       |    | Management (10 grouped)|
| Management (8)         |    |   > Analytics (3)      |
| Website (1)            |    |   > People (3)         |
| Super Admin (2)        |    |   > Operations (4)     |
| Platform (6)           |    | Admin (2)              |
+------------------------+    | Platform (6)           |
                              +------------------------+
                              + Top Bar: Help, Handbooks
                              + Bell: What's New
```

---

## Migration Notes

1. **Backward Compatibility**: Existing `sidebar_layout` database config will continue to work; new sections merge with stored preferences
2. **Role Visibility**: Collapsible state is purely UI; visibility still controlled by `roleVisibility` config in Access Hub
3. **Custom Sections**: User-created custom sections remain unaffected

