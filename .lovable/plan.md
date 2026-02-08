
# Add Double-Click to Reply Feature

## Overview
Add a double-click handler on chat messages that triggers the reply (thread) function. This provides a quick, intuitive way to start a thread without needing to hover and click the reply button.

## Implementation

### File: `src/components/team-chat/MessageItem.tsx`

**Add `onDoubleClick` handler to the message container (line 50):**

```tsx
<div
  className={cn(
    'group relative flex items-start gap-4 px-4 py-2 rounded-lg transition-colors',
    'hover:bg-accent/20',
    isConsecutive ? 'pt-0.5 ml-16' : 'pt-3'
  )}
  onMouseEnter={() => setShowActions(true)}
  onMouseLeave={() => setShowActions(false)}
  onDoubleClick={onReply}  // ← Add this line
>
```

That's it! The `onReply` callback is already passed as a prop and handles opening the thread panel via `openThread(message.id)` from the TeamChatContext.

## Considerations

- **Text selection**: Double-click normally selects a word. By adding the handler to the container, the reply action will trigger, but users can still select text by clicking and dragging. This is the same behavior as Slack.
- **Cursor feedback**: Optionally add `cursor-pointer` to hint at interactivity, but this may conflict with the text-selection expectation. I recommend keeping the default cursor for a cleaner feel.

## Summary
| Change | Location |
|--------|----------|
| Add `onDoubleClick={onReply}` | Line 50-57, message container div |

This is a minimal, one-line change that adds a nice quality-of-life improvement for power users.
