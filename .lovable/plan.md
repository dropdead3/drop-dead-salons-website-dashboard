

# Fix: Show Selectable Action Steps in "Let's Implement" Dialog

## Problem

The "Action Steps" section appears empty because the `extractActions` function can't parse the AI-generated content. The AI edge function returns free-form markdown (2-3 paragraphs with bold actions, bullet points, and links) -- not a rigid numbered-list format. The regex strategies are too strict or conflict with each other.

## Root Cause

The AI prompt says "Format with markdown (bold key actions, use bullet points for steps)" -- so the output mixes inline bold text within paragraphs, markdown links, and bullet sub-points. The extraction patterns miss these because:
- Bold text often contains colons within links or extra formatting
- Bullet points may be nested or mixed with paragraph text  
- Numbered lists may not start at the beginning of lines

## Solution

Overhaul `extractActions` with a more resilient, multi-pass approach:

1. **Normalize content first**: Strip markdown links `[text](url)` down to just `text` before matching, so links inside bold text don't break patterns.

2. **Broader bold extraction**: Match any `**bold text**` that looks like an action (longer than 4 chars), then grab the rest of the line or next sentence as description.

3. **Sentence-level fallback**: If no structured items are found, split content into sentences/lines and pick substantive ones (over 20 chars, not generic headers) as individual action items. This ensures the dialog always has something to show.

4. **Deduplication**: Since multiple strategies run, deduplicate by title similarity to avoid showing the same action twice.

## Technical Changes

### `ImplementPlanDialog.tsx` -- `extractActions` function rewrite

- Add a `normalizeContent` helper that strips markdown links and extra whitespace
- Rewrite Strategy 1: Match `**any bold text**` followed by remaining line content as description
- Rewrite Strategy 2: Match bullet/numbered items (with or without bold), capture full line as title
- Add Strategy 3 (fallback): Split by newlines, filter to substantive lines (length > 20, not just headers), use each as a step
- Keep the position-based due date assignment at the end
- Cap at 8 steps

### No other file changes needed

The dialog UI (checkboxes, selection state, routing options) already works correctly -- only the extraction logic needs fixing.
