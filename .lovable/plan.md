

## Make the Sidebar a Bento-Style Floating Card

### Current State
The sidebar is a full-height fixed panel pinned to the left edge with `border-r border-border bg-card/90 backdrop-blur-xl`. It stretches from top to bottom with no margin or rounding -- a traditional sidebar.

### Target (from Retropay reference)
A floating, rounded card that sits on top of the cream background with visible margin on all sides. The sidebar becomes a "bento tile" rather than a structural panel.

### Changes

**1. `src/components/dashboard/DashboardLayout.tsx` (Desktop Sidebar aside element)**

Update the `<aside>` wrapper (line ~830-834):
- Remove `border-r border-border` (the card's own border replaces this)
- Add vertical and left margin: `m-3` (12px breathing room from viewport edges)
- Add rounding: `rounded-2xl`
- Add explicit border: `border border-border/50`
- Adjust height: `lg:inset-y-0` becomes custom top/bottom with margin (`lg:top-3 lg:bottom-3 lg:left-0`) instead of `lg:inset-y-0`
- Keep `bg-card/90 backdrop-blur-xl`
- Add `overflow-hidden` so child content respects the rounded corners

The aside changes from:
```
lg:inset-y-0 lg:left-0 lg:border-r lg:border-border lg:bg-card/90 lg:backdrop-blur-xl
```
To:
```
lg:top-3 lg:bottom-3 lg:left-3 lg:border lg:border-border/50 lg:rounded-2xl lg:bg-card/90 lg:backdrop-blur-xl lg:overflow-hidden lg:shadow-sm
```

Width stays the same (`w-72` expanded, `w-16` collapsed).

**2. Content offset adjustment**

The main content area currently uses `lg:pl-72` or `lg:pl-16` to account for the sidebar width. With the 12px left margin on the sidebar, the padding-left needs to increase by 12px (the left margin) + ~12px (the right gap between sidebar and content):
- Expanded: `lg:pl-72` becomes `lg:pl-[312px]` (288px sidebar + 24px total margin)
- Collapsed: `lg:pl-16` becomes `lg:pl-[88px]` (64px sidebar + 24px total margin)

**3. `src/components/dashboard/SidebarNavContent.tsx` (Inner content)**

Minor tweaks to the inner content to complement the bento look:
- Remove the bottom border from the logo section header (line 313) since the card itself provides the structural boundary. Keep a subtle `border-b border-border/30` for internal separation.
- The footer section (lines 625-641) already has rounded containers with `bg-muted/30` which will look great inside the bento card.

### What This Achieves
- The sidebar visually "floats" on the cream background as a bento tile
- Rounded corners and subtle shadow give it depth and premium feel
- The cream background peeks through on all sides of the sidebar
- Matches the Retropay reference aesthetic
- Mobile sidebar (Sheet) is unaffected -- this only changes the desktop fixed sidebar
