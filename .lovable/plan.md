
# Emoji Picker & Chat Enhancements

## Problem Summary

The emoji button (Smile icon) in the message input area doesn't do anything - it has **no onClick handler**. Additionally, the paperclip/attachment button is also non-functional. This plan fixes the emoji picker and adds several chat enhancements.

---

## Part 1: Emoji Picker for Message Input

### Current State
- Line 109-110 in `MessageInput.tsx`: `<Button variant="ghost" size="icon" disabled={!canSend}><Smile /></Button>` - **no onClick handler**
- Message reactions work fine with a quick reactions popover (6 emojis)
- No full emoji picker installed

### Solution

Install `emoji-picker-react` (most popular React emoji picker with 578k weekly downloads) and create an `EmojiPickerPopover` component that can be reused.

**Installation:**
```bash
npm install emoji-picker-react
```

**New Component: `EmojiPickerPopover.tsx`**
- Wraps `emoji-picker-react` in a Radix Popover
- Supports themes (light/dark) via `next-themes`
- Emits selected emoji to parent
- Configurable: show/hide search, categories, skin tone picker

**Integration in `MessageInput.tsx`:**
```typescript
<EmojiPickerPopover onEmojiSelect={insertEmoji}>
  <Button variant="ghost" size="icon" disabled={!canSend}>
    <Smile className="h-5 w-5" />
  </Button>
</EmojiPickerPopover>
```

The `insertEmoji` function will insert the selected emoji at the cursor position in the contenteditable editor.

---

## Part 2: Enhanced Message Reactions

### Current State
- Quick reactions limited to 6 emojis: 👍 ❤️ 😂 😮 😢 🎉
- No way to add custom emoji reactions

### Enhancement

Add a "+" button after the quick reactions that opens the full emoji picker:

```text
┌─────────────────────────────────────┐
│  👍  ❤️  😂  😮  😢  🎉  [+]      │
└─────────────────────────────────────┘
                              ↓
              Full emoji picker popover
```

**Files to update:**
- `MessageItem.tsx` - Add the "+" button with `EmojiPickerPopover`
- `ThreadMessageItem.tsx` - Same enhancement for thread reactions

---

## Part 3: File Attachments (Optional Enhancement)

### Current State
- Paperclip button exists but has no functionality
- `AttachmentDisplay.tsx` component exists (ready to display attachments)
- Settings for file attachments exist (`allow_file_attachments`, `max_file_size_mb`)
- Storage bucket should exist for chat attachments

### Implementation

Create a file upload hook and connect it to the Paperclip button:

1. **New hook: `useChatAttachments.ts`**
   - Upload files to Supabase Storage
   - Track upload progress
   - Return file URL for embedding in messages

2. **Update `MessageInput.tsx`:**
   - Add hidden file input
   - Paperclip button triggers file picker
   - Show attachment preview before sending
   - Include attachment metadata in message

---

## Part 4: Fix Console Warning

### Problem
```
Warning: Function components cannot be given refs. Did you mean to use React.forwardRef()?
Check the render method of `MessageItem`.
```

This occurs because `DropdownMenu` is being used without proper ref handling.

### Fix

Wrap the `MessageItem` component with `React.forwardRef` or ensure the DropdownMenuTrigger has a proper child that accepts refs.

---

## Implementation Plan

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/team-chat/EmojiPickerPopover.tsx` | Reusable emoji picker in popover |
| `src/hooks/team-chat/useChatAttachments.ts` | File upload handling |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/team-chat/MessageInput.tsx` | Add emoji picker to Smile button, wire up Paperclip |
| `src/components/team-chat/MentionInput.tsx` | Add `insertText` method for emoji insertion |
| `src/components/team-chat/MessageItem.tsx` | Add full emoji picker option, fix ref warning |
| `src/components/team-chat/ThreadMessageItem.tsx` | Add full emoji picker option |

---

## Technical Details

### Emoji Insertion Logic

For the contenteditable editor in `MentionInput.tsx`:

```typescript
const insertEmoji = (emoji: string) => {
  if (!editorRef.current) return;
  
  editorRef.current.focus();
  const selection = window.getSelection();
  if (!selection) return;
  
  // Get current range or create one at end
  let range: Range;
  if (selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
    range = selection.getRangeAt(0);
  } else {
    range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
  }
  
  // Insert emoji
  const textNode = document.createTextNode(emoji);
  range.insertNode(textNode);
  
  // Move cursor after emoji
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  
  setIsEmpty(false);
};
```

### EmojiPickerPopover Component

```typescript
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface EmojiPickerPopoverProps {
  children: React.ReactNode;
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPickerPopover({ children, onEmojiSelect }: EmojiPickerPopoverProps) {
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" side="top">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
          lazyLoadEmojis
          skinTonesDisabled
        />
      </PopoverContent>
    </Popover>
  );
}
```

---

## Expected Behavior

| Action | Result |
|--------|--------|
| Click Smile button in message input | Opens full emoji picker, inserts emoji at cursor |
| Click "+" in message reaction popover | Opens full emoji picker for custom reactions |
| Click Paperclip button | Opens file picker, shows preview before send |
| Send message with attachment | Message includes file link/preview |

---

## Summary

This plan delivers:
1. **Working emoji picker** for the message input
2. **Extended reactions** with full emoji selection
3. **File attachment support** (bonus enhancement)
4. **Console warning fix** for better DX
