
# Enhance @Mention Display in Messages

## Current Issue
The @mention in chat messages uses only `text-primary font-medium`, which doesn't visually separate it enough from the surrounding text. Users may miss that someone has been tagged.

## Solution: Styled Pill/Badge for Mentions
Apply a background color and padding to make mentions look like distinct, interactive tags - similar to how Slack displays them.

## Visual Result
Before: `@Alex Day yo can you see this` (just colored text)
After: `@Alex Day` appears as a pill/badge with background, clearly separated from "yo can you see this"

## Technical Changes

### File: `src/components/team-chat/MentionAutocomplete.tsx`

Update the `renderContentWithMentions` function (lines 96-100):

**Current:**
```tsx
<span key={match.index} className="text-primary font-medium">
  @{match[1]}
</span>
```

**New:**
```tsx
<span 
  key={match.index} 
  className="inline-flex items-center bg-primary/15 text-primary rounded px-1.5 py-0.5 text-sm font-medium mx-0.5"
>
  @{match[1]}
</span>
```

## Styling Breakdown
- `bg-primary/15` - Subtle background tint using the primary color at 15% opacity
- `rounded` - Rounded corners for the pill shape
- `px-1.5 py-0.5` - Horizontal and vertical padding to give it breathing room
- `mx-0.5` - Small horizontal margin to separate from adjacent text
- `inline-flex items-center` - Ensures proper vertical alignment with surrounding text
- `text-sm font-medium` - Consistent text sizing and weight

This matches the styling used in the input field's mention chips, creating a consistent experience from composing to viewing messages.
