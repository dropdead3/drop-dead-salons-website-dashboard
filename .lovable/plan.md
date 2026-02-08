

# Align Timestamp to First Line of Text

## Problem

Currently, the timestamp in the left column for consecutive messages appears at the default position, which doesn't align well with the first line of the message text. For multi-line messages, the timestamp should align with the first line, not center to the entire block.

## Solution

Add `items-start` to the parent flex container to align the left column (timestamp) to the top. Then use a fixed line-height on the timestamp that matches the message text line-height, so they align perfectly.

### Code Changes

**Line 51-55**: Add `items-start` to align timestamp column to top

```tsx
// Before
<div
  className={cn(
    'group relative flex gap-3 px-2 py-1 rounded-md transition-colors',
    'hover:bg-accent/30',
    isConsecutive && 'pt-0'
  )}

// After
<div
  className={cn(
    'group relative flex items-start gap-3 px-2 py-1 rounded-md transition-colors',
    'hover:bg-accent/30',
    isConsecutive && 'pt-0'
  )}
```

**Lines 67-74**: Add line-height to match the message text line

```tsx
// Before
{isConsecutive && (
  <span className={cn(
    "text-[10px] text-muted-foreground whitespace-nowrap transition-opacity",
    showActions ? "opacity-100" : "opacity-0"
  )}>
    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
  </span>
)}

// After
{isConsecutive && (
  <span className={cn(
    "text-[10px] text-muted-foreground whitespace-nowrap transition-opacity leading-5",
    showActions ? "opacity-100" : "opacity-0"
  )}>
    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
  </span>
)}
```

The `leading-5` (1.25rem / 20px line-height) matches the default line-height of `text-sm` text, ensuring the timestamp baseline aligns with the first line of the message content.

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/team-chat/MessageItem.tsx` | Line 52: Add `items-start` to flex container |
| `src/components/team-chat/MessageItem.tsx` | Line 69: Add `leading-5` for proper line-height alignment |

---

## Expected Result

- Single-line messages: timestamp vertically aligned with the text
- Multi-line messages: timestamp aligned with the **first line** of text
- Consistent visual alignment across all message types

