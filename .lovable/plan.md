

# Fix: Action Steps Not Parsing in "Let's Implement" Dialog

## Problem

The AI is generating the `---ACTIONS---` block correctly, but without numbered prefixes. The parser regex requires lines to start with `1.`, `2.`, etc. -- so every line fails to match, and the steps array stays empty.

Screenshot evidence:
```text
---ACTIONS---
Utilization Audit: Review the Schedule to...
High-Margin Upsells: Brief the team to...
---END---
```

Parser expects: `^\d+\.\s*(.+?):\s*(.+)$`
Actual format: `Title: Description` (no number)

Additionally, `---END---` appears on the same line as the last item, so the block regex may not capture the last entry cleanly.

## Fix (single file, ~5 lines changed)

### `src/components/dashboard/sales/ImplementPlanDialog.tsx`

**Line 75**: Update the `---END---` capture to also handle it appearing inline (not on its own line). Replace the block regex with one that strips `---END---` from content before splitting.

**Line 79**: Change the line-matching regex from requiring a numbered prefix to making it optional:

```
Before:  /^\d+\.\s*(.+?):\s*(.+)$/
After:   /^(?:\d+[.)]\s*)?(.+?):\s+(.+)$/
```

This matches both `1. Title: Description` and just `Title: Description`.

**Line 77**: After splitting lines, also strip any trailing `---END---` from the last line so the final action item isn't lost.

No other files changed. No database changes. No edge function changes needed -- the prompt already asks for numbered items, but we should be resilient when the AI omits them.
