
## Infotainer System: Feature Page Help Banners with Org-Level Toggle

### What This Builds

1. **Infotainer Component** -- A reusable, dismissible info banner that appears at the top of feature pages. It explains what the feature does, why it matters, and how to use it. Each infotainer can be individually closed by the user (persisted to localStorage).

2. **Organization-Level Toggle** -- A setting in the account/settings area that lets admins turn all infotainers on or off globally for their organization. When toggled off, no infotainers render anywhere. When toggled back on, previously dismissed infotainers reappear (localStorage dismissals are cleared).

3. **Executive Brief Infotainer** (first example) -- An infotainer on the Executive Brief page explaining the feature's purpose and how the lever recommendation system works.

---

### Executive Brief Feature Description

The Executive Brief is Zura's primary strategic rhythm -- a weekly intelligence surface that tells operators exactly which lever to pull next.

**How it works:**
- Zura continuously monitors KPIs (revenue, utilization, margin, retention, etc.)
- When it detects a high-confidence opportunity or deviation, it surfaces a **primary lever** with: what to do, why now (3 evidence drivers), and estimated monthly impact
- Owners can **Approve, Modify, Decline, or Snooze** the recommendation, creating a decision audit trail
- When no high-confidence lever exists, Zura shows **Designed Silence** -- a calm confirmation that operations are within thresholds
- An expandable "Show reasoning and evidence" section reveals the full logic behind each recommendation

---

### Technical Plan

**New Component: `src/components/ui/Infotainer.tsx`**
- Accepts: `id` (unique key), `title`, `description` (string or ReactNode), optional `icon`
- Checks org-level `show_infotainers` setting (from `organization.settings`)
- Checks localStorage for per-infotainer dismissal (`infotainer-dismissed-{id}`)
- Renders a styled card with an X button to dismiss
- Uses the project's premium design language (rounded-2xl, subtle border, muted foreground)

**New Hook: `src/hooks/useInfotainers.ts`**
- `useInfotainerVisible(id)` -- returns whether a specific infotainer should show (checks org setting + localStorage)
- `useInfotainerSettings()` -- returns the org-level toggle state and a mutation to update it
- Updates `organization.settings.show_infotainers` (boolean in the existing JSONB column)

**Settings Integration**
- Add a toggle in the organization Settings page under a "Help and Guidance" or similar section
- Label: "Show feature guides" with description: "Display helpful information banners on feature pages to explain how each tool works."
- When toggled on after being off, clears all `infotainer-dismissed-*` keys from localStorage so users see them fresh

**First Infotainer Deployment: Executive Brief Page**
- Add an Infotainer at the top of the Executive Brief page explaining:
  - What: "Your weekly strategic lever -- one high-confidence action to move the needle"
  - Why: "Zura monitors your KPIs continuously and surfaces only the highest-impact opportunity"
  - How: "Review the recommendation, expand the reasoning, then Approve, Modify, Decline, or Snooze"

---

### Files to Create
- `src/components/ui/Infotainer.tsx` -- Reusable infotainer component
- `src/hooks/useInfotainers.ts` -- Hook for visibility logic and org setting

### Files to Modify
- `src/pages/dashboard/admin/ExecutiveBriefPage.tsx` -- Add first infotainer
- `src/pages/dashboard/admin/Settings.tsx` -- Add "Show feature guides" toggle (need to verify exact location)

### No Database Migration Needed
The `organizations.settings` JSONB column already exists. We simply add `show_infotainers: true` as a new key within it.
