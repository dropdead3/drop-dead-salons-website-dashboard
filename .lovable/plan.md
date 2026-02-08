
# Add Secondary Color to Reply Indicator

## Goal

Use a secondary/muted color for the reply indicator text to visually separate it from the main message content. This creates a clear visual hierarchy between the message and its thread metadata.

## Current vs. Proposed

| Element | Current | Proposed |
|---------|---------|----------|
| Reply text color | `text-primary` (brand blue) | `text-muted-foreground` (secondary gray) |
| Reply hover state | `hover:underline` | `hover:text-foreground` (becomes primary on hover) |
| L-line connector | `border-muted-foreground/30` | Keep as-is |

## Implementation

### Changes to `MessageItem.tsx` (Line 144-150)

```tsx
// Before
<button
  onClick={onReply}
  className="flex items-center gap-1.5 text-sm text-primary hover:underline -mt-0.5"
>

// After
<button
  onClick={onReply}
  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -mt-0.5"
>
```

## Visual Result

- **Default state**: Reply indicator appears in a subtle gray (`text-muted-foreground`) that doesn't compete with message content
- **Hover state**: Text brightens to full foreground color (`hover:text-foreground`) to indicate interactivity
- **Smooth transition**: `transition-colors` for polished hover effect
- **Maintains clickability**: Still clearly a button with hover feedback

## File to Modify

| File | Change |
|------|--------|
| `src/components/team-chat/MessageItem.tsx` | Update reply button classes at line 146 |
