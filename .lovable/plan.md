
# Add "Send DM" Link to Birthday Banner

## What This Does
Each person's name pill in the birthday announcement banner becomes clickable. Clicking it creates (or opens) a DM channel with that person and navigates to Team Chat, making it easy to send a birthday wish directly.

## User Experience
- Each birthday person's pill gets a subtle message icon and a hover effect indicating it's clickable
- Clicking navigates to `/dashboard/team-chat` with the DM channel auto-selected
- If it's the current user's own birthday (in View As mode), the DM link is not shown
- The "Wish them a happy birthday!" text on the right stays as-is

## Technical Changes

### File: `src/components/dashboard/TodaysBirthdayBanner.tsx`
1. Import `useNavigate` from `react-router-dom`, `MessageCircle` from `lucide-react`, and `useDMChannels` hook
2. Add `useNavigate` and `useDMChannels` hooks inside the component
3. Add an `onClick` handler to each person's pill `div` that:
   - Calls `createDM(person.user_id)` to get or create the DM channel
   - Navigates to `/dashboard/team-chat?channel={channelId}`
4. Add `cursor-pointer hover:bg-background/30` classes to the pill for hover feedback
5. Add a small `MessageCircle` icon next to the person's name (visible on hover or always)
6. Skip making the pill clickable if `person.isCurrentUser` (can't DM yourself)

### No other files need changes
- `useDMChannels` already handles finding existing DMs or creating new ones
- Team Chat page already supports `?channel=` query param for deep-linking (to verify during implementation)
