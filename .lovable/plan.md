

# Fix: Strip Markdown Formatting from Parsed Task Titles and Descriptions

## Problem

The AI returns action items with markdown formatting:
- Titles wrapped in `**bold**` markers (e.g., `**White Space Audit**`)
- Descriptions containing `[link text](/url)` markdown links

The parser extracts these as raw strings without cleaning the markdown, so the UI displays literal asterisks and bracket syntax.

## Fix

### File: `src/components/dashboard/sales/SalesGoalProgress.tsx` (lines 143-149)

Add a small utility to strip markdown artifacts, then apply it during parsing:

```typescript
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold** -> bold
    .replace(/\*(.+?)\*/g, '$1')       // *italic* -> italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // [text](url) -> text
}
```

Apply `stripMarkdown()` to both `title` and `description` in the `parsedTasks` mapping (lines 145-146):

```
Before:  const title = lineMatch ? lineMatch[1].trim() : ...
After:   const title = stripMarkdown(lineMatch ? lineMatch[1].trim() : ...)
         const description = stripMarkdown(lineMatch ? lineMatch[2].trim() : '')
```

One file, ~6 lines added. No other changes needed.

