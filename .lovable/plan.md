
# Pin Settings to Bottom of Super Admin Section

## Problem
In the Super Admin navigation section, the Settings link should always appear at the bottom, but it's currently appearing before Access Hub.

## Current Order in Code (`adminOnlyNavItems`)
```typescript
const adminOnlyNavItems: NavItem[] = [
  { href: '/dashboard/admin/accounts', label: 'Invitations & Approvals', ... },
  { href: '/dashboard/admin/roles', label: 'Manage Users & Roles', ... },
  { href: '/dashboard/admin/access-hub', label: 'Access Hub', ... },
  { href: '/dashboard/admin/settings', label: 'Settings', ... },  // Already last!
];
```

The array order looks correct, but the issue is that the sidebar has a **configurable layout system** (`useSidebarLayout`) that may have a custom `linkOrder` reordering Settings before Access Hub.

## Solution
Move Settings out of the dynamic section rendering and pin it as a fixed footer item at the bottom of the navigation, similar to how "START HERE" is handled at the top.

---

## Technical Changes

### File: `src/components/dashboard/DashboardLayout.tsx`

**Remove Settings from `adminOnlyNavItems`:**

```typescript
// Line 188-193: Remove Settings from this array
const adminOnlyNavItems: NavItem[] = [
  { href: '/dashboard/admin/accounts', label: 'Invitations & Approvals', icon: UserPlus, permission: 'approve_accounts' },
  { href: '/dashboard/admin/roles', label: 'Manage Users & Roles', icon: Shield, permission: 'manage_user_roles' },
  { href: '/dashboard/admin/access-hub', label: 'Access Hub', icon: Shield, permission: 'manage_settings' },
  // Settings removed - will be rendered separately as fixed footer
];
```

**Create a new constant for footer items:**

```typescript
const footerNavItems: NavItem[] = [
  { href: '/dashboard/admin/settings', label: 'Settings', icon: Settings, permission: 'manage_settings' },
];
```

**Pass footer items to SidebarNavContent:**

```typescript
<SidebarNavContent
  // ... existing props
  footerNavItems={footerNavItems}
/>
```

---

### File: `src/components/dashboard/SidebarNavContent.tsx`

**Add `footerNavItems` prop:**

```typescript
interface SidebarNavContentProps {
  // ... existing props
  footerNavItems?: NavItem[];
}
```

**Render footer items at the bottom (after the nav, before closing div):**

After the `<nav>` element (line 553), add a footer section:

```typescript
{/* Fixed Footer Navigation - always at bottom */}
{filterNavItems(footerNavItems || []).length > 0 && (
  <div className="border-t border-border py-2">
    <div className="space-y-1">
      {filterNavItems(footerNavItems || []).map((item) => (
        <NavLink 
          key={item.href} 
          {...item}
        />
      ))}
    </div>
  </div>
)}
```

---

## Visual Result

### Before
```
SUPER ADMIN
├── Invitations & Approvals
├── Manage Users & Roles
├── Settings          ← Out of place
└── Access Hub
```

### After
```
SUPER ADMIN
├── Invitations & Approvals
├── Manage Users & Roles
└── Access Hub

───────────────────────
Settings              ← Always at bottom
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardLayout.tsx` | Remove Settings from `adminOnlyNavItems`, create `footerNavItems`, pass to SidebarNavContent |
| `src/components/dashboard/SidebarNavContent.tsx` | Add `footerNavItems` prop, render at bottom of sidebar |

---

## Benefits
- Settings is **always** pinned to the bottom regardless of sidebar layout customization
- Consistent UX pattern (similar to how many apps pin Settings at bottom)
- Cannot be accidentally reordered by the layout configurator
