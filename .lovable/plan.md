
# Sticky Guidance: Auto-Expand and Improved Readability

## The Problem
When you click a link inside Zura's guidance to navigate to another dashboard page, the sticky panel appears at the bottom but starts **collapsed** -- showing only a tiny title bar. You lose sight of the actual instructions and have to manually click to expand. That defeats the purpose of keeping the guidance visible while you work.

## The Solution
Make the sticky guidance panel **start expanded** when you navigate from a guidance link, so the full advice text is immediately visible. Also improve the expanded view to be more readable and useful as a reference while working.

## Changes

### 1. Auto-expand on initial appearance
When the sticky panel first appears (user clicked a guidance link), it should default to **expanded** so the guidance text is immediately readable. The user can collapse it if they want more screen space.

**File:** `src/components/dashboard/ZuraStickyGuidance.tsx`
- Change the initial `expanded` state from `false` to `true`
- This single change means the panel opens showing the full guidance text instead of just the title bar

### 2. Respect sidebar offset
The sticky bar currently spans `left-0 right-0`, which means it sits under the sidebar. It should respect the sidebar width so it only covers the main content area.

**File:** `src/components/dashboard/ZuraStickyGuidance.tsx`
- Add a left offset matching the sidebar width (`left-72` or dynamic based on collapsed state) so the panel doesn't hide behind the sidebar

### 3. Add bottom padding to main content
When the sticky panel is expanded, it covers the bottom of the page content. Add padding to the main content area so nothing gets hidden behind it.

**File:** `src/components/dashboard/DashboardLayout.tsx`
- When `ZuraStickyGuidance` is visible and expanded, add bottom padding to the main content wrapper to prevent content from being obscured

## Technical Details

### ZuraStickyGuidance.tsx changes:
- `useState(false)` becomes `useState(true)` for the `expanded` state
- Add sidebar-aware left positioning (read the collapsed state from localStorage, same pattern used in `DashboardLayout`)
- Optionally reduce the max-height from `40vh` to `35vh` to keep a good balance between guidance visibility and page content

### DashboardLayout.tsx changes:
- Pass the sticky guidance visibility state down or use the existing `ZuraNavigationContext` to detect when the panel is showing
- Add a bottom padding spacer (`pb-48` or similar) to the main content area when the panel is expanded

These are small, targeted changes -- no new files, no new dependencies, no backend work.
