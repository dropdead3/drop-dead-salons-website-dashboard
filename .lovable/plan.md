
# Fix Timestamp Line Breaking

## Problem

The timestamp shown for consecutive messages (e.g., "10:48 AM") is breaking into two lines because:
1. The container `div` has `w-10` (40px) which is too narrow
2. The timestamp `span` doesn't have `whitespace-nowrap`

## Solution

Two small changes to `MessageItem.tsx`:

1. **Increase container width** from `w-10` to `w-12` (48px) - enough for "10:48 AM" format
2. **Add `whitespace-nowrap`** to the timestamp span to prevent wrapping

### Code Changes

**Line 60**: Change container width
```tsx
// Before
<div className="w-10 shrink-0">

// After
<div className="w-12 shrink-0">
```

**Line 68**: Add nowrap to timestamp
```tsx
// Before
<span className="text-[10px] text-muted-foreground">

// After
<span className="text-[10px] text-muted-foreground whitespace-nowrap">
```

Also update the Avatar size on line 62 to match:
```tsx
// Before
<Avatar className="h-10 w-10">

// After
<Avatar className="h-12 w-12">
```

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/team-chat/MessageItem.tsx` | Lines 60, 62, 68: Increase width and add whitespace-nowrap |

---

## Expected Result

- Timestamps like "10:48 AM" will stay on a single line
- Avatar size will increase slightly to match the new column width
- Clean, consistent layout for all messages
