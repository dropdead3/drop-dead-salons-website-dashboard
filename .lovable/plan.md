

# Add "Bookable Online" Toggle to Services

## Overview

A new `bookable_online` boolean column will be added to the `services` table, giving salon owners explicit control over which services appear on the public website and are available for online booking. This is separate from `is_active` (which controls whether a service exists operationally) -- a service can be active for walk-ins and internal scheduling but hidden from the website.

## Current Gaps Identified

1. **No column exists** -- The `services` table has no `bookable_online` or equivalent field. Currently, all `is_active` services appear on the public website indiscriminately.
2. **Public queries are unfiltered** -- `usePublicServicesForWebsite` and `useNativeServicesForWebsite` both use `.eq('is_active', true)` as the only filter. There is no way to hide an active service from the public site.
3. **Booking system is unfiltered** -- `useBookingSystem` and `useServicesData` also only filter by `is_active`, meaning all active services are bookable online.
4. **Follows existing pattern** -- The `locations` table already has `show_on_website` for the same purpose. Products have `available_online`. This brings services into alignment.

## What Changes

### 1. Database Migration
Add `bookable_online BOOLEAN NOT NULL DEFAULT true` to the `services` table. Default `true` so existing services remain visible (non-breaking).

### 2. Services Settings -- ServiceEditorDialog
Add a "Bookable Online" toggle to the Details tab (alongside existing toggles like "Requires Qualification" and "Same-Day Booking"). Wired through the existing `useUpdateService` mutation.

### 3. Website Editor -- ServicesContent
- Add a per-service toggle for "Bookable Online" directly in the service row (similar to how locations have a `show_on_website` switch).
- Add a stat card showing "X Online" count alongside the existing Total/Categories/Levels/Popular stats.
- Dim services that are not bookable online (matching the pattern used for locations).

### 4. Public Website Queries
- **`usePublicServicesForWebsite`** -- Add `.eq('bookable_online', true)` filter so hidden services never appear on the public services page.
- **`useNativeServicesForWebsite`** -- Fetch the `bookable_online` field (but do NOT filter by it, since the admin needs to see all services to toggle them).

### 5. Booking System
- **`useServicesData`** -- Add optional `bookableOnlineOnly` parameter. When fetching for online booking flows, filter by `bookable_online = true`.
- **`useBookingSystem`** -- Apply the same filter when loading services for the online booking wizard.

## Technical Details

### Files Modified

| File | Change |
|---|---|
| **Migration SQL** | `ALTER TABLE public.services ADD COLUMN bookable_online BOOLEAN NOT NULL DEFAULT true;` |
| `src/components/dashboard/settings/ServiceEditorDialog.tsx` | Add `bookableOnline` state + toggle in Details tab + include in submit payload |
| `src/components/dashboard/website-editor/ServicesContent.tsx` | Add per-service online toggle, "Online" stat card, dimmed styling for offline services |
| `src/hooks/useNativeServicesForWebsite.ts` | Include `bookable_online` in the SELECT and expose it on `NativeServiceItem` type |
| `src/hooks/usePublicServicesForWebsite.ts` | Add `.eq('bookable_online', true)` filter |
| `src/hooks/useServicesData.ts` | Include `bookable_online` in the Service type; add optional filter for online-only queries |
| `src/hooks/useBookingSystem.ts` | Add `.eq('bookable_online', true)` when loading services for online booking |

### New Mutation
Add `useToggleBookableOnline` to `useNativeServicesForWebsite.ts` following the same pattern as `useToggleServicePopular`:

```typescript
export function useToggleBookableOnline() {
  const queryClient = useQueryClient();
  const { effectiveOrganization } = useOrganizationContext();

  return useMutation({
    mutationFn: async ({ serviceId, bookableOnline }: { serviceId: string; bookableOnline: boolean }) => {
      const { error } = await supabase
        .from('services')
        .update({ bookable_online: bookableOnline })
        .eq('id', serviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-website', effectiveOrganization?.id] });
    },
  });
}
```

### UX in Website Editor
Each service row will show a Globe icon toggle. When off, the row dims and shows "Hidden from website" badge. This matches the locations pattern exactly.

### Edge Cases Handled
- **Default true** -- All existing services remain visible after migration (non-breaking)
- **Operational vs. public** -- A service can be `is_active=true` (used internally) but `bookable_online=false` (hidden from website). This is the key distinction.
- **Stats update** -- The "Online" stat card will show real-time count of services with `bookable_online=true`

