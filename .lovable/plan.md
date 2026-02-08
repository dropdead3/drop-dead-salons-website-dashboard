
# Fix Message Row Layout Shift on Hover

## Problem

When hovering over consecutive messages, the row expands/shifts because:
1. The timestamp only appears when hovering (`isConsecutive && showActions`)
2. This conditionally adds DOM content, which affects the row height

## Solution

Make the timestamp **always present** but **invisible** when not hovered. This reserves the space and prevents layout shift.

### Code Changes

**Change lines 67-71** in `MessageItem.tsx`:

```tsx
// Before - timestamp only exists on hover (causes layout shift)
{isConsecutive && showActions && (
  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
  </span>
)}

// After - timestamp always exists, visibility controlled via opacity
{isConsecutive && (
  <span className={cn(
    "text-[10px] text-muted-foreground whitespace-nowrap transition-opacity",
    showActions ? "opacity-100" : "opacity-0"
  )}>
    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
  </span>
)}
```

This approach:
- Always renders the timestamp element (reserves space)
- Uses `opacity-0` / `opacity-100` to show/hide without affecting layout
- Adds smooth `transition-opacity` for a nice fade effect

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/team-chat/MessageItem.tsx` | Lines 67-71: Always render timestamp, use opacity for visibility |

---

## Expected Result

- No layout shift when hovering over messages
- Timestamp fades in smoothly on hover
- All rows maintain consistent height
