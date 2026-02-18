

## Improve Client Experience Card -- Composite Ranking and Actionable Utility

### The Problem

The current Client Experience card shows four raw metrics (Avg Tip, Tip Rate, Feedback Rate, Rebook Rate) with a bar chart for one metric at a time. A salon owner has to mentally cross-reference four separate views to determine which stylists provide the best overall experience. There is no single ranking or signal that answers the core question.

### What Changes

#### 1. Add a Composite Experience Score to the hook

**File:** `src/hooks/useClientExperience.ts`

- Compute a weighted composite score (0-100) per stylist using the same proven weights from `useStylistExperienceScore`:
  - Rebook Rate: 35%
  - Tip Rate: 30%
  - Feedback Rate: 20%
  - Avg Tip (normalized): 15%
- Normalize tip amounts to a 0-100 scale (cap at a configurable "excellent" threshold, e.g. $15 avg tip = 100)
- Add `compositeScore` and `status` ("strong" / "watch" / "needs-attention") to each `StaffExperienceDetail`
- Add salon-wide composite to the returned data

#### 2. Add a Composite Score KPI tile and ranking view

**File:** `src/components/dashboard/sales/ClientExperienceCard.tsx`

- Add a 5th KPI tile: **Experience Score** (composite out of 100, with period-over-period change badge)
- When the "Experience Score" tile is active, the drill-down section changes from a bar chart to a **ranked staff list** showing:
  - Rank number
  - Staff name
  - Composite score (e.g. "74 / 100") with a status badge (Strong / Watch / Needs Attention)
  - A small inline breakdown showing the four component scores as a micro bar or label row
- This gives the owner one clear answer: "Stylist A has the best client experience at 82/100; Stylist D needs coaching at 38/100"

#### 3. Add coaching callout for low scorers

- Below the ranked list, if any stylist scores below 50 ("needs-attention"), show a calm advisory callout (bg-muted/40 pattern): "N stylists may benefit from coaching on client experience fundamentals"
- No shame language; advisory tone per Zura doctrine

#### 4. Keep the existing four metric bar charts

- The four original tiles (Avg Tip, Tip Rate, Feedback Rate, Rebook Rate) remain and still toggle the horizontal bar chart for single-metric drill-down
- The composite score tile is an additive 5th option, not a replacement

### Technical Details

**Hook changes (`useClientExperience.ts`):**
- Add `compositeScore: number` and `status: 'strong' | 'watch' | 'needs-attention'` to `StaffExperienceDetail`
- Add `compositeScore: { current: number; prior: number; percentChange: number | null }` to `ClientExperienceData`
- Composite calculation reuses the weight constants from `useStylistExperienceScore` for consistency
- Avg tip normalization: `Math.min((avgTip / AVG_TIP_EXCELLENT) * 100, 100)` where `AVG_TIP_EXCELLENT = 15`

**Component changes (`ClientExperienceCard.tsx`):**
- Add `'composite'` to the `ExperienceMetric` type union
- Add 5th KPI tile in the grid (switch to `md:grid-cols-5` or use the bento 3+2 layout for 5 items)
- When `activeMetric === 'composite'`, render a ranked list instead of the bar chart:
  - Each row: rank badge, name, composite score, status badge, expandable breakdown
- Status badge colors follow existing `STATUS_CONFIG` pattern (destructive for needs-attention, chart-5 for watch, chart-2 for strong)
- Coaching callout uses the advisory tone (`bg-muted/40 border border-border/30`)

**No database changes required.** All data is already available.

### Files Modified
- `src/hooks/useClientExperience.ts` -- add composite score computation
- `src/components/dashboard/sales/ClientExperienceCard.tsx` -- add 5th tile, ranked list view, coaching callout

### Design Rules Followed
- `tokens.kpi.label` / `tokens.kpi.value` for the new tile (Termina)
- Max font-weight 500, no font-bold
- Advisory tone, no shame language
- Expandable "Show all" pattern for the ranked list
- Status badges use theme-aware semantic colors
