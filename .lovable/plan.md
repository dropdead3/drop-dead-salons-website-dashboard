
## Rearchitecting the Add-Ons System: A Proper Configurator

### What the User Wants (vs. What Was Built)

The current system is built backwards. It uses a text-label approach where each category row gets a "recommendation" that is just a string label optionally matched by name to a Phorest service. There is no pricing, no cost, no margin tracking, and no assignment to specific services.

What's needed is a **proper two-layer architecture**:

1. **Add-Ons Library** — Define add-ons as standalone entities with a name, price, and cost (for margin tracking). These exist at the organization level and are reusable.
2. **Add-On Assignments** — Attach library add-ons to:
   - A **full category** (every service in that category can trigger the recommendation)
   - **Specific services** (more surgical — only when booking "Full Balayage" does "Olaplex Treatment" appear)

---

### Data Architecture

Two new tables replace the current `service_category_addons` approach:

**Table 1: `service_addons` (the library)**

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `organization_id` | UUID | FK → organizations |
| `name` | TEXT | "Olaplex Treatment", "Scalp Treatment" |
| `description` | TEXT nullable | Optional detail |
| `price` | NUMERIC | What the client pays |
| `cost` | NUMERIC nullable | Product/supply cost for margin tracking |
| `duration_minutes` | INTEGER nullable | Time to add to appointment |
| `is_active` | BOOLEAN | Soft delete |
| `display_order` | INTEGER | For sorting |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Table 2: `service_addon_assignments` (the attachments)**

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `organization_id` | UUID | FK → organizations |
| `addon_id` | UUID | FK → service_addons |
| `target_type` | TEXT | `'category'` or `'service'` |
| `target_category_id` | UUID nullable | FK → service_category_colors |
| `target_service_id` | UUID nullable | FK → services |
| `display_order` | INTEGER | Within each target |
| `created_at` | TIMESTAMPTZ | |

RLS on both tables follows `is_org_member` for SELECT, `is_org_admin` for INSERT/UPDATE/DELETE.

The existing `service_category_addons` table stays untouched (it's in the DB, removing it could break things). We build the new system alongside it. The booking wizard will be updated to query the new tables.

---

### What Gets Built

**Part 1: Add-Ons Library Page (new card in Services Settings)**

A top-level "SERVICE ADD-ONS" card in `ServicesSettingsContent.tsx`:

- Full-width table of defined add-ons: Name | Price | Cost | Margin | Duration | Actions
- "+ Add Add-On" opens an inline form (or dialog) with:
  - Name (required)
  - Price (required, numeric input)
  - Cost (optional, numeric input — for margin tracking)
  - Duration (optional, minutes)
  - Description (optional)
- Each row has Edit (inline) and Delete (with confirmation) actions
- Margin is computed live as `((price - cost) / price) * 100` shown as a muted percentage badge

**Part 2: Category & Service Assignments**

The "BOOKING ADD-ON RECOMMENDATIONS" card becomes a proper assignment UI:

- Each category row expands to show:
  - **Assigned add-ons** (from the library) — shown as chips with price badges
  - A "+ Assign Add-On" button opens a dropdown/combobox of available library add-ons
  - Below the category-level assignments, each service within that category has its own sub-row with its own specific add-on assignments

**Part 3: Booking Wizard Update**

The `QuickBookingPopover.tsx` `addonSuggestions` memo is updated to query the new tables:
- When category is selected: look up `service_addon_assignments` with `target_type = 'category'` AND `target_category_id = catEntry.id`
- When specific services are selected: also surface `service_addon_assignments` with `target_type = 'service'` AND `target_service_id IN selectedServiceIds`
- The `ServiceAddonToast` suggestions are now native `service_addons` objects (with real price/cost/duration) instead of Phorest service lookup

---

### New Files

| File | Purpose |
|---|---|
| `supabase/migrations/...` | Create `service_addons` + `service_addon_assignments` tables with RLS |
| `src/hooks/useServiceAddons.ts` | CRUD hooks for the library: `useServiceAddons`, `useCreateServiceAddon`, `useUpdateServiceAddon`, `useDeleteServiceAddon` |
| `src/hooks/useServiceAddonAssignments.ts` | Hooks for assignments: `useAddonAssignments`, `useCreateAddonAssignment`, `useDeleteAddonAssignment`, `useAllAddonAssignmentsByOrg` |
| `src/components/dashboard/settings/ServiceAddonsLibrary.tsx` | The library CRUD card |
| `src/components/dashboard/settings/ServiceAddonAssignmentsCard.tsx` | The category + service assignment card |

### Modified Files

| File | Change |
|---|---|
| `src/components/dashboard/settings/ServicesSettingsContent.tsx` | Remove old `CategoryAddonManager` import; add `ServiceAddonsLibrary` and `ServiceAddonAssignmentsCard` cards; remove old `useAllCategoryAddons` and `phorestServiceNames` logic |
| `src/components/dashboard/settings/CategoryAddonManager.tsx` | Deprecate/remove (replaced by `ServiceAddonAssignmentsCard`) |
| `src/components/dashboard/schedule/QuickBookingPopover.tsx` | Swap `addonSuggestions` memo to use `useAllAddonAssignmentsByOrg` and the new `service_addons` data; update `ServiceAddonToast` props to pass native addon objects |
| `src/components/dashboard/schedule/ServiceAddonToast.tsx` | Accept native `ServiceAddon` type instead of `PhorestService`; remove dependency on `phorest_service_id` |

---

### UI Design of the Library Card

```text
SERVICE ADD-ONS                                    [+ Add Add-On]
─────────────────────────────────────────────────────────────────
 Olaplex Treatment       $35.00    Cost $12    66% margin    30m  [Edit] [✕]
 K18 Treatment           $28.00    Cost $8     71% margin    15m  [Edit] [✕]
 Scalp Treatment         $45.00    Cost $15    67% margin    20m  [Edit] [✕]
 Gloss Add-On            $25.00    —           —             20m  [Edit] [✕]
```

When cost is entered, margin is computed and shown as a green/amber/red badge based on margin threshold (e.g., ≥50% = green, 30–49% = amber, <30% = red).

---

### UI Design of the Assignment Card

```text
BOOKING ADD-ON RECOMMENDATIONS

  [CO] Color                   2 add-ons            [+ Assign] [∨]
  ┌────────────────────────────────────────────────────────────────
  │ Category-level (triggers for any Color service):
  │  [Olaplex Treatment $35] [×]   [K18 Treatment $28] [×]
  │
  │ Service-level assignments:
  │  Full Balayage          [Scalp Treatment $45] [×]   [+ Add]
  │  Partial Balayage       No specific add-ons          [+ Add]
  │  Color Melt             [Gloss Add-On $25] [×]       [+ Add]
  └────────────────────────────────────────────────────────────────
```

---

### Booking Wizard Behavior

Category-level: When stylist picks "Color" category → show category-level add-ons in the toast (Olaplex + K18).
Service-level: When stylist picks "Full Balayage" specifically → additionally surface "Scalp Treatment" (service-specific).
Deduplication: If an add-on appears in both category and service assignments, show it once.
Already-added filter: Filter out any add-on whose name matches a service already in the booking.

---

### Migration Strategy for Existing `service_category_addons` Data

The existing table has zero rows (confirmed by the database query above: `[]`). No data migration is needed. The old table will simply become unused once we point the booking wizard at the new tables.

---

### Build Order

1. Database migration (2 tables + RLS)
2. `useServiceAddons.ts` hook
3. `useServiceAddonAssignments.ts` hook
4. `ServiceAddonsLibrary.tsx` component
5. `ServiceAddonAssignmentsCard.tsx` component
6. Wire both into `ServicesSettingsContent.tsx` (replace old card)
7. Update `ServiceAddonToast.tsx` to accept the new type
8. Update `QuickBookingPopover.tsx` to use new data sources

No new routes or navigation entries are needed. Everything lives within the existing Services Settings page.
