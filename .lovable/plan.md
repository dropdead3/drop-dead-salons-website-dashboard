

# Client Detail Panel -- Gap Analysis and Enhancement Plan

## Bugs Found

### 1. ScrollArea max-height conflict (Line 401)
The `ScrollArea` has `max-h-[85vh]` hardcoded, but the parent panel already uses `top-4 bottom-4` to constrain height. This creates a scenario where the scroll area is shorter than the panel itself, leaving dead space at the bottom (visible in the screenshot as an empty gray area below Client Settings). Fix: remove `max-h-[85vh]` from the ScrollArea and use `flex-1` only.

### 2. "Client since Jan 2026 -- 0 months" display issue (Lines 646-651)
The tenure calculation uses `differenceInDays / 30` which floors to 0 for clients within the first month. For very recent clients this reads as "0 months" which feels broken. Fix: show "Less than 1 month" or "New" when the result is 0.

### 3. Marketing preferences show toggles even when "organization context" is missing (Screenshot)
The toggles render and the italic warning sits below them. If there's no org context, the toggles shouldn't be interactive -- they'll fail on mutation. The `ClientMarketingStatus` component does guard the mutation, but the switches still appear enabled and clickable, which is misleading.

### 4. Contact quick actions missing when no email (Lines 458-483)
If a client has a phone but no email, only "Call" and "Text" buttons render. The layout goes from 3 columns to 2, which is fine -- but if a client has neither phone nor email, the entire quick-actions row vanishes with no fallback, leaving a gap.

## UI Fixes

### 5. Empty card at the bottom of the panel (Screenshot)
There's a visible empty card/container at the very bottom of the panel. This is likely the "Preferred Services" card rendering with no content, or extra whitespace from the actions footer. The preferred services section (line 860) already has a conditional, so this is probably the `border-t` actions row rendering with too much padding when the Archive/Ban buttons are hidden for non-super-admin roles.

### 6. Phone number formatting (Screenshot: "14705393119")
Raw unformatted phone numbers look unprofessional. Should format as "(470) 539-3119" or "+1 (470) 539-3119".

## Enhancements

### 7. "Since Visit" stat card -- show actual date on hover/subtitle
Currently shows "N/A" or "42d" with no context. Add a subtitle with the actual last visit date beneath the days count.

### 8. Contact Info card -- missing email display
The screenshot shows only the phone number under Contact Information with no email line. The code does handle it (line 566), but it's worth verifying the data. No code change needed -- this is a data gap.

### 9. Staggered entry animation for bento cards
Currently all cards appear instantly when the panel slides in. Adding a staggered `motion.div` wrapper per card section would enhance the luxury feel.

---

## Implementation Details

### File: `src/components/dashboard/ClientDetailSheet.tsx`

**Fix 1 -- ScrollArea (Line 401)**
Remove `max-h-[85vh]` from the ScrollArea, keep only `flex-1`.

**Fix 2 -- Tenure display (Lines 648-651)**
Change the months calculation to show "Less than 1 month" when the result is 0.

**Fix 3 -- Marketing toggles (no code change in this file)**
In `src/components/dashboard/clients/ClientMarketingStatus.tsx` (lines 101-110, 118-127): disable the Switch components when `!organizationId` regardless of role, and hide the "requires organization context" message when the org IS present.

**Fix 4 -- Quick actions fallback (after Line 483)**
Add a fallback when neither phone nor email exists: a muted "No contact info on file" message.

**Fix 5 -- Bottom empty space (Lines 897-909)**
Wrap the Archive/Ban actions row in a conditional so it doesn't render empty markup when the user lacks permissions. Both `ArchiveClientToggle` and `BanClientToggle` already return `null` for non-super-admins, but the parent `div` with `border-t` and padding still renders.

**Fix 6 -- Phone formatting**
Add a `formatPhone` utility that formats 10-11 digit US numbers. Apply it in the Contact Info display (line 575) and the quick-actions phone display.

**Enhancement 7 -- Since Visit subtitle (Lines 497-507)**
Add the formatted last visit date as a smaller subtitle under the days count in the stats card.

**Enhancement 9 -- Staggered bento entry**
Wrap each card section in a `motion.div` with `initial={{ opacity: 0, y: 12 }}`, `animate={{ opacity: 1, y: 0 }}`, and incrementing `transition.delay` (0.05s steps) for a cascading reveal after the panel finishes its spring entrance.

## Summary

- 5 bug fixes (scroll overflow, tenure "0 months", marketing toggle state, missing contact fallback, empty bottom container)
- 1 UI polish (phone formatting)
- 2 enhancements (last visit subtitle, staggered card animations)
- Total files: 2 (`ClientDetailSheet.tsx`, `ClientMarketingStatus.tsx`) + 1 new utility if phone formatting is extracted

