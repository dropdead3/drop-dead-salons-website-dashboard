

# Stylist Client Experience Score - "Red Flag" Analytics

## Overview

Create a composite "Client Experience Score" (CES) for each stylist that identifies potential red flags in customer connection. This feature will appear as a new card in the **Staffing** tab of Operational Analytics, highlighting stylists who may need coaching.

---

## Scoring Model

### Weighted Metrics

| Metric | Weight | Threshold for Concern | Data Source |
|--------|--------|----------------------|-------------|
| **Rebooking Rate** | 35% | < 60% | `phorest_appointments.rebooked_at_checkout` |
| **Tip Percentage** | 30% | < 15% of service total | New: `phorest_appointments.tip_amount` |
| **Client Retention Rate** | 20% | < 50% | `phorest_performance_metrics.retention_rate` |
| **Retail Attachment Rate** | 15% | < 20% | `phorest_transaction_items` |

### Score Calculation

```
Raw Score = (rebookRate × 0.35) + (tipRate × 0.30) + (retentionRate × 0.20) + (retailRate × 0.15)
```

Each component is normalized to a 0-100 scale before weighting.

### Status Indicators

| Score Range | Status | Indicator | Action |
|-------------|--------|-----------|--------|
| 0-49 | Needs Attention | Red badge | Immediate coaching recommended |
| 50-69 | Watch | Amber badge | Monitor and provide feedback |
| 70-100 | Strong | Green badge | Performing well |

---

## Implementation Plan

### Phase 1: Database Schema Updates

**Add tip tracking to appointments:**

```sql
ALTER TABLE phorest_appointments 
ADD COLUMN tip_amount DECIMAL(10,2) DEFAULT 0;
```

This allows us to calculate tip percentage per appointment and aggregate by stylist.

---

### Phase 2: Update Checkout Flow

**Persist tip amount to database:**

Modify the existing checkout flow to save `tip_amount` alongside `rebooked_at_checkout`:

- Update `CheckoutSummarySheet.tsx` - already captures tip, just needs to pass it
- Update `Schedule.tsx` - pass tip to mutation
- Update `usePhorestCalendar.ts` - include tip in updateStatus
- Update `update-phorest-appointment` edge function - persist tip amount

---

### Phase 3: Create Experience Score Hook

**New file:** `src/hooks/useStylistExperienceScore.ts`

**Query logic:**
1. Fetch all completed appointments in date range, grouped by `phorest_staff_id`
2. Calculate per-stylist metrics:
   - Rebook rate: `COUNT(rebooked_at_checkout = true) / COUNT(*)`
   - Tip rate: `AVG(tip_amount / total_price) * 100`
3. Join with `phorest_performance_metrics` for retention rate
4. Query `phorest_transaction_items` for retail attachment by staff
5. Compute weighted composite score
6. Return sorted list with status indicators

**Return type:**
```typescript
interface StylistExperienceScore {
  userId: string;
  staffName: string;
  photoUrl: string | null;
  compositeScore: number;
  status: 'needs-attention' | 'watch' | 'strong';
  metrics: {
    rebookRate: number;
    tipRate: number;
    retentionRate: number;
    retailAttachment: number;
  };
  appointmentCount: number; // For statistical significance
}
```

---

### Phase 4: Create Experience Score Card

**New file:** `src/components/dashboard/analytics/StylistExperienceCard.tsx`

**UI Design:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  👥 CLIENT EXPERIENCE SCORECARD                          [?] [⚙️]  │
│  Identifies stylists who may need coaching on customer connection   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┬────────┬────────┬────────┬────────┬────────┐    │
│  │ Stylist       │ Score  │ Rebook │ Tips   │ Retain │ Retail │    │
│  ├───────────────┼────────┼────────┼────────┼────────┼────────┤    │
│  │ 🔴 Sarah M.   │  42    │  38%   │  8%    │  55%   │  12%   │    │
│  │ 🟡 Mike R.    │  58    │  62%   │  12%   │  48%   │  18%   │    │
│  │ 🟢 Jessica L. │  84    │  78%   │  22%   │  72%   │  35%   │    │
│  │ 🟢 Alex T.    │  91    │  85%   │  24%   │  80%   │  42%   │    │
│  └───────────────┴────────┴────────┴────────┴────────┴────────┘    │
│                                                                     │
│  📊 Minimum 5 appointments required for scoring                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Sortable by any column (default: score ascending to show concerns first)
- Expandable rows to show trend over time
- Tooltip explaining what each metric means
- Settings dialog to adjust thresholds and weights
- Minimum appointment threshold (default 5) to ensure statistical validity

---

### Phase 5: Add to Analytics Page

**Update:** `src/components/dashboard/analytics/StaffingContent.tsx`

Add the new card after the Staff Revenue Leaderboard:

```tsx
{/* Client Experience Scorecard */}
<StylistExperienceCard 
  locationId={locationId} 
  dateRange={dateRange}
/>
```

---

### Phase 6: Metrics Glossary Update

**Add to:** `src/data/metricsGlossary.ts`

```typescript
{
  id: 'client-experience-score',
  name: 'Client Experience Score',
  category: 'operations',
  description: 'Composite score measuring client satisfaction through rebooking, tipping, retention, and retail engagement. Lower scores indicate stylists who may need coaching.',
  formula: '(Rebook Rate × 0.35) + (Tip Rate × 0.30) + (Retention Rate × 0.20) + (Retail Rate × 0.15)',
  dataSource: 'phorest_appointments, phorest_performance_metrics, phorest_transaction_items',
  updateFrequency: 'Real-time',
  example: '72 (Strong)',
  relatedMetrics: ['rebook-rate-operational', 'retention-rate'],
}
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| **Database Migration** | Create | Add `tip_amount` column |
| `src/components/dashboard/schedule/CheckoutSummarySheet.tsx` | Modify | Already captures tip, ensure it's passed |
| `src/pages/dashboard/Schedule.tsx` | Modify | Pass tip amount to mutation |
| `src/hooks/usePhorestCalendar.ts` | Modify | Include tip_amount in update |
| `supabase/functions/update-phorest-appointment/index.ts` | Modify | Persist tip amount |
| `src/hooks/useStylistExperienceScore.ts` | Create | Calculate composite scores |
| `src/components/dashboard/analytics/StylistExperienceCard.tsx` | Create | Display scorecard UI |
| `src/components/dashboard/analytics/StaffingContent.tsx` | Modify | Add new card |
| `src/data/metricsGlossary.ts` | Modify | Document new metric |

---

## Future Enhancements (Not in Initial Scope)

1. **Request Rate Tracking** - Track when clients specifically request a stylist vs. open booking
2. **Trend Sparklines** - Show 4-week rolling trend per stylist
3. **Alert System** - Notify managers when a stylist drops below threshold
4. **Coaching Notes** - Allow managers to log coaching sessions linked to scores
5. **Client Feedback Integration** - If/when Phorest provides review data

---

## Technical Considerations

**Minimum Sample Size:**
Scores are only calculated for stylists with 5+ completed appointments in the selected date range to ensure statistical validity.

**Tip Rate Calculation:**
- Tip percentage = `(tip_amount / total_price) × 100`
- No-tip appointments count as 0%
- Industry benchmark: 15-20% is typical for good service

**Privacy:**
All data is already accessible via existing RLS policies for leadership roles.

