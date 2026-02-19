
## Align Top Bar Sticky Position with Sidebar

### Problem
When scrolling down, the top bar sticks at `top-0` (flush with the viewport edge), while the sidebar floats with `top-3` (12px from the top). This creates a visual misalignment -- the sidebar has breathing room above it but the top bar does not.

### Fix
One line change in `src/components/dashboard/DashboardLayout.tsx`:

Change `sticky top-0` to `sticky top-3` on the desktop top bar wrapper (line 1079).

This gives the top bar the same 12px top offset as the sidebar when it becomes sticky on scroll, so both elements appear visually aligned at the top of the viewport.

### Technical Detail
- File: `src/components/dashboard/DashboardLayout.tsx`
- Line ~1079: Change `"dashboard-top-bar hidden lg:block sticky top-0 z-30 mx-3 mt-3"` to `"dashboard-top-bar hidden lg:block sticky top-3 z-30 mx-3 mt-3"`
