

# Add MetricInfoTooltip to All Analytics Cards Missing It

## Audit Results

13 analytics cards are currently missing the info circle tooltip. Every other analytics card already has one.

## Cards to Update

| # | File | Card Title | Tooltip Description |
|---|------|-----------|---------------------|
| 1 | `sales/PeakHoursHeatmap.tsx` | PEAK HOURS | "Heatmap of appointment volume by hour and day of week. Darker cells indicate higher booking density. Data is aggregated from completed appointments in the selected period." |
| 2 | `sales/PerformanceTrendChart.tsx` | REVENUE TREND | "Weekly revenue trend over the selected timeframe. Each data point represents total service and product revenue for that week. The trend arrow shows the direction of the most recent week vs the prior week." |
| 3 | `sales/YearOverYearComparison.tsx` | YEAR-OVER-YEAR | "Compares monthly revenue between the current year and the prior year. The percentage badge shows the overall year-to-date change. Use this to identify seasonal patterns and long-term growth." |
| 4 | `sales/HistoricalComparison.tsx` | PERIOD COMPARISON | "Side-by-side comparison of key metrics (revenue, services, products, transactions) between the current period and a prior period (last month or last year). Percentage changes highlight growth or decline." |
| 5 | `sales/ServicePopularityChart.tsx` | SERVICE POPULARITY | "Ranks services by revenue or appointment count. Use this to identify your highest-demand and highest-revenue services. Data is sourced from completed appointment line items." |
| 6 | `analytics/StylistExperienceCard.tsx` | CLIENT EXPERIENCE SCORECARD | "Flags stylists with lower client retention or rebooking patterns who may benefit from coaching. Scores are based on repeat visit rates and average client tenure per stylist." |
| 7 | `analytics/RevenueForecastCard.tsx` | AI Revenue Forecast | "AI-generated revenue projection based on historical patterns, seasonal trends, and current booking pipeline. Confidence level reflects how much historical data is available." |
| 8 | `analytics/WeeklyLeverSection.tsx` | WEEKLY LEVER | "The single highest-confidence action recommended by Zura this week. Generated from performance data, benchmarks, and operational signals. Only surfaces when confidence is high." |
| 9 | `analytics/DailyBriefCard.tsx` | Daily Brief | "Today's real-time snapshot: total revenue, scheduled vs completed appointments, and no-show rate. Revenue is from completed transactions only." |
| 10 | `analytics/LocationsRollupCard.tsx` | Location Performance | "Revenue breakdown across all your locations for the selected period. Only locations with activity are shown. Use this to compare location productivity at a glance." |
| 11 | `analytics/OperationalHealthCard.tsx` | Operational Health | "Tracks no-show rate, cancellation rate, and completion rate for appointments in the selected period. Rates are calculated as a percentage of total scheduled appointments." |
| 12 | `analytics/RebookingCard.tsx` | Rebooking Rate | "Percentage of completed appointments where the client booked a future appointment. Calculated as rebooked clients / total completed appointments x 100." |
| 13 | `analytics/RetailEffectivenessCard.tsx` | Retail Effectiveness | "Measures retail sales performance: product revenue as a share of total revenue and the attachment rate (percentage of service transactions that included a product sale)." |
| 14 | `analytics/ServiceMixCard.tsx` | Service Mix | "Revenue distribution across service categories for the selected period. Shows each category's share of total service revenue to highlight your most profitable service lines." |

## Implementation Pattern

Each card follows the same pattern -- add a `MetricInfoTooltip` import and place it immediately after the card title text inside a `flex items-center gap-2` wrapper (or add to existing wrapper). For cards using `h3` tags instead of `CardTitle`, the tooltip goes right after the text element.

## Technical Details

- Import: `import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';`
- For cards with `CardTitle`: wrap in `<div className="flex items-center gap-2">` if not already wrapped, then add `<MetricInfoTooltip description="..." />` after the title
- For cards with `h3` titles (LocationsRollupCard, OperationalHealthCard, RebookingCard, RetailEffectivenessCard, ServiceMixCard, DailyBriefCard): same pattern, wrap the `h3` in a flex container with the tooltip

## Files Changed

14 files total, each receiving only a small import addition and 1-2 line insertion next to the card title.

