
# Fix: Show Action Steps in "Let's Implement" Dialog

## The Real Problem

The extraction keeps failing because we're trying to parse free-form markdown with regex -- and the AI output format varies every time. The AI prompt says "Format with markdown (bold key actions, use bullet points for steps)" but doesn't enforce a consistent structure. No amount of regex gymnastics will reliably parse every variation.

## Two-Pronged Fix

### 1. Tell the AI to output a parseable action block (Edge Function)

Add an instruction to the system prompt in `ai-insight-guidance` edge function that asks the AI to append a structured block at the end of its response:

```
At the end of your response, include a structured action block in this exact format:

---ACTIONS---
1. [Action Title]: [Brief description of what to do]
2. [Action Title]: [Brief description of what to do]
3. [Action Title]: [Brief description of what to do]
---END---
```

This gives us a reliable delimiter to parse, while the main body of the response stays human-readable markdown.

### 2. Update `extractActions` in `ImplementPlanDialog.tsx`

Rewrite the parser with this priority order:

1. **Primary**: Look for the `---ACTIONS---` ... `---END---` block. Parse numbered lines between those markers. This will always work for new AI responses.

2. **Fallback**: For older saved plans or edge cases where the block is missing, keep a simplified version of the current bold/list/line parsing as backup.

This way the dialog will always show action items -- either from the structured block or from best-effort markdown parsing.

## Technical Details

### File: `supabase/functions/ai-insight-guidance/index.ts`

Add to the `SYSTEM_PROMPT` string (around line 34-47):

- Append instruction requiring the `---ACTIONS---` block at the end of every response
- Specify the exact numbered format: `1. [Title]: [Description]`
- Cap at 3-5 action items

### File: `src/components/dashboard/sales/ImplementPlanDialog.tsx`

Rewrite `extractActions` function:

- **Step 1**: Search for content between `---ACTIONS---` and `---END---` markers
- **Step 2**: Parse each line matching `\d+\.\s*(.+?):\s*(.+)` into title/description
- **Step 3**: If no markers found, fall back to current bold-pattern + list-pattern strategies
- **Step 4**: If still nothing, use the sentence-level fallback
- Keep deduplication, 8-item cap, and due-day assignment logic unchanged

No database changes. No new files. Two file edits total.
