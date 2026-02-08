
# Fix Timestamp Alignment for Consecutive Messages

## Current Issue
Looking at your screenshot, the timestamp "10:44 AM" on consecutive messages is not vertically aligned with the message text ("Test 3"). The timestamp appears higher than the message content line.

## Root Cause
The consecutive message container uses `items-start` which aligns the timestamp to the top, but the timestamp spacer div doesn't properly center vertically with the single-line message text.

## Solution
Change the alignment and structure so the timestamp is vertically centered with the message content:

1. Change container alignment for consecutive messages to center items
2. Adjust the timestamp spacer to properly align with the message line

## Technical Changes

### File: `src/components/team-chat/MessageItem.tsx`

**Update container classes (lines 50-55):**
```tsx
// Before
className={cn(
  'group relative flex items-start gap-4 px-4 py-2 rounded-lg transition-colors',
  'hover:bg-accent/20',
  isConsecutive ? 'pt-0.5 ml-16' : 'pt-3'
)}

// After - Use items-center for consecutive messages
className={cn(
  'group relative flex gap-4 px-4 py-2 rounded-lg transition-colors',
  'hover:bg-accent/20',
  isConsecutive ? 'items-center pt-0.5 ml-16' : 'items-start pt-3'
)}
```

**Update timestamp spacer (lines 69-78):**
```tsx
// Before
{isConsecutive && (
  <div className="w-10 shrink-0 flex items-center justify-end -ml-16">
    <span className={cn(
      "text-[10px] text-muted-foreground whitespace-nowrap transition-opacity",
      showActions ? "opacity-100" : "opacity-0"
    )}>
      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  </div>
)}

// After - Remove vertical alignment from inner div since container handles it
{isConsecutive && (
  <div className="w-14 shrink-0 flex justify-end -ml-16 pr-2">
    <span className={cn(
      "text-[10px] text-muted-foreground whitespace-nowrap transition-opacity",
      showActions ? "opacity-100" : "opacity-0"
    )}>
      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  </div>
)}
```

## Summary of Changes

| Aspect | Before | After |
|--------|--------|-------|
| Container alignment | Always `items-start` | `items-center` for consecutive, `items-start` for first message |
| Timestamp spacer width | `w-10` | `w-14` (more space for time) |
| Timestamp alignment | `items-center justify-end` | `justify-end` (container handles vertical) |
| Right padding | None | `pr-2` for spacing from message |

This ensures the timestamp is perfectly vertically aligned with the message text on the same line.
