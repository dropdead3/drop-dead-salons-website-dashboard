

# Add "How to Improve" AI Guidance Buttons to Insights and Action Items

## Overview
Add interactive buttons below each Insight Card and each Action Item that allow users to request deeper, AI-generated guidance on how to address each specific issue. When clicked, the button calls a new edge function that sends the insight/action context to the AI and returns a detailed recommendation, displayed inline below the card.

## How It Works
1. Each Insight Card gets a small "How to improve" button at the bottom
2. Each Action Item gets a "What you should do" button below it
3. Clicking the button sends that specific insight/action text to a new edge function
4. The AI returns a focused, actionable explanation (2-3 paragraphs)
5. The guidance appears inline below the card/item with a smooth animation
6. Users can collapse the guidance by clicking the button again

## Technical Details

### 1. New Edge Function: `ai-insight-guidance`
**File:** `supabase/functions/ai-insight-guidance/index.ts`

- Accepts `{ type: 'insight' | 'action', title, description, category?, priority? }`
- Uses `google/gemini-3-flash-preview` via Lovable AI gateway
- System prompt tailored for salon business context: "Given this business insight/action item, provide specific, step-by-step guidance on how to address it. Be practical and actionable."
- Returns `{ guidance: string }` as plain text (rendered with markdown)
- Handles 429/402 rate limit errors
- No caching needed (these are on-demand, per-click requests)

### 2. Update `AIInsightsDrawer.tsx` (primary visible component from screenshot)

**InsightCard changes:**
- Add local state `showGuidance` and `guidance` text
- Add a "How to improve" ghost button below the description
- On click: call the edge function with the insight's title + description + category
- Show loading spinner while fetching
- Render returned markdown guidance with `react-markdown` below the card content
- Toggle behavior: clicking again collapses the guidance

**ActionItemCard changes:**
- Same pattern: "What you should do" button below each action
- Sends action text + priority to the edge function
- Displays inline guidance below the action item

### 3. Update `AIInsightsCard.tsx` (pinnable card variant)
- Apply the same InsightCard and ActionItemCard changes for consistency across both the drawer and card views

### 4. Update `supabase/config.toml`
- Add `[functions.ai-insight-guidance]` with `verify_jwt = false`

### Files to Create
- `supabase/functions/ai-insight-guidance/index.ts`

### Files to Modify
- `src/components/dashboard/AIInsightsDrawer.tsx` -- Add guidance buttons and inline expansion to InsightCard and ActionItemCard
- `src/components/dashboard/AIInsightsCard.tsx` -- Same changes for the card variant

