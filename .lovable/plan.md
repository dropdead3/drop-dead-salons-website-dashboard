

# Fix Chat Window to Fill Entire Viewport

## Problem
The chat window doesn't fill the full available height. The message input bar floats in the middle of the screen with empty space below it. This happens because the height chain from the layout root down to the chat container has gaps — specifically, the content wrapper duplicates `h-screen` without subtracting the top bar height, and intermediate `<main>` and wrapper divs don't properly propagate flex sizing.

## Solution
Ensure the full height chain flows correctly from the DashboardLayout down to the TeamChatContainer by making `<main>` and its inner wrappers proper flex participants.

## Technical Changes

### File: `src/components/dashboard/DashboardLayout.tsx`

1. **`<main>` element (~line 1207-1208)**: Add `h-full` alongside the existing `flex-1 min-h-0 overflow-hidden` when `hideFooter` is true, so it fills its flex parent.

2. **Inner content wrapper (~line 1210-1211)**: Ensure the div wrapping children uses `h-full flex flex-col` when `hideFooter` is true, so it stretches and passes height down.

3. **Content div (~line 1215)**: Confirm `h-full` is applied and remove any conflicting `flex-1` that might cause sizing ambiguity. Ensure it has `overflow-hidden` when `hideFooter` to prevent content from overflowing rather than scrolling internally.

### File: `src/components/team-chat/TeamChatContainer.tsx`

4. **Chat layout root**: Confirm the chat container uses `h-full` (already present) so it inherits the full height from the layout.

These changes create an unbroken height chain: `h-screen` (root) -> `flex flex-col` (wrapper) -> `shrink-0` (top bar) -> `flex-1 min-h-0 h-full` (main) -> `h-full` (inner divs) -> `h-full` (chat container) -> `flex-1` (message list) + auto (message input at bottom).
