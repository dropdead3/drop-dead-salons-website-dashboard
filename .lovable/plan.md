
## Move Beta Badge to Sidebar (Above Feedback Buttons)

### What Changes
The beta badge will be removed from the top menu bar and placed in the sidebar, directly above the feedback bento buttons. The text will change from "BETA" to "Beta Testing V.1.1".

### Changes

**1. `src/components/dashboard/DashboardLayout.tsx` -- Remove beta badge from top bar**
- Delete the beta badge block (lines 1147-1156): the `Tooltip` wrapping the amber pill with `FlaskConical` icon and "BETA" text
- Clean up `FlaskConical` import if no longer used in this file (it is used elsewhere for test accounts tab, so it stays)

**2. `src/components/dashboard/SidebarNavContent.tsx` -- Add beta badge above feedback buttons**
- Import `FlaskConical` from lucide-react
- Before the `SidebarFeedbackButtons` container (line 639), add a centered beta badge pill styled with the same amber glass aesthetic (amber-500/15 bg, amber-600 text, amber-500/30 border)
- When expanded: show full "Beta Testing V.1.1" text with FlaskConical icon
- When collapsed: show just the FlaskConical icon with a tooltip

### Result
The top bar loses the beta badge, making it cleaner. The sidebar bottom area will show: beta badge pill, then feedback bento buttons, then clock/lock buttons.
