
# Fix Thread Reply Font Size

## Problem

Thread reply messages use `text-xs` (12px) font size while the main chat uses `text-sm` (14px). This creates a visually inconsistent experience where thread replies appear too small.

## Current Styling Comparison

| Element | Main Chat (MessageItem) | Thread Reply (ThreadMessageItem) |
|---------|------------------------|----------------------------------|
| Message text | `text-sm` | `text-xs` ← too small |
| Sender name | `text-sm` | `text-xs` ← too small |
| Timestamp | `text-xs` | `text-[10px]` |
| Avatar | `h-10 w-10` | `h-8 w-8` |

## Solution

Update `ThreadMessageItem.tsx` to match the main chat font sizes for replies (non-parent messages).

### Changes to `ThreadMessageItem.tsx`

**Line 134** - Sender name:
```tsx
// Before
<span className={cn('font-semibold', isParent ? 'text-sm' : 'text-xs')}>{senderName}</span>

// After
<span className="font-semibold text-sm">{senderName}</span>
```

**Line 141** - Message content:
```tsx
// Before
<div className={cn('whitespace-pre-wrap break-words', isParent ? 'text-sm' : 'text-xs')}>

// After
<div className="text-sm whitespace-pre-wrap break-words">
```

## Summary

| File | Change |
|------|--------|
| `src/components/team-chat/ThreadMessageItem.tsx` | Change reply text from `text-xs` to `text-sm` to match main chat |

This ensures consistent typography between main chat and thread panel for a cohesive reading experience.
