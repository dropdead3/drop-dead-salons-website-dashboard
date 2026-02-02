

# UI Refinement: Client Detail Sheet Header

## Issues Identified

Looking at the current layout:
1. The **Ban Client button** sits awkwardly below the header in its own row, creating visual disconnection
2. The **client name** uses `items-start` alignment which doesn't vertically center it with the avatar
3. The overall header feels disjointed with too many visual layers

## Proposed Changes

### Layout Restructure

Move the Ban Client toggle to the **right side of the header row**, inline with the avatar and name. This creates a cleaner single-row header with:
- Avatar on the left
- Name and badges in the center/flex area
- Ban action button on the right

### Alignment Fix

Change from `items-start` to `items-center` so the name aligns vertically with the center of the avatar.

---

## Technical Details

### File: `src/components/dashboard/ClientDetailSheet.tsx`

**Current structure (lines 77-117):**
```text
SheetHeader
├── div (flex items-start) ← Problem: not centered
│   ├── Avatar
│   └── div (name, badges)
└── div (mt-3) ← Problem: Ban button isolated here
    └── BanClientToggle
```

**New structure:**
```text
SheetHeader
└── div (flex items-center) ← Fixed: centered alignment
    ├── Avatar
    ├── div (flex-1, name, badges)
    └── BanClientToggle ← Moved: inline with header
```

**Key changes:**
1. Change `items-start` to `items-center` on line 78
2. Move `BanClientToggle` inside the header flex container (after the name div)
3. Remove the separate `<div className="mt-3">` wrapper for the ban toggle

### Visual Result

```text
Before:
+------------------+
| [Avatar]  NAME   |
|           VIP    |
+------------------+
| [Ban Client]     |
+------------------+

After:
+----------------------------------+
| [Avatar]  NAME  VIP  [Ban Client]|
+----------------------------------+
```

---

## Summary

| Change | Description |
|--------|-------------|
| Alignment | Change `items-start` to `items-center` for vertical centering |
| Ban Button Position | Move inline with header row, positioned on the right |
| Remove wrapper | Delete the separate `mt-3` div that isolated the ban button |

This creates a cleaner, more cohesive header that matches professional UI patterns.

