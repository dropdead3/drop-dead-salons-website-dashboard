

# Add Interactive Task Items to Zura Card Insight Dialog

## Overview
Transform the "ACTIONABLE NEXT STEPS" section in the Zura card insight dialog from static markdown text into interactive task items. Each item will have an "Add to Tasks" button and a "Learn More" button that reveals detailed instructions.

## Current State
- The `ZuraCardInsight` dialog calls the `ai-card-analysis` edge function, which returns a single `insight` string (plain markdown)
- The dialog renders the entire response as markdown via `ReactMarkdown`
- Action items are embedded in the markdown with no interactivity
- The `SuggestedTasksSection` component already exists for the business insights drawer but is not used here

## Changes

### 1. Edge Function: Return Structured Action Items

**File: `supabase/functions/ai-card-analysis/index.ts`**

Update the AI prompt to request a JSON block of structured action items appended to the response. The system prompt will instruct the model to end its response with a fenced JSON block:

```
After your markdown analysis, output a JSON block with structured action items:
\`\`\`json:actions
[
  { "title": "...", "priority": "high|medium|low", "dueInDays": 7, "details": "Explicit step-by-step instructions..." }
]
\`\`\`
```

The edge function will then parse this JSON block out of the response, returning:
```json
{
  "insight": "...markdown without the JSON block...",
  "actionItems": [
    { "title": "Boost Retail Sales", "priority": "high", "dueInDays": 7, "details": "1. Check inventory levels at /dashboard/inventory\n2. Identify top 3 products...\n3. Train staff on upsell script..." }
  ]
}
```

### 2. Hook: Update Return Type

**File: `src/hooks/useCardInsight.ts`**

- Change the state from `string | null` to `{ insight: string; actionItems: CardActionItem[] } | null`
- Define a `CardActionItem` interface with `title`, `priority`, `dueInDays`, and `details` fields
- Parse the edge function response to extract both `insight` and `actionItems`

### 3. Dialog: Render Interactive Action Items

**File: `src/components/dashboard/ZuraCardInsight.tsx`**

After the markdown content, render the action items as interactive cards:

- Each action item shows: checkbox-style icon + title + priority badge + two buttons
- **"Add to Tasks"** button: Calls `useTasks().createTask` with `source: 'ai_insights'`, converts to a real task. Shows checkmark once added.
- **"Learn More"** button: Expands an inline detail section below the item showing the `details` field rendered as markdown with step-by-step instructions

The layout per action item:
```text
[1] Boost Retail Sales                    [HIGH]
    [+ Add to Tasks]  [Learn More v]
    
    --- expanded details (when Learn More clicked) ---
    1. Check inventory levels at /dashboard/inventory
    2. Identify your top 3 products by margin
    3. Brief your team on the "recommend one product" script
    4. Track attachment rate next week
    ---------------------------------------------------
```

### 4. Imports and Wiring

- Import `useTasks` in `ZuraCardInsight.tsx`
- Use local state (`expandedItems`, `addedItems`) to track which items are expanded or added
- Reuse the existing `SuggestedTasksSection` priority badge styling for consistency

## Technical Details

| File | Change |
|---|---|
| `supabase/functions/ai-card-analysis/index.ts` | Update prompt to request structured JSON action items; parse JSON block from response; return `{ insight, actionItems }` |
| `src/hooks/useCardInsight.ts` | Update state type to include `actionItems` array; parse structured response |
| `src/components/dashboard/ZuraCardInsight.tsx` | Render action items as interactive cards with "Add to Tasks" and expandable "Learn More" detail sections |

## Edge Cases
- If the AI does not return a valid JSON block, fall back to empty `actionItems` array (pure markdown still displays)
- If `useTasks` fails (e.g., impersonation mode), show the existing toast error
- The "Learn More" details support internal route links (rendered as clickable navigation links)
