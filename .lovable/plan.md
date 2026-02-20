
## Service Add-On Recommendations: In-Booking Toast System

### Overview

When a stylist (or anyone booking) selects a service from inside a category, a calm bottom-of-card toast slides up recommending relevant add-on services. Admins define which add-ons belong to each category in the Services Settings hub. This increases average ticket and chair utilization by surfacing high-margin adjacent services at exactly the right moment — when the client's appointment is being built.

---

### Why This Matters for Salon Utilization

- The average booked appointment uses 1 service. Add-ons can push that to 1.4–1.8 with zero extra client acquisition cost.
- Suggesting add-ons during the booking moment (not at checkout) allows time to actually schedule them in the same slot.
- Category-scoped recommendations ensure relevance — no generic upsells, only contextually intelligent pairings.
- The system is silent when no add-ons are configured, consistent with Zura's doctrine: silence is meaningful.

---

### 1. Database Changes

**New table: `service_category_addons`**

This table stores the many-to-many pairing of a source category to its recommended add-on services (either by category name or specific service).

```sql
CREATE TABLE public.service_category_addons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  source_category_id UUID REFERENCES public.service_category_colors(id) ON DELETE CASCADE NOT NULL,
  addon_label TEXT NOT NULL,              -- Display name e.g. "Scalp Treatment"
  addon_category_name TEXT,              -- Optional: maps to a full category
  addon_service_name TEXT,               -- Optional: maps to a specific service name
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS: only org members can read; only admins can write
ALTER TABLE public.service_category_addons ENABLE ROW LEVEL SECURITY;
```

**Why flexible `addon_category_name` OR `addon_service_name`?**
Some add-ons are full categories (e.g., "Color Treatments"), others are specific services (e.g., "Olaplex Treatment"). Admins get both options, and the matching logic in the wizard handles both.

---

### 2. Admin UI: Add-On Manager in Services Settings

**File:** `src/components/dashboard/settings/ServicesSettingsContent.tsx`

Add a new collapsible section under each category row: "Add-On Recommendations". When expanded, admins see their configured add-ons for that category and can add/remove them.

**UX inside the category row:**

```
[CO] Color           3 services    [+ Add-On ▼]  [⋯]
  └─ Add-Ons: [Olaplex Treatment ×] [Scalp Treatment ×] [+ Add Add-On]
```

- Clicking "+ Add-On ▼" expands the add-on section inline (accordion pattern, already used in the file).
- "+ Add Add-On" opens a small popover with an input field and optional service/category picker.
- Existing add-ons show as removable chips.

**New component:** `src/components/dashboard/settings/CategoryAddonManager.tsx`
- Receives `categoryId`, `organizationId`, and a list of available service names/categories as props.
- Renders the chip list + add form.
- Uses new hook `useCategoryAddons`.

---

### 3. New Hook: `useCategoryAddons`

**File:** `src/hooks/useCategoryAddons.ts`

```typescript
// Fetches add-ons for a specific category
export function useCategoryAddons(categoryId?: string) { ... }

// Fetches ALL add-ons for an org (used in the wizard to look up by category name)
export function useAllCategoryAddons(organizationId?: string) { ... }

// Create an add-on
export function useCreateCategoryAddon() { ... }

// Delete an add-on
export function useDeleteCategoryAddon() { ... }
```

The `useAllCategoryAddons` hook returns a lookup map: `{ [source_category_id]: addon[] }` so the wizard can perform an O(1) lookup when a category is selected.

---

### 4. In-Wizard Add-On Toast

**File:** `src/components/dashboard/schedule/QuickBookingPopover.tsx`

**Trigger logic:** When `selectedCategory` is set (i.e., user taps a category to drill into services), check if that category has configured add-ons. If yes, after a 800ms delay (UX: let the service list settle first), show the add-on toast at the bottom of the service panel.

**New component:** `src/components/dashboard/schedule/ServiceAddonToast.tsx`

```
┌──────────────────────────────────────────────────────┐
│  ✦  Frequently added with [Color]                    │
│                                                      │
│  [Olaplex Treatment  +45min · $35]  [+ Add]          │
│  [Scalp Treatment    +30min · $28]  [+ Add]          │
│                                                      │
│                                         [Dismiss ×]  │
└──────────────────────────────────────────────────────┘
```

Slides in from the bottom inside the popover card (not a global toast — it lives inside the popover's footer area, above the Continue button). This keeps it contextual and non-intrusive.

**State management:**
- `showAddonToast: boolean` — controls visibility
- `addonToastCategory: string | null` — which category triggered the toast
- `dismissedAddonCategories: Set<string>` — prevents showing the same toast again after dismiss in this booking session

**Add-on matching logic:**
```typescript
// When user enters a category:
const addonsForCategory = allAddons[categoryColorId];

// For each addon, try to match to a real service in servicesByCategory:
const matchedServices = addonsForCategory
  .flatMap(addon => {
    if (addon.addon_service_name) {
      return allServices.filter(s => s.name === addon.addon_service_name);
    }
    if (addon.addon_category_name) {
      return (servicesByCategory[addon.addon_category_name] || []).slice(0, 2);
    }
    return [];
  })
  .filter(s => !selectedServices.includes(s.phorest_service_id)) // hide already selected
  .slice(0, 3); // max 3 suggestions
```

Clicking "+ Add" on a suggestion calls `handleServiceToggle(service.phorest_service_id)` and adds it instantly. The toast auto-dismisses after all add-ons are added.

---

### 5. Toast Behavior & UX Rules

| Scenario | Behavior |
|---|---|
| Category has no add-ons configured | Toast does not appear (silent) |
| All suggested add-ons already selected | Toast does not appear |
| User dismisses the toast | Stays hidden for that category for the rest of this booking session |
| User navigates back to categories and re-enters the same category | Toast does not re-appear (dismissed set) |
| Add-on is added via toast | That add-on chip disappears from the toast; if all are added, toast fades out |

---

### 6. Files Changed / Created

| File | Action |
|---|---|
| `supabase/migrations/...` | New `service_category_addons` table + RLS |
| `src/hooks/useCategoryAddons.ts` | **New** — CRUD hooks for add-ons |
| `src/components/dashboard/settings/CategoryAddonManager.tsx` | **New** — Inline add-on editor inside category row |
| `src/components/dashboard/settings/ServicesSettingsContent.tsx` | Add add-on section per category |
| `src/components/dashboard/schedule/ServiceAddonToast.tsx` | **New** — In-wizard add-on recommendation card |
| `src/components/dashboard/schedule/QuickBookingPopover.tsx` | Wire add-on toast: trigger on category select, dismiss logic, add-on toggle |

---

### Enhancements & Gaps Identified

**Gap 1: No revenue attribution today.** When a service is added via the add-on toast, there is currently no way to know it came from a recommendation. We can tag such services with a flag on the booking state to pass as `notes` or a future `booking_metadata` field — enabling "Add-On Revenue" as a future analytics dimension.

**Gap 2: Phorest services vs. native services.** The wizard uses `phorest_services` (synced from POS), not the native `services` table. Add-on matching uses service names as the bridge since Phorest service IDs are POS-specific. Name-based matching is resilient for this use case.

**Gap 3: Admin discoverability.** Admins need to know this feature exists. A one-time tooltip on the Services Settings page the first time an organization has configured no add-ons will call attention to the section.

**Enhancement 1: Add-On Revenue Tracking.** A future `recommended_addons_added` count metric per booking session, feeding into the weekly Zura brief as "Add-on conversion rate."

**Enhancement 2: Popularity-ranked add-ons.** Over time, track which add-ons are most frequently accepted and surface the highest-accepted ones first (Phase 2 intelligence layer).
