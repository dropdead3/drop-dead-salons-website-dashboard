
# Move Service Communication Flows to Separate Settings Card

## Overview

This plan moves the "Service Communication Flows" card from being embedded in the Email and SMS category views into its own standalone settings card titled "Service Flows" within the Communications section.

## Current State

The `ServiceCommunicationFlowsCard` component is currently rendered at the bottom of both:
- `activeCategory === 'email'` view (line 854)
- `activeCategory === 'sms'` view (line 870)

This creates duplication and doesn't give the feature its own prominent place in the settings grid.

## Changes Required

### 1. Update Settings Layout (`src/hooks/useSettingsLayout.ts`)

Add `service-flows` as a new category in the Communications section:

| Property | Value |
|----------|-------|
| Category ID | `service-flows` |
| Section | Communications |
| Icon Color | `#A855F7` (Purple - to complement email/sms) |

```typescript
// Add to DEFAULT_ICON_COLORS
'service-flows': '#A855F7', // Purple

// Update SECTION_GROUPS - communications section
{
  id: 'communications',
  label: 'Communications',
  categories: ['email', 'sms', 'service-flows'],
}
```

### 2. Update Settings Page (`src/pages/dashboard/admin/Settings.tsx`)

**a) Update SettingsCategory type:**
```typescript
type SettingsCategory = '...' | 'service-flows' | null;
```

**b) Add to categoriesMap:**
```typescript
'service-flows': {
  id: 'service-flows',
  label: 'Service Flows',
  description: 'Automated emails & texts per service',
  icon: Sparkles, // Already imported
}
```

**c) Remove ServiceCommunicationFlowsCard from email and sms views:**
- Remove line 854: `<ServiceCommunicationFlowsCard />`
- Remove line 870: `<ServiceCommunicationFlowsCard />`

**d) Add new category content rendering:**
```typescript
{activeCategory === 'service-flows' && (
  <div className="space-y-6">
    <ServiceCommunicationFlowsCard />
  </div>
)}
```

## Visual Result

### Before (Communications Section)
```text
+--------+  +---------------+
| Email  |  | Text Messages |
+--------+  +---------------+
```

### After (Communications Section)
```text
+--------+  +---------------+  +---------------+
| Email  |  | Text Messages |  | Service Flows |
+--------+  +---------------+  +---------------+
```

The Service Flows card will display:
- Count of services with custom flows
- "Configure Service Flows" button linking to `/dashboard/admin/services`

## File Changes Summary

| File | Changes |
|------|---------|
| `src/hooks/useSettingsLayout.ts` | Add `service-flows` to `DEFAULT_ICON_COLORS` and `SECTION_GROUPS` |
| `src/pages/dashboard/admin/Settings.tsx` | Add to type, categoriesMap, remove from email/sms views, add standalone rendering |
