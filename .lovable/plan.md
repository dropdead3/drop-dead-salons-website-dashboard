

# Remove Redundant Team Tools Section from Navigation

## Overview

Now that Team Tools has been consolidated into the Management section as a collapsible sub-group, the standalone Team Tools section infrastructure is redundant and should be removed.

---

## Current State

The Team Tools items now live inside the Management section's collapsible sub-groups. However, the old standalone section infrastructure remains:

| Component | Status |
|-----------|--------|
| `teamToolsNavItems` array | Empty array (items moved) |
| `teamToolsNavItems` prop | Still passed around |
| `sectionItemsMap.teamTools` | Still referenced |
| `SECTION_LABELS.teamTools` | Still defined |

---

## Changes Required

### 1. Remove from SidebarNavContent.tsx

**Remove from props interface (lines 37):**
```typescript
// Remove this line
teamToolsNavItems: NavItem[];
```

**Remove from destructured props (line 63):**
```typescript
// Remove teamToolsNavItems from destructuring
```

**Remove from sectionItemsMap (line 93):**
```typescript
// Remove: teamTools: teamToolsNavItems,
```

**Remove from allNavItemsByHref computation (lines 107, 119):**
```typescript
// Remove: ...teamToolsNavItems,
```

---

### 2. Remove from DashboardLayout.tsx

**Remove empty array definition (lines 161-162):**
```typescript
// Remove these lines
// Team Tools section - now consolidated into Management section
const teamToolsNavItems: NavItem[] = [];
```

**Remove effectiveTeamToolsNavItems transformation (lines 370-378):**
```typescript
// Remove the entire effectiveTeamToolsNavItems block
```

**Remove from SidebarNavContent props (lines 801, 834):**
```typescript
// Remove: teamToolsNavItems={effectiveTeamToolsNavItems}
```

---

### 3. Update useSidebarLayout.ts

**Remove from SECTION_LABELS (line 21):**
```typescript
// Remove: teamTools: 'Team Tools',
```

Note: Keep `MANAGEMENT_SUB_GROUPS.teamTools` as this is used for the collapsible sub-group within Management.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/SidebarNavContent.tsx` | Remove `teamToolsNavItems` prop and all references |
| `src/components/dashboard/DashboardLayout.tsx` | Remove empty array and prop passing |
| `src/hooks/useSidebarLayout.ts` | Remove from `SECTION_LABELS` |

---

## Summary

This cleanup removes ~20 lines of now-redundant code while keeping the Team Tools sub-group functionality intact within the Management section.

