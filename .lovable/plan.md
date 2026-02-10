

# Announcements: Expandable Card Instead of Drawer

Replace the Sheet-based announcements drawer with an inline expandable/collapsible card that lives in the dashboard flow. The button morphs into a full card with a smooth animation, and auto-expands when new announcements arrive.

## How It Works

1. **Collapsed state**: The same outline button sits next to AI Insights (unchanged appearance)
2. **Expanded state**: The button smoothly transforms into a full-width dashboard card showing the announcements list -- matching the visual style of other dashboard cards (rounded-2xl, shadow, "lit from above" gradient accent)
3. **Auto-expand**: When new unread announcements are detected, the card auto-expands and stays open until the user manually collapses it
4. **Collapse**: Clicking an "X" or collapse button shrinks it back to the button

## Animation

Using `framer-motion` `AnimatePresence` + `layout` animation:
- The button has `layoutId="announcements-widget"` 
- The expanded card shares the same `layoutId`, so framer-motion automatically interpolates size, position, and border-radius
- The card content fades in with a slight delay (`opacity` transition after the layout animation settles)
- Collapse reverses the animation smoothly

## Changes

### 1. `src/components/dashboard/AnnouncementsDrawer.tsx` -- Full Rewrite as `AnnouncementsWidget`

- Rename component to `AnnouncementsWidget` (update export name)
- Remove all `Sheet` usage -- replace with inline `motion.div` card
- **Collapsed state**: Render a `motion.div` with `layoutId="announcements-widget"` styled as the current outline button (gap-2 h-9, tinted megaphone icon, unread badge)
- **Expanded state**: Render a `motion.div` with the same `layoutId` styled as a full dashboard card:
  - `rounded-2xl shadow-lg border border-border/40 bg-card`
  - Top gradient accent line (matching other primary cards)
  - Header: luxury dot + "ANNOUNCEMENTS" label + location filter + leadership links + collapse (X) button
  - Scrollable announcement list (reuse existing card markup)
  - Footer: "View All Announcements" link
- **Auto-expand logic**: Track the latest announcement ID in a ref. When the unread count increases or a new ID appears, set expanded to true automatically. Only auto-collapse is NOT done -- user must manually collapse.
- **Mark as read**: Trigger when card expands (same logic as current drawer)
- Content items fade in with `staggerChildren` after expansion

### 2. `src/pages/dashboard/DashboardHome.tsx`

- Update import from `AnnouncementsDrawer` to `AnnouncementsWidget`
- In the `ai_insights` section, replace `<AnnouncementsDrawer>` with `<AnnouncementsWidget>`
- The widget will expand inline within the dashboard flow, pushing content below it down (natural document flow)

### 3. Visual Design (Expanded Card)

- Matches other dashboard cards: `rounded-2xl shadow-lg bg-card`
- Top accent: `h-px bg-gradient-to-r from-transparent via-border/40 to-transparent`
- Header row: oat dot + "ANNOUNCEMENTS" in `font-display text-xs tracking-[0.15em]` + location filter + X button
- Max height with scroll: `max-h-[500px]` with `ScrollArea`
- Announcement items: same styling as current drawer (priority left border, pin icon, link buttons)

## Technical Details

### Animation Implementation

```text
Collapsed:
  motion.div layoutId="announcements-widget"
    -> styled as Button (h-9, rounded-md, border, inline-flex)
    -> contains icon + label + badge

Expanded:
  motion.div layoutId="announcements-widget"  
    -> styled as Card (rounded-2xl, shadow-lg, w-full, border)
    -> AnimatePresence for inner content (fade + stagger)
    -> contains header, list, footer
```

framer-motion's `layoutId` handles the morph between these two shapes automatically -- interpolating width, height, border-radius, and position.

### Auto-Expand Logic

- Store `lastSeenAnnouncementId` in a ref
- Subscribe to realtime changes on the `announcements` table
- When new announcement detected (new ID at top of list) AND card is collapsed, auto-expand
- Do NOT auto-collapse -- user controls collapse manually
- On collapse, update the ref so the same announcement doesn't re-trigger expansion

### Files Modified
- `src/components/dashboard/AnnouncementsDrawer.tsx` -- rewritten as `AnnouncementsWidget`
- `src/pages/dashboard/DashboardHome.tsx` -- update import and usage

### No Breaking Changes
- All data fetching, mark-as-read, location filtering, and leadership links remain
- `useUnreadAnnouncementCount` hook unchanged
- `AnnouncementsBento` component unchanged (still available elsewhere)
- Dashboard layout ordering unaffected -- widget stays in the `ai_insights` section slot
