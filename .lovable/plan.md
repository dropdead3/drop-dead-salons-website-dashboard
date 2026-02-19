

## Add Help Center Button to Sidebar, Remove from Top Bar

### What Changes
The Help Center button will be added to the sidebar navigation (below the greeting/announcements area) and removed from the top menu bar where it currently lives.

### Changes

**1. `src/components/dashboard/SidebarNavContent.tsx` -- Add Help Center link below announcements**
- Import `HelpCircle` from lucide-react
- After the `SidebarAnnouncementsWidget` (line 370), add a Help Center link button
- When collapsed, show just the icon with a tooltip; when expanded, show icon + label
- Style consistently with other sidebar elements (muted foreground, hover state)

**2. `src/components/dashboard/DashboardLayout.tsx` -- Remove Help Center from top bar**
- Remove the standalone Help Center icon button (lines 1242-1259) that shows on xl+ screens
- Remove the Help Center dropdown menu item (lines 1232-1237) from the user/admin dropdown
- Clean up the `HelpCircle` import if no longer used elsewhere in the file

### Result
The Help Center gets a persistent, visible home in the sidebar instead of being tucked away in the top bar. One less icon in the top bar, cleaner layout. The sidebar link works in both expanded and collapsed states.
