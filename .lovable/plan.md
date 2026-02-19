

## Match Sidebar Card Styling and Make Collapsed Nav Fully Round

### Problem
1. The collapsed sidebar's fill color (`bg-card`) and border stroke (`border-border/30`) don't match the card styling used elsewhere (cards use `bg-card/80 backdrop-blur-xl border-border/50`)
2. The collapsed sidebar uses `rounded-xl` -- it should be fully round (`rounded-full`) to echo the top nav bar's pill aesthetic
3. Internal buttons and hover states use `rounded-lg` -- these need to become `rounded-full` when collapsed to fit the pill-shaped container

### Changes

**File: `src/components/dashboard/DashboardLayout.tsx`** (sidebar `<aside>`)
- Change collapsed border from `border-border/30` to `border-border/50` to match cards
- Change collapsed background from `bg-card` to `bg-card/80 backdrop-blur-xl backdrop-saturate-150` to match the expanded state and top nav bar
- Add conditional rounding: `rounded-full` when collapsed, `rounded-xl` when expanded

**File: `src/components/dashboard/SidebarNavContent.tsx`** (internal elements)
- NavLink: Change `rounded-lg` to `rounded-full` when `isCollapsed` is true (line ~277)
- Popover section buttons: Change `rounded-lg` to `rounded-full` when collapsed (line ~654)
- Onboarding link: Change `rounded-lg` to `rounded-full` when collapsed (line ~411)
- Expand button: Change `rounded-md` to `rounded-full` (line ~357)
- Logo initials fallback: Change `rounded` to `rounded-full` (line ~332)
- Footer containers (`mx-3 rounded-lg`): Change to `rounded-full` when collapsed (lines ~742, ~748)
- Beta badge collapsed: Already `rounded-full` -- no change needed
- Clock and Lock buttons: Change `rounded-lg` to `rounded-full` when collapsed (these are in separate components `SidebarClockButton.tsx` and `SidebarLockButton.tsx`)

**File: `src/components/dashboard/SidebarClockButton.tsx`**
- Add conditional `rounded-full` (vs `rounded-lg`) based on `isCollapsed` prop

**File: `src/components/dashboard/SidebarLockButton.tsx`**
- Add conditional `rounded-full` (vs `rounded-lg`) based on `isCollapsed` prop

### Summary of Visual Changes
- Collapsed sidebar becomes a tall pill shape with matching card fill and border
- All internal interactive elements (nav icons, buttons, footer containers) become circular/pill-shaped when collapsed
- Expanded sidebar remains unchanged (`rounded-xl`)

### Files Modified
- `src/components/dashboard/DashboardLayout.tsx`
- `src/components/dashboard/SidebarNavContent.tsx`
- `src/components/dashboard/SidebarClockButton.tsx`
- `src/components/dashboard/SidebarLockButton.tsx`
