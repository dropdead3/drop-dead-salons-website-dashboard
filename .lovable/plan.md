
## Move Help Center into Feedback Bento Buttons (3 across)

### What Changes
The Help Center button (currently its own section in the sidebar nav area) will be removed from there and added as a third icon button alongside the Feature Request and Bug Report buttons in the bento grid at the bottom of the sidebar. The layout will go from 2 icons across to 3.

### Changes

**1. `src/components/dashboard/SidebarFeedbackButtons.tsx` -- Add Help Center as third button**
- Import `HelpCircle` from lucide-react and `Link` from react-router-dom
- Add a third button (using a `Link` to `/dashboard/help`) with `HelpCircle` icon and tooltip "Help Center"
- The three buttons will sit evenly in a row (or column when collapsed), matching the existing styling

**2. `src/components/dashboard/SidebarNavContent.tsx` -- Remove standalone Help Center link**
- Remove the entire Help Center `div` block (lines 372-409) that was added in the previous change
- Clean up the `HelpCircle` import if no longer used in this file
- The `Link` import should remain since it is used elsewhere

### Result
The bottom bento area will show three evenly spaced icon buttons: Lightbulb (Feature Request), Bug (Bug Report), and HelpCircle (Help Center) -- matching the screenshot reference. The standalone Help Center nav link above the main navigation is removed.
