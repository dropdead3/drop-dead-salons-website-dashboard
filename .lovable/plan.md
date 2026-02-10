

# Collapsible Announcements Widget -- Right-Side Panel

Transform the announcements from an inline dashboard section into a collapsible floating widget card anchored to the right side of the dashboard, with a notification badge showing unseen announcement count.

## How It Works

- A small floating trigger button sits fixed on the right edge of the dashboard content area (not the full viewport -- inside the main content column)
- Clicking it slides open a sleek announcements panel from the right
- An unread count badge (red circle with number) appears on the trigger when there are unseen announcements
- Opening the panel marks announcements as read and clears the badge
- The panel can be collapsed back by clicking the trigger again or an X button

## Changes Overview

### 1. New Hook: `useUnreadAnnouncementCount`
Create a lightweight hook that returns only the unread **announcement** count (not combined with notifications like the existing `useUnreadAnnouncements` hook). This keeps concerns separate and avoids coupling notification counts to the announcements widget badge.

- Queries `announcements` table for active, non-expired announcements accessible to the user
- Cross-references with `announcement_reads` for the current user
- Returns the count of unread announcements only
- Refetches every 30 seconds

### 2. New Component: `AnnouncementsDrawer`
A collapsible right-side drawer/panel that wraps the existing `AnnouncementsBento` content logic.

**Trigger button:**
- Fixed position at the right edge of the dashboard content area
- Megaphone icon with the luxury oat dot accent
- Red notification badge with unread count (hidden when 0)
- Smooth scale-in animation on the badge

**Panel:**
- Slides in from the right using framer-motion (`translateX` animation)
- Same premium card styling: `rounded-2xl shadow-2xl backdrop-blur-xl`
- Contains the announcement list (reuses existing announcement card markup)
- Location filter dropdown at the top
- "Manage" and "Create" links for leadership
- "View All" link at the bottom
- Closes on trigger click or X button

### 3. Update `DashboardHome.tsx`
- Remove the inline `announcements` section from `sectionComponents`
- Add the `AnnouncementsDrawer` as a fixed-position element within the dashboard page (outside the staggered sections flow)
- Move the "mark as read" logic into the drawer's open handler instead of on-mount
- Pass the same props (announcements data, isLeadership) to the new drawer

### 4. Keep `AnnouncementsBento.tsx` As-Is
The existing component stays available for any other pages that might use it. The new drawer component will contain its own streamlined announcement list rendering.

---

## Technical Details

### New File: `src/hooks/useUnreadAnnouncementCount.ts`
- Similar to `useUnreadAnnouncements` but returns only announcement count (excludes notifications)
- Query key: `['unread-announcement-count', user?.id, assignedLocationIds, canViewAllLocations]`
- Filters by location access, cross-references `announcement_reads`

### New File: `src/components/dashboard/AnnouncementsDrawer.tsx`
- Uses `useState` for open/closed state
- Uses `framer-motion` `AnimatePresence` for slide-in/out
- Trigger: `fixed` or `absolute` positioned button at right edge, vertically centered
- Panel: slides from right with `initial={{ x: '100%' }}` `animate={{ x: 0 }}`
- On open: calls a `markAsRead` function and invalidates `unread-announcement-count`
- Badge: `absolute -top-1 -right-1` red circle with count, `scale` entrance animation
- Renders announcement cards with same priority colors, pin icons, link buttons
- Includes location filter, leadership manage/create links

### Modified File: `src/pages/dashboard/DashboardHome.tsx`
- Remove `announcements` key from `sectionComponents` map (or render null)
- Add `<AnnouncementsDrawer>` component after the `motion.div` wrapper but still inside `<DashboardLayout>`
- Move the `markAsRead` `useEffect` logic into the drawer component
- Keep the announcements query in DashboardHome and pass data down, OR move the query into the drawer itself for full encapsulation (cleaner)

### Visual Design
- Trigger button: `w-12 h-12 rounded-full shadow-lg bg-card border border-border/40` with megaphone icon
- Badge: `w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-medium`
- Panel: `w-[380px] max-h-[80vh]` with `rounded-2xl shadow-2xl` and scroll area for content
- Panel header: luxury accent dot + "ANNOUNCEMENTS" in `font-display text-xs tracking-[0.15em]`
- Backdrop: optional subtle overlay or none (panel floats over content)

### Position Strategy
- The trigger and panel are positioned `fixed` to the right side of the viewport but offset to account for the sidebar width
- Uses `right-6 lg:right-8` and `top-1/2 -translate-y-1/2` for vertical centering of trigger
- Panel anchors from `right-0 top-0 bottom-0` or a centered card variant

### No Breaking Changes
- Existing `AnnouncementsBento` component untouched (available for reuse elsewhere)
- `useUnreadAnnouncements` hook untouched (still used by sidebar/top bar notification bell)
- All announcement data fetching, read-tracking, and location filtering logic preserved
- Dashboard layout ordering system unaffected -- announcements simply moves from inline to floating
