

# Fix: Strip Action Markers from Display + Ensure Extraction Works

## Two Issues

1. **Visible markers in guidance panel**: The `---ACTIONS---` block (including all action items and `---END---`) is displayed as raw text in the recovery plan dialog. Users see the machine-readable block, which looks ugly and confusing.

2. **Extraction still may fail**: The `---END---` appears inline at the end of the last sentence (no newline before it), which could still cause issues.

## Changes

### File 1: `src/components/dashboard/sales/SalesGoalProgress.tsx` (line ~264)

Strip the `---ACTIONS---` block from the displayed content before passing to ReactMarkdown:

```tsx
// Before:
<ReactMarkdown>{guidance}</ReactMarkdown>

// After:
<ReactMarkdown>{guidance?.replace(/---ACTIONS---[\s\S]*?(---END---|$)/g, '').trim()}</ReactMarkdown>
```

This removes everything from `---ACTIONS---` to `---END---` (or end of string) from the visible display, while the full raw content is still passed to `ImplementPlanDialog` via `RecoveryPlanActions` for extraction.

### File 2: `src/components/dashboard/sales/ImplementPlanDialog.tsx` (lines ~75-84)

Make the extraction more resilient to inline `---END---`:

- Before splitting into lines, also strip `---END---` that appears mid-sentence (e.g., `...cutting service. ---END---`)
- After the colon-split regex, add a simpler fallback: if a line has no colon, use the whole line as the title with empty description
- This ensures even malformed action blocks produce visible steps

### File 3: `src/components/dashboard/sales/ShareToDMDialog.tsx` (line ~53)

Also strip the `---ACTIONS---` block from DM-shared content so team members don't see machine-readable markers.

No edge function changes. No database changes. Three small file edits.
