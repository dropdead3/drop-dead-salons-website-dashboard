

# Enhanced Long-Range Revenue Forecasting

## The Problem

The current forecasting system only looks at **what's scheduled on the books** — it answers "how much revenue is coming from booked appointments?" That's useful tactically, but it doesn't tell leadership **where the business is headed** based on historical growth patterns, seasonal trends, and momentum.

## What We'll Build

A new **Growth Forecasting** section within the existing Forecasting tab that provides quarterly and annual revenue projections based on trend analysis. Think of it as the difference between "you have $12K booked next week" vs. "based on your trajectory, you're on pace for $1.8M this year, up 12% from last year."

### Key Metrics & Visualizations

**1. Trend Summary Cards**
- **Projected Quarterly Revenue** — next quarter estimate with confidence band
- **Growth Rate** — quarter-over-quarter and year-over-year percentage
- **Revenue Momentum** — whether growth is accelerating, steady, or decelerating
- **Seasonality Signal** — "Q1 is historically your strongest/weakest quarter"

**2. Revenue Trajectory Chart**
- A smooth area/line chart showing:
  - Past quarters (actual revenue, solid line)
  - Projected quarters (dashed line with confidence shading)
  - Growth trendline overlay
- Time range: last 4 quarters actuals + next 2-4 quarters projected
- Confidence bands (optimistic / baseline / conservative) shown as gradient fills

**3. Growth Insights Panel**
- AI-generated natural language insights like:
  - "Revenue grew 8% last quarter, driven primarily by service revenue increases"
  - "Product sales are trending down 3% — consider retail promotions"
  - "Based on current trajectory, you'll hit your yearly goal by October"
- Factors driving the forecast (service mix, client growth, seasonal patterns)

**4. Scenario Comparison** (simple toggle)
- Conservative / Baseline / Optimistic projections
- Shows the range of likely outcomes so leaders understand the spread

## Technical Approach

### New Edge Function: `growth-forecasting`
- Pulls **all available historical data** from `phorest_daily_sales_summary` (not just 90 days)
- Aggregates into monthly and quarterly totals
- Calculates:
  - Linear regression trendline
  - Quarter-over-quarter growth rates
  - Seasonal indices (which months/quarters over/underperform)
  - Weighted momentum (recent quarters weighted more heavily)
- Sends aggregated context to Gemini-3-flash for intelligent narrative insights
- Returns structured projections with confidence intervals

### New Database Table: `growth_forecasts`
- Stores quarterly/annual projections with scenarios (conservative/baseline/optimistic)
- Tracks projection accuracy over time for model improvement
- Cached with 24-hour staleness (long-range forecasts don't change frequently)

### New Frontend Components
- `GrowthForecastCard` — the main container with scenario toggles
- `RevenueTrajectoryChart` — Recharts area chart with actual + projected + confidence bands
- `GrowthInsightsPanel` — AI-generated narrative insights
- `TrendKPICards` — the summary metric cards at top

### New Hook: `useGrowthForecast`
- Calls the edge function with organization context
- Manages scenario selection state
- 24-hour cache with `staleTime`

### Integration Points
- Added as a new section **below** the existing `ForecastingCard` in the Sales > Forecasting subtab
- Respects existing visibility gates (`sales_forecasting_subtab`)
- Integrates with the Hide Numbers privacy system
- Location filter support for multi-location businesses

## UI Design Direction
- Matches the existing "luxury glass" aesthetic from the current forecasting charts
- Confidence bands rendered as soft gradient fills (not harsh borders)
- Actual vs projected clearly distinguished (solid vs dashed)
- Entrance animations via framer-motion `useInView`
- Responsive: KPI cards stack on mobile, chart adapts to width

## File Changes Summary

| File | Action |
|------|--------|
| `supabase/functions/growth-forecasting/index.ts` | Create — new edge function |
| `supabase/config.toml` | Update — register new function |
| `src/hooks/useGrowthForecast.ts` | Create — data fetching hook |
| `src/components/dashboard/sales/GrowthForecastCard.tsx` | Create — main component |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Update — add GrowthForecastCard to Forecasting subtab |
| Migration SQL | Create `growth_forecasts` table |

