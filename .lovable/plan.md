

## Deep Dive: Gaps, Redundancies, and Enhancements

### Findings Summary

After analyzing the Staff Service Configurator, Booking Visibility Card, and their shared hooks, here are the issues organized by priority.

---

### 1. REDUNDANCIES (Code Duplication)

| Issue | Location | Fix |
|-------|----------|-----|
| **Duplicate service+category fetching** | `BookingVisibilityCard` has its own `useServicesWithCategories` local hook that duplicates what `useServicesData` + `useServiceCategoryColors` already provide | Remove the local hook; reuse the existing shared hooks that `ServicesSettingsContent` already uses |
| **Duplicate `is_booking` toggle logic** | `BookingVisibilityCard.useToggleIsBooking` is a local mutation. The same pattern exists in `EditStylistCardDialog` as inline Supabase calls | Extract to a shared `useToggleIsBooking` mutation in `useStaffServiceConfigurator.ts` so both UIs use one source |
| **Category bulk toggle bypasses mutation pattern** | `BookingVisibilityCard.handleToggleCategory` calls `supabase.from('services').update()` directly with `Promise.all` instead of using `useToggleBookableOnline` | Refactor to use a proper bulk mutation with correct cache invalidation and error handling |
| **`any` type casts on stylists** | `BookingVisibilityCard` uses `(s: any)` for stylist data throughout | Use the return type from `useActiveStylists` properly |

### 2. GAPS (Missing Functionality)

| Gap | Impact | Fix |
|-----|--------|-----|
| **No undo toast on category bulk toggle** | Inconsistent UX -- individual service toggles have undo, but category bulk toggles do not | Add undo toast to `handleToggleCategory` in `BookingVisibilityCard` |
| **`useToggleBookableOnline` doesn't invalidate `booking-visibility-services`** | After toggling in the website editor, the Booking Visibility Card shows stale data until manual refresh | Add `booking-visibility-services` to invalidation list (or better, unify the query key) |
| **No error handling on category bulk toggle** | `Promise.all` in `handleToggleCategory` has no `.catch()` -- failures are silently swallowed | Add error toast on catch |
| **Stale `selectedUserId` after filter change** | `StaffServiceConfiguratorCard` detects when selected user leaves the filtered list (line 66) but the reset logic is commented out / no-op | Actually reset `selectedUserId` to `''` when the selected user is no longer visible |
| **No optimistic updates** | All toggles wait for server round-trip before UI updates | Add optimistic cache updates to both toggle mutations for snappier feel |

### 3. ENHANCEMENTS (Quality + Polish)

| Enhancement | Description |
|-------------|-------------|
| **Unified query keys** | Standardize service query keys across `booking-visibility-services`, `services-website`, and `servicesData` to prevent stale data between pages |
| **Loading skeleton** | Replace "Loading stylists..." and "Loading services..." text with skeleton rows for a polished feel |
| **Disable toggles during mutation** | `BookingVisibilityCard` toggles are not disabled during pending mutations (unlike `StaffServiceConfiguratorCard` which correctly disables them) |
| **Count badge on Stylists tab trigger** | Show the "X of Y visible" count directly on the tab trigger, not just inside the panel |
| **Consistent card header styling** | `BookingVisibilityCard` uses raw `CardTitle` while `StaffServiceConfiguratorCard` uses `tokens.heading.section` + icon -- standardize both |

---

### Technical Plan

**File: `src/hooks/useStaffServiceConfigurator.ts`**
- Export a new `useToggleIsBooking()` mutation (extracted from `BookingVisibilityCard`)
- Add proper cache invalidation for `booking-visibility-services` and `homepage-stylists`

**File: `src/components/dashboard/settings/BookingVisibilityCard.tsx`**
- Remove local `useToggleIsBooking` hook -- import from shared hook
- Remove local `useServicesWithCategories` hook -- import `useServicesData` + `useServiceCategoryColors`
- Fix category bulk toggle: use proper mutation with undo toast and error handling
- Remove `any` type casts on stylists
- Add `disabled={isPending}` to all Switch/Checkbox elements
- Add loading skeleton placeholders
- Standardize header styling with icon + design tokens
- Add count badge on tab triggers

**File: `src/components/dashboard/settings/StaffServiceConfiguratorCard.tsx`**
- Fix the dead code at line 66-68 (stale user reset) -- actually reset `selectedUserId`

**File: `src/hooks/useNativeServicesForWebsite.ts`**
- Add `booking-visibility-services` to `useToggleBookableOnline` invalidation list to keep both UIs in sync

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useStaffServiceConfigurator.ts` | Extract shared `useToggleIsBooking` mutation |
| `src/components/dashboard/settings/BookingVisibilityCard.tsx` | Remove duplicates, fix bulk toggle, add undo/error handling, type safety, loading skeletons, disable during mutation, header polish |
| `src/components/dashboard/settings/StaffServiceConfiguratorCard.tsx` | Fix stale user reset logic |
| `src/hooks/useNativeServicesForWebsite.ts` | Cross-invalidate `booking-visibility-services` query key |

