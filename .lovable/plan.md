
# Fix: Quick Access Hubs Show All When All Toggled Off

## The Bug

When all Quick Access Hubs are toggled off in the customizer, they all still appear on the dashboard instead of hiding.

## Root Cause

In `HubQuickLinks.tsx` line 109, the filtering logic has a flaw:

```typescript
if (enabledHubs && enabledHubs.length > 0) {
  filtered = filtered.filter(hub => enabledHubs.includes(hub.href));
}
```

When all hubs are disabled, `enabledHubs` becomes an empty array `[]`. The condition `enabledHubs.length > 0` evaluates to `false`, so the filter is skipped entirely and all hubs are shown.

## The Fix

Change the condition to check if `enabledHubs` has been explicitly set (is an array), rather than checking if it has items:

```typescript
// Before (buggy)
if (enabledHubs && enabledHubs.length > 0) {
  filtered = filtered.filter(hub => enabledHubs.includes(hub.href));
}

// After (fixed)
if (enabledHubs !== undefined) {
  filtered = filtered.filter(hub => enabledHubs.includes(hub.href));
}
```

This correctly handles all three cases:
| `enabledHubs` value | Behavior |
|---------------------|----------|
| `undefined` | Show all hubs (user hasn't customized yet) |
| `[]` (empty array) | Show NO hubs (user disabled all) |
| `['...', '...']` | Show only specified hubs |

## File to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/HubQuickLinks.tsx` | Update filtering condition on line 109 |
