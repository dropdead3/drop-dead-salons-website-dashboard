
# Add L-Line Threading Indicator to Main Chat

## Goal

Add a visual "L" shaped line indicator to messages in the main chat when they have replies. This will visually show the threading relationship directly in the message list, not just in the thread panel.

## Current vs. Desired

**Current**: Messages with replies just show a "2 replies" text link

**Desired**: Messages with replies show an L-line connector with a preview or indicator of the thread

```text
┌────────────────────────────────────────┐
│  [Avatar] Parent Message               │
│           Message content here...      │
│                                        │
│     │                                  │  ← Vertical line  
│     └── 💬 2 replies                   │  ← L-connector to reply indicator
│                                        │
│  [Avatar] Another Message              │
└────────────────────────────────────────┘
```

## Implementation

### Changes to `MessageItem.tsx`

Wrap the reply count indicator with the L-line visual:

```tsx
{/* Reply count with L-line threading */}
{message.reply_count > 0 && (
  <div className="relative mt-1 ml-5 pl-4 border-l-2 border-muted-foreground/20">
    {/* Horizontal connector */}
    <div className="absolute -left-4 top-2 w-4 h-px bg-muted-foreground/20" />
    
    <button
      onClick={onReply}
      className="flex items-center gap-1 text-xs text-primary hover:underline"
    >
      <MessageSquare className="h-3 w-3" />
      {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
    </button>
  </div>
)}
```

## Visual Elements

| Element | Style |
|---------|-------|
| Vertical line | `border-l-2 border-muted-foreground/20` - subtle gray left border |
| Horizontal connector | `w-4 h-px bg-muted-foreground/20` - extends from vertical line to reply indicator |
| Indentation | `ml-5` (20px) - aligns with avatar column |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/team-chat/MessageItem.tsx` | Wrap reply count in L-line container with horizontal connector |

## Result

- Creates visual consistency between main chat and thread panel
- Shows threading relationship at a glance without opening the thread
- Subtle styling that doesn't overwhelm the main message content
- Clickable area maintained for opening the full thread
