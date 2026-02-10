

# Move Announcements Trigger Next to AI Insights Button

Replace the floating action button (FAB) with an inline button that matches the AI Insights trigger style, placed right next to it.

## How It Will Look

The two buttons will sit side-by-side as a button group in the `ai_insights` dashboard section:

```text
[Brain Icon] AI Insights  [Sentiment]    [Megaphone Icon] Announcements  [3]
```

Both buttons share the same `variant="outline"` style, `h-9` height, icon-in-tinted-container pattern, and `font-display tracking-wide` label text. The red unread badge sits inline as a small pill (like the sentiment indicator on AI Insights).

## Changes

### 1. `src/components/dashboard/AnnouncementsDrawer.tsx`
- Remove the fixed FAB trigger button (the `fixed right-6 top-1/2` circle button)
- Extract the drawer panel into its own export, controlled by an `open` / `onOpenChange` prop pair
- Export a new `AnnouncementsTrigger` component -- a `Button variant="outline"` with `gap-2 h-9` matching `AIInsightsTrigger`:
  - Tinted icon container: `w-5 h-5 rounded-md bg-gradient-to-br from-amber-500/20 to-orange-500/20` with a `Megaphone` icon
  - Label: `"Announcements"` in `text-sm font-display tracking-wide`
  - Unread badge: a small `bg-red-500 text-white rounded-full` pill showing the count (hidden when 0), replacing the animated FAB badge
- Use `Sheet` (same as AI Insights) instead of the custom framer-motion drawer, for visual consistency
- Keep all existing drawer content (header, location filter, announcement list, leadership links, mark-as-read logic)

### 2. `src/pages/dashboard/DashboardHome.tsx`
- Update the `ai_insights` section to render both buttons in a flex row:
  ```
  <div className="flex items-center gap-2">
    <AIInsightsDrawer />
    <AnnouncementsDrawer isLeadership={isLeadership} />
  </div>
  ```
- Remove the standalone `<AnnouncementsDrawer />` from below the `motion.div` (line 261)
- The announcements drawer is now visible to everyone (not just leadership), but the AI Insights button remains leadership-only. The section wrapper will need adjustment so the announcements button still shows for non-leadership users.

### 3. Visual Consistency
- Both triggers: `Button variant="outline" className="gap-2 h-9"`
- Both use a `w-5 h-5 rounded-md` tinted icon container
- Both use `text-sm font-display tracking-wide` for labels
- Announcements unread badge mirrors the AI Insights sentiment indicator position (inline, right side of button)

### No Breaking Changes
- All drawer content, mark-as-read logic, location filtering, and leadership links remain unchanged
- Only the trigger presentation and positioning changes
- Dashboard layout ordering system unaffected
