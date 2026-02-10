
# Enhance AI with High-Ticket & Retail Sales Intelligence

## Overview
Update the AI Business Insights edge function to feed the AI concrete data about high-ticket appointments, retail/product sales ratios, and extension services. This gives the AI the context it needs to proactively recommend strategies for increasing average ticket spend -- especially through extensions, color corrections, and retail attachment.

## What Changes

### 1. Add new data queries (`ai-business-insights/index.ts`)

Add two new parallel queries to the existing `Promise.all` block:

**A. High-ticket appointments** (from `appointments` table, last 30 days):
- Count appointments with `total_price >= 500`
- Count total completed appointments
- Compute the high-ticket percentage

**B. Transaction item breakdown** (from `phorest_transaction_items`, last 30 days):
- Total product (retail) revenue vs service revenue
- Product attachment rate (% of transactions that include a product)
- Identify extension-related services (pattern match on item_name for "extension", "install", "tape-in", "hand-tied", "weft", etc.)
- Identify color correction services (pattern match for "color correction", "corrective color")
- Count and revenue for each of these high-value categories

### 2. Compute metrics and add to data context

Add a new section to the `dataContext` string:

```
HIGH-TICKET & RETAIL ANALYSIS (Last 30 days):
- Total completed appointments: X
- High-ticket appointments ($500+): X (Y%)
- Extension services: X appointments, $Y revenue
- Color correction services: X appointments, $Y revenue
- Product/retail revenue: $X (Y% of total revenue)
- Product attachment rate: X% of service transactions included retail
- Average ticket: $X
```

### 3. Enhance the system prompt

Add a dedicated paragraph to the system prompt giving the AI salon-industry expertise about:
- The critical importance of increasing average ticket through retail sales and high-ticket services
- Extensions (installation, maintenance, hair retail/packages) as the top revenue driver per appointment
- Color correction as a premium, high-margin service category
- When extension revenue is absent or low, the AI should flag this as a major growth opportunity
- When product attachment rate is below 30%, recommend retail sales strategies
- When high-ticket appointments ($500+) are under 15% of total, suggest service menu and pricing strategies

## Files to Modify
- `supabase/functions/ai-business-insights/index.ts` -- add queries, compute metrics, enhance prompt

## No Database or Frontend Changes Needed
The AI already outputs insights, action items, and suggested tasks. This change just gives it better data and domain knowledge to generate more relevant recommendations about revenue growth through high-ticket services and retail.
