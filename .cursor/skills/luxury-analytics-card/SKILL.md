---
name: luxury-analytics-card
description: Propose or implement a single luxury analytics card (metric + layout + copy) for Zura dashboards. Use when the user wants to design or add one new analytics card, widget, or KPI block following the analytics and luxury UI rule.
---

# Luxury Analytics Card

Use this skill when the user asks to **design**, **add**, or **implement** a single analytics card (or small widget/KPI block) for the Zura dashboard. Follow the project rule **Analytics and Luxury UI** (`.cursor/rules/analytics-luxury-ui.mdc`) so the result is calm, precise, and on-brand.

## Before you start

1. **Read the rule:** Open or recall `.cursor/rules/analytics-luxury-ui.mdc` for typography, layout, charts, cards, and permissions.
2. **Clarify the metric:** What one idea should this card convey? (e.g. "retail attachment rate by location", "at-risk client count", "revenue vs goal this week"). Prefer actionable, beauty/salon-relevant metrics from the rule's list.
3. **Scope:** One primary idea per card. If the user asked for multiple metrics, propose one card first or break into multiple cards.

## Steps

1. **Define the metric and data**
   - Name the metric and how it's calculated or sourced (existing hook or new query).
   - Ensure org/location scoping and permissions (VisibilityGate / usePermission) if the card is role-sensitive.
   - If the card shows revenue, counts, or PII, plan for HideNumbersContext (BlurredAmount, conditional tooltips).

2. **Propose or implement layout**
   - **Header:** Icon in `w-10 h-10 bg-muted rounded-lg`, icon `text-primary`; title with `font-display text-base tracking-wide` (uppercase label). Optional AnalyticsFilterBadge if the card respects dashboard date/location filters.
   - **Body:** One clear number or small set of numbers; use `font-display` or `tabular-nums` for values. Prefer size/color for hierarchy (e.g. `text-foreground` vs `text-muted-foreground`), never font-bold/font-semibold.
   - **Charts (if any):** Use only `hsl(var(--primary))` and `--chart-1` … `--chart-5`; simple chart type (line, bar, donut); tooltip with `backgroundColor: hsl(var(--background))`, `border: 1px solid hsl(var(--border))`, `borderRadius: 8px`.
   - **Empty/loading:** Skeleton that matches the card layout; empty state with minimal copy, no emojis.

3. **Copy**
   - Short, declarative labels. No hype, no exclamation points. Match brand-voice (minimal, architectural, precise).

4. **Integration**
   - If implementing: place the component under `src/components/dashboard/` (e.g. `analytics/` or `sales/`) and use existing hooks/query keys; if the card is pinnable, consider adding it to PinnedAnalyticsCard's card map and CARD_TO_TAB_MAP if applicable.

## Reference components

- Card + icon + filter badge: `src/components/dashboard/sales/RevenueDonutChart.tsx`, `src/components/dashboard/sales/TopPerformersCard.tsx`
- KPI blocks: `src/components/dashboard/analytics/OverviewContent.tsx`, `src/components/dashboard/AggregateSalesCard.tsx`
- Filter context: `src/components/dashboard/AnalyticsFilterBadge.tsx`, `src/components/dashboard/PinnedAnalyticsCard.tsx` (getDateRange, FilterContext)

## Output

- **Propose:** Describe the metric, data source, layout (header + body + optional chart), and copy in a short spec the user can approve.
- **Implement:** Add the component and wire it to data and filters; ensure design-rules (max font-weight 500, font-display for titles) and accessibility (contrast, focus, reduced motion) are respected.
