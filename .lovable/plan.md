
# Fix Visibility State Display in Sidebar Navigation Editor

## Problem
When viewing role-specific navigation settings, the editor doesn't properly show which links are hidden. Looking at the screenshot:
- The **actual sidebar** (left) shows only ~8 items in Management
- The **editor** (right) shows 18/18 items as "visible" 

The visibility toggles (eye icons) are all showing as "visible" because the editor only checks role-specific overrides, ignoring the global hidden state.

## Root Cause
In `SidebarLayoutEditor.tsx`, the `currentHiddenLinks` calculation only returns role-specific hidden links when a role is selected:

```typescript
const currentHiddenLinks = useMemo(() => {
  if (selectedRole === 'global') {
    return localHiddenLinks;  // Global hidden state
  }
  return localRoleVisibility[selectedRole]?.hiddenLinks || {};  // Role-only, missing global!
}, ...);
```

This means:
- Items hidden globally don't appear hidden when viewing a role
- The visibility state in the editor doesn't match what users actually see

## Solution
Merge global hidden links with role-specific hidden links when calculating `currentHiddenLinks` for a role view.

---

## Technical Implementation

### File: `src/components/dashboard/settings/SidebarLayoutEditor.tsx`

**Update `currentHiddenSections` calculation (around line 629):**

```typescript
const currentHiddenSections = useMemo(() => {
  if (selectedRole === 'global') {
    return localHiddenSections;
  }
  // Merge global hidden with role-specific hidden
  const roleHidden = localRoleVisibility[selectedRole]?.hiddenSections || [];
  return [...new Set([...localHiddenSections, ...roleHidden])];
}, [selectedRole, localHiddenSections, localRoleVisibility]);
```

**Update `currentHiddenLinks` calculation (around line 636):**

```typescript
const currentHiddenLinks = useMemo(() => {
  if (selectedRole === 'global') {
    return localHiddenLinks;
  }
  // Merge global hidden links with role-specific hidden links
  const roleHiddenLinks = localRoleVisibility[selectedRole]?.hiddenLinks || {};
  const merged: Record<string, string[]> = {};
  
  // Start with global hidden links
  Object.entries(localHiddenLinks).forEach(([sectionId, links]) => {
    merged[sectionId] = [...links];
  });
  
  // Add role-specific hidden links
  Object.entries(roleHiddenLinks).forEach(([sectionId, links]) => {
    if (merged[sectionId]) {
      merged[sectionId] = [...new Set([...merged[sectionId], ...links])];
    } else {
      merged[sectionId] = [...links];
    }
  });
  
  return merged;
}, [selectedRole, localHiddenLinks, localRoleVisibility]);
```

---

## Visual Behavior After Fix

| Before | After |
|--------|-------|
| Role view shows 18/18 visible | Role view shows accurate count (e.g., 8/18 visible) |
| All eye icons show "visible" | Hidden items show "Hidden" badge + EyeOff icon |
| Toggling visibility doesn't reflect global state | Global + role hidden items properly merged |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/settings/SidebarLayoutEditor.tsx` | Update `currentHiddenSections` and `currentHiddenLinks` memos to merge global + role visibility |

---

## Additional Consideration
The toggle handlers (`handleToggleLinkVisibility`, `handleToggleSectionVisibility`) are correctly written - they only modify the role-specific overrides when a role is selected. This is the right behavior since:
- Global hidden items should remain hidden for all roles
- Role-specific overrides add additional restrictions for that role
- The merged view shows the effective visibility (global + role)
