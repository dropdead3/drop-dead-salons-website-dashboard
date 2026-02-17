

# Add Right Border to Chat Sidebar

## What Changes
Add a right border stroke to the sidebar container to visually separate it from the main chat window, matching the bottom border already on the channel header.

## Technical Detail

**File: `src/components/team-chat/TeamChatContainer.tsx`**
- Add `border-r border-border/50` to the desktop sidebar wrapper (line 21) so it gains a right-side stroke line.
- The `border-border/50` token matches the existing header border for visual consistency.

