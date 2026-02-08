
# Fix @Mention Display in Chat Input

## The Problem
When you select a team member from the @mention dropdown, the input field shows the raw markdown format:
```
@[Alex Day](52c43316-2ba5-4367-96d4-f097f8a492ea)
```

Instead, you should see a clean, styled mention like `@Alex Day` that still contains the user ID when the message is sent.

## Solution: Contenteditable Rich Text Input

Since a plain `<textarea>` cannot style text differently, we need to switch to a **contenteditable div** approach. This allows us to:
- Display mentions as styled chips/badges (e.g., "@Alex Day" in a highlighted style)
- Keep the underlying data structure with user IDs for storage
- Maintain the same keyboard behavior (Enter to send, Shift+Enter for newlines)

## Implementation Steps

### 1. Create a new MentionInput component
Replace the textarea with a contenteditable div that:
- Accepts regular text input
- Renders selected mentions as styled spans (chips)
- Tracks mention data separately from the visible text
- Converts to the storage format `@[Name](id)` when sending

### 2. Mention chip rendering
When a user is selected from the autocomplete:
- Insert a styled, non-editable span showing just `@Alex Day`
- Store the user ID in a data attribute
- Style it with a subtle highlight (e.g., `bg-primary/10 text-primary rounded px-1`)

### 3. Extract mentions on send
When the user sends the message:
- Parse the contenteditable content
- Convert mention chips back to `@[DisplayName](userId)` format
- Send the properly formatted string to the backend

### 4. Handle edge cases
- Backspace should delete the entire mention chip (not character by character)
- Cursor navigation should treat mention chips as single units
- Copy/paste should preserve or strip mentions appropriately

---

## Technical Details

### New file: `src/components/team-chat/MentionInput.tsx`

This component will:
- Use `contentEditable="true"` with a `div` instead of textarea
- Maintain a state for both the raw HTML content and extracted mention data
- Handle `onInput` events to detect @triggers
- Render mentions as inline styled spans with `contentEditable="false"`
- Provide an `onSend` callback with the properly formatted message

### Key data flow:
```
User types "@Al" → Autocomplete opens → User selects "Alex Day"
                                              ↓
Input displays: "Hey @Alex Day " (styled chip)
                                              ↓
User hits Enter → onSend receives: "Hey @[Alex Day](uuid) "
```

### Changes to MessageInput.tsx:
- Replace `<Textarea>` with the new `<MentionInput>` component
- Remove the existing mention-related state (moved to new component)
- Pass `onSend` callback that calls `sendMessage`

### Styling for mention chips:
```tsx
<span
  contentEditable={false}
  data-mention-id={userId}
  data-mention-name={displayName}
  className="inline-flex items-center bg-primary/10 text-primary rounded px-1 mx-0.5 text-sm font-medium"
>
  @{displayName}
</span>
```

This approach keeps the UI clean for the user while preserving all the data needed for notifications and other backend processing.
