
# Fix "0" Appearing Below Each Message

## Problem Identified

Every message in the chat displays a "0" directly below it. This is a classic React rendering bug with the `&&` operator.

## Root Cause

In `MessageItem.tsx` on line 109:

```tsx
{message.reply_count && message.reply_count > 0 && (
```

When `message.reply_count` is `0`:
- JavaScript evaluates `0 && anything` as `0` (short-circuit returns the falsy value)
- React renders the number `0` as the string "0" in the DOM

This is a well-known React gotcha - the `&&` operator with numbers can leak falsy values into the rendered output.

## Solution

Change the condition to explicitly check for greater than zero first, avoiding the short-circuit behavior:

```tsx
// Before (buggy)
{message.reply_count && message.reply_count > 0 && (

// After (fixed)
{message.reply_count > 0 && (
```

Since `reply_count` is always a number (defaulted to `0` in the hook), checking `> 0` is sufficient and avoids the short-circuit issue.

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/team-chat/MessageItem.tsx` | Line 109: Change `{message.reply_count && message.reply_count > 0 && (` to `{message.reply_count > 0 && (` |

---

## Expected Result

After the fix:
- The "0" will no longer appear below messages
- Reply counts will only display when there are actual replies (1 or more)
- Messages will show clean with just content, reactions, and timestamps
