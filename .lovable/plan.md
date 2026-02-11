

# Split Top Bar into Two Rows

## Problem
The current single top bar is overcrowded with too many controls: sidebar toggle, search, help, org switcher, hide numbers, access badge, View As, Phorest sync, notifications, and user menu -- all fighting for space on one 56px row.

## Solution
Split into two distinct bars:

### Bar 1: Platform and Context Bar (top)
A slim, secondary bar dedicated to platform-level and organizational context controls:
- **Organization Switcher** ("Platform View" dropdown) -- left-aligned
- **Show/hide $** toggle
- **Access Badge** (Super Admin / General Manager / etc.)
- **View As** dropdown
- **Phorest Sync** popout

This bar only renders for admin/platform users who actually need these controls. Non-admin users see only the main bar.

### Bar 2: Main Top Bar (below)
The primary navigation bar with everyday tools:
- **Sidebar toggle** (left)
- **Search bar** (center)
- **Help Center** icon
- **Next Client Indicator** (stylists only)
- **Notifications bell**
- **User avatar/menu** (right)

## Visual Treatment
- **Bar 1 (Context Bar):** Slightly shorter height (`h-10`), subtle background distinction (slightly darker/tinted), thinner bottom border. Feels like a toolbar ribbon.
- **Bar 2 (Main Bar):** Keeps current `h-14` height and styling. Feels like the primary header.
- Both bars are sticky together at the top, so they scroll as one unit.

---

## Technical Details

### File: `src/components/dashboard/DashboardLayout.tsx`

**Extract a new component** `DashboardContextBar` inline (or as a separate file) that contains:
- `OrganizationSwitcher` (platform users only)
- `HideNumbersToggle`
- Access `Badge`
- `ViewAsToggle`
- `PhorestSyncPopout`

Replace the single desktop top bar block (lines ~997-1093) with two stacked bars:

```text
+--------------------------------------------------+
| [Platform View v]  Show/hide $  [Super Admin]  [View As v]  [Sync] |  <-- Context Bar (h-10)
+--------------------------------------------------+
| [=]         [ Search...  Cmd+K ]         [?] [Sync] [Bell] [Avatar] |  <-- Main Bar (h-14)
+--------------------------------------------------+
```

**Visibility rules:**
- Context Bar: Only renders when `isAdmin || isPlatformUser` (users who need org/role controls)
- Main Bar: Always renders for all desktop users

**Sticky behavior:** Wrap both bars in the existing sticky container so they pin together.

### Files Changed
| File | Change |
|---|---|
| `src/components/dashboard/DashboardLayout.tsx` | Split the desktop top bar section (lines ~997-1093) into two stacked bars. Move platform/org/access controls into the new context bar. Keep search, help, notifications, and user menu in the main bar. |

No new files or dependencies required -- this is a layout reorganization within the existing component.

