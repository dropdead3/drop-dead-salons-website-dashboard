

# Remove Platform Tab from Access Hub

## Overview

Remove the "Platform" tab from the organization Access Hub since feature flag management is a platform-level concern, not an organization-level one. The proper location for per-organization feature flag overrides is in the Platform Admin's Account Detail page, which already has a fully-featured `AccountFeatureFlagsTab` component.

---

## Why Remove It?

| Issue | Impact |
|-------|--------|
| Confusing for org admins | They see a tab they can't use (read-only for non-platform users) |
| Redundant functionality | `AccountFeatureFlagsTab` in Platform Admin already handles per-org overrides |
| Wrong location | Feature flags are platform-controlled, not org-controlled |
| Empty state common | Most orgs have no flags, showing an empty/confusing interface |

---

## What Already Exists

The Platform Admin Hub has:
1. **Global Feature Flags** at `/dashboard/platform/feature-flags` - manages all platform-wide flags
2. **Per-Org Overrides** in Account Detail (`AccountFeatureFlagsTab`) - manages overrides for specific organizations

Both are accessible only to platform users, which is the correct access model.

---

## Changes Required

### 1. Update AccessHub.tsx

- Remove `'platform'` from `TabValue` type
- Remove `Flag` icon import
- Remove `PlatformTab` import
- Update valid tab check in `useEffect`
- Remove the Platform `TabsTrigger` 
- Remove the Platform `TabsContent`
- Change grid from `grid-cols-6` to `grid-cols-5`

### 2. Update access-hub/index.ts

- Remove `PlatformTab` export

### 3. Delete PlatformTab.tsx

- Remove `src/components/access-hub/PlatformTab.tsx`

---

## Result

### Before (6 tabs)
```
[Modules] [User Roles] [Role Access] [Permissions] [Role Config] [Platform]
```

### After (5 tabs)
```
[Modules] [User Roles] [Role Access] [Permissions] [Role Config]
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/pages/dashboard/admin/AccessHub.tsx` | Remove Platform tab, update grid |
| `src/components/access-hub/index.ts` | Remove PlatformTab export |
| `src/components/access-hub/PlatformTab.tsx` | Delete |

---

## Where Feature Flags Are Managed (No Change)

| Location | Purpose | Access |
|----------|---------|--------|
| `/dashboard/platform/feature-flags` | Manage global feature flags | Platform users only |
| Account Detail > Feature Flags tab | Per-organization overrides | Platform users only |

This keeps feature flag management centralized in the Platform Admin area where it belongs.

