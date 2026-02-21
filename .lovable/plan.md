

## Combined Stylist Roster and Commission Configurator

### Problem

The Level Assignments card and Commission Overrides card are separate, disconnected sections. A user managing stylist compensation has to scroll between them, and there's no unified view showing a stylist's full commission picture (their level, the default rate from that level, and any active override). The override dialog uses a raw HTML `<select>` instead of the design system components, and neither card has drill-down detail views.

### Solution

Combine both cards into a single **"TEAM COMMISSION ROSTER"** card that shows every stylist in one unified list. Each row displays the stylist's name, assigned level, effective commission rates, and the rate source (level default or override). Clicking a stylist row opens a drill-down dialog with full detail and editing capabilities.

---

### What Gets Built

**1. Combined "TEAM COMMISSION ROSTER" Card**

Replaces both the Level Assignments card and Commission Overrides card with one unified card.

Each stylist row shows:
- Name
- Current level badge (color-coded, or "Unassigned" in amber)
- Effective service/retail commission rates
- Source indicator: small pill showing "Level Default" or "Override" (with override reason on hover)
- Override expiry date if applicable

Header controls:
- Location filter dropdown (existing)
- "Add Override" button (existing, moved to header)
- Bulk level assignment (existing, shown when checkboxes are selected)

**2. Stylist Commission Drill-Down Dialog**

Clicking any stylist row opens a drill-down dialog (using existing `DRILLDOWN_DIALOG_CONTENT_CLASS` for consistent animation) with:

- **Header**: Stylist name + current level badge
- **Section 1 - Level Assignment**: Level picker to change their level, showing what the level's default rates are
- **Section 2 - Commission Override**: Inline form to add/edit/remove an override (service %, retail %, reason, expiry) -- no separate dialog needed
- **Section 3 - Effective Rates Summary**: Shows the final resolved rates with source explanation ("Using override rates because: Negotiated contract" or "Using Level 3 default rates")
- **Footer action**: "Review Services & Pricing" link to `/dashboard/admin/settings?category=services`

**3. UI Improvements**

- Replace raw `<select>` in CommissionOverrideDialog with design system `Select` component
- Use the drilldown dialog pattern (blur overlay, slide animation) consistently
- Add hover tooltips on override reason text
- Show "Expires in X days" instead of raw date for upcoming expirations
- Empty state for unassigned stylists gets a CTA button

---

### Technical Plan

**Modified: `src/components/dashboard/settings/StylistLevelsContent.tsx`**
- Remove the separate Commission Overrides card (lines 508-585)
- Remove the separate `StylistLevelAssignments` render (lines 503-506)
- Replace both with the new `TeamCommissionRoster` component
- Keep the CommissionOverrideDialog import removed (functionality moves inline into drill-down)

**New: `src/components/dashboard/settings/TeamCommissionRoster.tsx`**
- Combines all logic from `StylistLevelAssignments` and the overrides card
- Fetches team directory, stylist levels, and commission overrides
- Renders unified stylist list with level badges, rates, and source indicators
- Each row is clickable to open the drill-down
- Bulk level assignment bar at bottom when checkboxes are active
- Location filter in header

**New: `src/components/dashboard/settings/StylistCommissionDrilldown.tsx`**
- Drill-down dialog using `DRILLDOWN_DIALOG_CONTENT_CLASS`
- Three sections: Level Assignment, Override Editor, Effective Rates
- Level picker uses `Select` component with level color badges
- Override section has inline form (no separate dialog needed)
- Shows resolved commission source with explanation
- Footer with "Review Services & Pricing" navigation link
- Uses existing mutations: `useAssignStylistLevel`, `useUpsertCommissionOverride`, `useDeleteCommissionOverride`

**Deleted (functionality absorbed): `src/components/dashboard/settings/StylistLevelAssignments.tsx`**
- All logic moves into `TeamCommissionRoster`

**Deleted (functionality absorbed): `src/components/dashboard/settings/CommissionOverrideDialog.tsx`**
- Override editing moves inline into `StylistCommissionDrilldown`

---

### Layout

```text
TEAM COMMISSION ROSTER
Manage level assignments and commission rates for your team.

[Location: All v]                              [+ Add Override]

[ ] Kristi D.    [Level 3 - Core Artist]   Svc: 45%  Retail: 12%  [Level Default]
[ ] Jordan T.    [Level 2 - Rising Star]   Svc: 50%  Retail: 15%  [Override] Expires in 12d
[ ] New Stylist  [Unassigned]              Svc: --   Retail: --   [No rates]

{2 selected}  [Set Level for Selected v]  [Clear]
```

Clicking "Kristi D." opens:

```text
+------------------------------------------+
| Kristi D.                    [Level 3]   |
|------------------------------------------|
| LEVEL                                    |
| [Level 3 - Core Artist  v]              |
| Default rates: Svc 40% / Retail 10%     |
|                                          |
| COMMISSION OVERRIDE                      |
| Service %  [45]    Retail %  [12]        |
| Reason     [Negotiated contract     ]    |
| Expires    [2026-05-01]                  |
| [Remove Override]           [Save]       |
|                                          |
| EFFECTIVE RATES                          |
| Service: 45%  Retail: 12%               |
| Source: Override (Negotiated contract)   |
|                                          |
| [Review Services & Pricing ->]           |
+------------------------------------------+
```

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/settings/TeamCommissionRoster.tsx` | New combined card component |
| `src/components/dashboard/settings/StylistCommissionDrilldown.tsx` | New drill-down dialog for per-stylist editing |
| `src/components/dashboard/settings/StylistLevelsContent.tsx` | Replace two separate cards with single `TeamCommissionRoster` |
| `src/components/dashboard/settings/StylistLevelAssignments.tsx` | Removed (absorbed into roster) |
| `src/components/dashboard/settings/CommissionOverrideDialog.tsx` | Removed (absorbed into drill-down) |

---

### Further Improvement Suggestions

| Enhancement | Description |
|-------------|-------------|
| **Commission History Timeline** | Add a tab in the drill-down showing the audit trail from `commission_rate_history` -- when rates changed, who changed them, previous values |
| **"Unassign" option** | Currently no way to remove a stylist from a level (set back to unassigned). Add a "Remove Level" option in the level picker |
| **Level change impact preview** | Before confirming a level change, show what the rate difference will be ("Service rate will change from 40% to 45%") |
| **Override templates** | Pre-built override reasons like "90-day probation", "Negotiated contract", "Performance bonus" with suggested rates |
| **Bulk override removal** | Select multiple stylists and remove all their overrides at once |
| **Services qualification check** | When assigning a level, automatically check if the stylist has the right services enabled for that level and show warnings if not |

