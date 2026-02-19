

## Move Greeting from Command Center into Sidebar

### What Changes
The "Another strong day, Eric" greeting and subtitle will be removed from the top of the Command Center page and placed inside the sidebar, directly below the logo. It will animate in on load and automatically fade out after 7 seconds.

### Changes

**1. `src/components/dashboard/SidebarNavContent.tsx` -- Add greeting below logo**
- Accept new props: `greeting`, `subtitle`, `firstName` (passed from DashboardLayout)
- Below the logo `div` (after line 346), insert a new animated greeting block that:
  - Uses `AnimatePresence` + `motion.div` to fade/slide in
  - Uses a `useState` + `useEffect` with a 7-second `setTimeout` to trigger exit
  - Displays the greeting text and subtitle in a compact format (smaller than the current page heading)
  - Hides when sidebar is collapsed
  - Respects `prefers-reduced-motion`

**2. `src/pages/dashboard/DashboardHome.tsx` -- Remove greeting from page**
- Remove the greeting header block (lines 272-290) containing the h1 and subtitle paragraph
- Keep the action buttons row (AIInsightsDrawer, AnnouncementsDrawer) -- they stay on the page
- The `greeting`, `subtitle`, and `firstName` state/logic stays in this file but will also need to be lifted or duplicated into the sidebar

**3. `src/components/dashboard/DashboardLayout.tsx` -- Pass greeting data to sidebar**
- Compute the greeting, subtitle, and firstName in the layout (or pass from auth context)
- Forward these as props to `SidebarNavContent`

### Technical Detail: Greeting in Sidebar

The greeting block will sit between the logo section and the announcements widget. It will look something like:

```
[Logo]
─────────────
"Another strong day, Eric"
"Let's see where things stand"    <- fades out after 7s
─────────────
[Announcements Widget]
[Nav items...]
```

Animation: `opacity 0 -> 1` on mount, then after 7s, `opacity 1 -> 0` + `height auto -> 0` exit. The border-bottom on the greeting container also animates away cleanly.

### Files Modified
- `src/components/dashboard/SidebarNavContent.tsx` -- add greeting UI
- `src/pages/dashboard/DashboardHome.tsx` -- remove greeting from page body
- `src/components/dashboard/DashboardLayout.tsx` -- compute and pass greeting props to sidebar
