

## Per-Stylist Add-On Attachment Rates + Margin Quality

### Problem
The add-on recommendation system suggests add-ons during booking, but there is no tracking of which add-ons are actually accepted, by which stylist's appointment, or whether the upsells are high-margin or low-margin. Without this data, operators can't identify who is driving profitable upsells.

### Solution
Create a lightweight event-tracking layer that records every accepted add-on during booking, then build an analytics hook and dashboard card that surfaces per-stylist attachment rates alongside the margin profile of the add-ons they're selling.

### What Changes

**1. New database table: `booking_addon_events`**
Captures each add-on acceptance during the booking flow.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | Row ID |
| organization_id | uuid FK | Org scope |
| staff_user_id | uuid | Stylist the booking is for |
| addon_id | uuid FK | Which add-on from the library |
| addon_name | text | Denormalized for fast reads |
| addon_price | numeric | Price at time of acceptance |
| addon_cost | numeric (nullable) | Cost at time of acceptance |
| created_at | timestamptz | When the add-on was accepted |

RLS: Read/insert for authenticated org members. This table is append-mostly (write on booking, read on analytics).

**2. Record add-on acceptance: `QuickBookingPopover.tsx`**
When a user clicks "Add" on the ServiceAddonToast, insert a row into `booking_addon_events` with the current stylist, addon details (including price and cost snapshot), and organization.

**3. New hook: `src/hooks/useStylistAddonAttachment.ts`**
Queries `booking_addon_events` for a date range and aggregates:
- Per stylist: total add-ons accepted, unique bookings with add-ons, attachment rate
- Per stylist: avg margin % of accepted add-ons, count of high-margin (above 50%) vs low-margin (below 30%) add-ons
- Returns sorted by attachment rate descending

**4. New analytics card on Stats page**
"STYLIST ADD-ON PERFORMANCE" card (admin/manager only) showing a compact table:

| Stylist | Add-Ons | Avg Margin | High / Low |
|---------|---------|------------|------------|
| Sarina L. | 12 | 62% | 10 / 2 |
| Gavin E. | 5 | 38% | 2 / 3 |

This makes it immediately visible who is upselling profitably vs who may need coaching on which add-ons to recommend.

**5. Lever engine signal**
Inject a `stylist_addon_quality` signal into the lever-engine evidence when any stylist has a high attachment count but low avg margin (below 35%), enabling the Weekly Zura Brief to flag: "Stylist X is upselling frequently but at low margins -- consider coaching toward higher-margin add-ons."

### Technical Detail

**Database migration:**
```sql
CREATE TABLE public.booking_addon_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  staff_user_id uuid NOT NULL,
  addon_id uuid NOT NULL REFERENCES service_addons(id),
  addon_name text NOT NULL,
  addon_price numeric NOT NULL DEFAULT 0,
  addon_cost numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.booking_addon_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read addon events"
  ON public.booking_addon_events FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Authenticated users can insert addon events"
  ON public.booking_addon_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_booking_addon_events_org_date
  ON public.booking_addon_events (organization_id, created_at);
CREATE INDEX idx_booking_addon_events_staff
  ON public.booking_addon_events (staff_user_id, created_at);
```

**QuickBookingPopover change (~5 lines):**
Inside the `onAdd` callback, after toggling the service, insert a row:
```typescript
supabase.from('booking_addon_events').insert({
  organization_id: orgId,
  staff_user_id: selectedStylistId,
  addon_id: addon.id,
  addon_name: addon.name,
  addon_price: addon.price,
  addon_cost: addon.cost,
});
```

**Hook structure:**
```typescript
interface StylistAddonPerformance {
  staffUserId: string;
  displayName: string;
  totalAddons: number;
  avgMarginPct: number;
  highMarginCount: number; // margin >= 50%
  lowMarginCount: number;  // margin < 30%
}
```

**Stats card placement:** Below the existing "ADD-ON MARGINS" card, wrapped in the same admin/manager visibility gate.

**Lever engine addition:** ~10 lines after the existing addon margin signal to check per-stylist quality and flag low-margin upsellers.

### Data Note
This tracking starts from the moment the migration runs. Historical add-on acceptance data does not exist, so the card will populate over time as bookings with add-ons are made.

### Files

| File | Action |
|------|--------|
| Database migration | Create `booking_addon_events` table |
| `src/components/dashboard/schedule/QuickBookingPopover.tsx` | Edit - record addon acceptance |
| `src/hooks/useStylistAddonAttachment.ts` | Create - per-stylist analytics |
| `src/pages/dashboard/Stats.tsx` | Edit - add stylist add-on performance card |
| `supabase/functions/lever-engine/index.ts` | Edit - add stylist addon quality signal |
