

# Fix Team Chat Full-Screen Sizing Gaps

## Problem
The Team Chat has visible gaps and doesn't fill the full viewport. The root cause is **`App.css`** applying `max-width: 1280px`, `padding: 2rem`, and `text-align: center` to `#root` -- these global styles constrain the entire app layout and add unwanted padding around the chat interface.

## Changes

### 1. Clean up `src/App.css`
Remove the legacy `#root` styles (`max-width`, `padding`, `margin`, `text-align`) that are constraining the layout. These are leftover Vite template defaults and conflict with the full-screen dashboard layout. Other unused styles (`.logo`, `.card`, `.read-the-docs`) can also be cleaned out since the app uses Tailwind exclusively.

### 2. Ensure `TeamChatContainer` fills height properly
Verify the height chain is unbroken:
- `DashboardLayout(hideFooter)` sets `h-screen overflow-hidden` and passes `h-full` down through `main`
- The TeamChat page wrapper `div.h-full.overflow-hidden` connects to...
- `TeamChatContainer` root `div.flex.h-full` connects to...
- Main column `div.flex-1.flex.flex-col.min-w-0` where `MessageList(flex-1)` expands and `MessageInput` pins to the bottom

The CSS cleanup in step 1 should resolve the visible gaps. No structural changes needed to the chat components themselves.

## Technical Details

**File: `src/App.css`**
- Remove or neutralize the `#root` block that sets `max-width: 1280px`, `margin: 0 auto`, `padding: 2rem`, and `text-align: center`
- Remove unused `.logo`, `.card`, `.read-the-docs`, and `@keyframes logo-spin` rules (Vite boilerplate)
- Keep file minimal or empty since Tailwind handles all styling

This is a single-file CSS-only change with no component modifications required.

