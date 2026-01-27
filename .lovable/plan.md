
# Fix Role Selector Redundancy in Role Access Configurator

## Problem

The screenshot shows **three overlapping role selectors**:

1. **Top Selector** (Card 1): Role buttons with visibility stats (Super Admin 20/22, Director Of Operations 34/37, etc.)

2. **Middle Section** (Card 2 Header): "SUPER ADMIN ACCESS" banner showing the selected role with "Copy from..." and "Reset" actions

3. **Nested Selector** (Inside SidebarLayoutEditor): "VISIBILITY MODE" tabs with Global, Super Admin, DOO, etc.

This creates a confusing UX where users see role selection in three places.

## Root Cause

`SidebarLayoutEditor` was originally a standalone component with its own role selection. When embedded inside `RoleAccessConfigurator`, the parent added another role selector, creating duplication.

## Solution

Modify `SidebarLayoutEditor` to accept an optional `selectedRole` prop. When provided:
- Use the external role instead of internal state
- Hide its own role selector UI
- Allow the parent `RoleAccessConfigurator` to control which role is being edited

This approach keeps `SidebarLayoutEditor` backwards compatible for standalone use while eliminating redundancy when embedded.

## File Changes

### 1. `src/components/dashboard/settings/SidebarLayoutEditor.tsx`

**Add props interface:**
```typescript
interface SidebarLayoutEditorProps {
  // When provided, hides internal role selector and uses this role
  externalSelectedRole?: string;
  onRoleChange?: (role: string) => void;
}

export function SidebarLayoutEditor({ 
  externalSelectedRole, 
  onRoleChange 
}: SidebarLayoutEditorProps = {}) {
```

**Use external role when provided:**
```typescript
// Role selection - use external if provided, otherwise internal state
const [internalSelectedRole, setInternalSelectedRole] = useState<string>('global');
const selectedRole = externalSelectedRole ?? internalSelectedRole;

const handleRoleChange = (role: string) => {
  if (externalSelectedRole !== undefined) {
    onRoleChange?.(role);
  } else {
    setInternalSelectedRole(role);
  }
};
```

**Conditionally hide role selector UI (lines 1002-1070):**
```typescript
{/* Only show role selector if not controlled externally */}
{externalSelectedRole === undefined && (
  <div className="space-y-2">
    <p className="text-xs font-medium ...">VISIBILITY MODE</p>
    <Tabs value={selectedRole} onValueChange={handleRoleChange}>
      {/* ... existing TabsList ... */}
    </Tabs>
    {/* ... role hint text ... */}
  </div>
)}
```

### 2. `src/components/dashboard/settings/RoleAccessConfigurator.tsx`

**Pass selected role to SidebarLayoutEditor:**
```typescript
<TabsContent value="navigation" className="mt-0">
  <SidebarLayoutEditor 
    externalSelectedRole={selectedRole === '' ? undefined : selectedRole}
    onRoleChange={setSelectedRole}
  />
</TabsContent>
```

**Note:** The Role Access Configurator uses role names like `'super_admin'`, `'manager'`, etc. The SidebarLayoutEditor uses `'global'` for base visibility plus role names. We need to map between them:
- When Role Access has a role selected, pass it to SidebarLayoutEditor
- The SidebarLayoutEditor's "Global" mode becomes unnecessary when controlled externally (since each role inherits from global automatically)

## Simplified Alternative

If the role mapping is complex, a simpler solution is to remove the middle redundant section (Card 2 header "SUPER ADMIN ACCESS") and let the top role selector feed into all three panels equally. The SidebarLayoutEditor would keep its own selector only for the Navigation tab.

However, the cleanest UX is having ONE role selector at the top that controls all panels consistently.

## Recommended Approach

**Option A: Control SidebarLayoutEditor Externally**
- Modify SidebarLayoutEditor to accept `externalSelectedRole` prop
- Hide its internal role selector when prop is provided
- Parent controls the role, child displays the configuration

**Option B: Simplify RoleAccessConfigurator Header**
- Remove the second card's header showing "SUPER ADMIN ACCESS"
- Keep only the top role selector buttons
- Let SidebarLayoutEditor show its own selector for Navigation tab (since it has "Global" mode)
- PageTabs and Widgets panels use the top selector

**Recommendation: Option A** provides the most unified experience, but Option B is simpler to implement.

## File Summary

| File | Action |
|------|--------|
| `src/components/dashboard/settings/SidebarLayoutEditor.tsx` | Modify - Add `externalSelectedRole` prop, conditionally hide role selector |
| `src/components/dashboard/settings/RoleAccessConfigurator.tsx` | Modify - Pass `externalSelectedRole` to SidebarLayoutEditor OR simplify header |
