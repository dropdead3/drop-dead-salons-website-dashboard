

## Per-Stylist Timing & Pricing Overrides

### Recommendation: Consolidate into `staff_service_qualifications`

You currently have **two separate tables** that both try to store per-stylist pricing:

| Table | Has Price | Has Duration | Used By |
|-------|-----------|-------------|---------|
| `staff_service_qualifications` | `custom_price` (column exists, **unused in UI**) | No duration column | Staff Service Configurator card |
| `service_stylist_price_overrides` | `price` (actively used) | No duration column | Service Editor pricing tab |

**The right move**: Add `custom_duration_minutes` to `staff_service_qualifications`, wire the existing `custom_price` column into the UI, and deprecate `service_stylist_price_overrides` over time. This way, qualification + pricing + timing all live in one row per stylist-service pair -- which is how the data actually works operationally.

### What Gets Built

**1. Database: Add `custom_duration_minutes` column**
- Add `custom_duration_minutes INTEGER NULL` to `staff_service_qualifications`
- This mirrors what the Phorest sync table (`phorest_staff_services`) already has

**2. Staff Service Configurator Card: Inline Override Editing**

When a stylist is selected and a service is expanded, each service row gets:
- The existing enable/disable checkbox (unchanged)
- A small **price override** input (pre-filled with salon base price in muted text, editable to set a custom price)
- A small **duration override** input (pre-filled with salon base duration in muted text, editable to set a custom duration)
- A "reset" button to clear overrides back to salon defaults
- Visual indicator (badge or dot) when a service has active overrides

The layout stays compact: checkbox + service name on the left, price + duration inputs on the right (inline).

**3. Pricing Resolution Engine Update**

The existing 5-tier pricing engine gets a small adjustment:
- Tier 1 (highest priority) stays: Individual Stylist Override -- but now reads from `staff_service_qualifications.custom_price` instead of `service_stylist_price_overrides.price`
- Booking components also read `custom_duration_minutes` when calculating appointment end times

**4. Hooks Update**

- `useStaffQualifications` already selects `custom_price` -- add `custom_duration_minutes`
- Add a new `useUpdateStylistServiceOverride` mutation to update price/duration on the qualification row
- Update `useBookingLevelPricing` or create a companion `useBookingStylistOverrides` to resolve per-stylist timing in booking flows

### What the UI Looks Like

In the Staff Service Configurator, after selecting a stylist:

```text
[x] Balayage                          $180  |  120min
    (salon: $150)                     (salon: 90min)
                                      [Reset to defaults]

[x] Root Touch-Up                     --     |  --
    No overrides (uses salon defaults)

[ ] Bridal Updo                       (disabled - not assigned)
```

- Price and duration inputs only appear for enabled services
- Muted "(salon: $X)" text shows what the default is for context
- "--" means no override set (uses salon default)
- Override values are highlighted with a subtle accent indicator

### Gap Analysis

| Area | Status | Note |
|------|--------|------|
| `custom_price` column | Exists, unused | Wire into UI |
| `custom_duration_minutes` column | Missing | Add via migration |
| `service_stylist_price_overrides` table | Redundant | Keep for now as backward compat; stop writing to it from new UI |
| Booking flow duration resolution | Not stylist-aware | Add lookup for stylist-specific duration |
| Service Editor pricing tab | Uses old override table | Future: point to unified table |

### Technical Plan

**Migration**: Add `custom_duration_minutes` column to `staff_service_qualifications`

**File: `src/hooks/useStaffServiceConfigurator.ts`**
- Add `custom_duration_minutes` to `StaffQualification` interface and query select
- Add `useUpdateStylistServiceOverride` mutation for updating `custom_price` and `custom_duration_minutes`
- Add `useResetStylistServiceOverride` mutation to null out both fields

**File: `src/components/dashboard/settings/StaffServiceConfiguratorCard.tsx`**
- Add inline price and duration inputs per service row (only for enabled/checked services)
- Show salon default values as reference text
- Add override indicator badges on service rows and category headers
- Add reset-to-defaults button per service

**File: `src/hooks/useServiceLevelPricing.ts`**
- No changes needed yet (level pricing is a different tier)

### Files Changed

| File | Change |
|------|--------|
| Migration | Add `custom_duration_minutes` to `staff_service_qualifications` |
| `src/hooks/useStaffServiceConfigurator.ts` | Add override mutations, update types and query |
| `src/components/dashboard/settings/StaffServiceConfiguratorCard.tsx` | Inline price/duration inputs, override indicators, reset button |

