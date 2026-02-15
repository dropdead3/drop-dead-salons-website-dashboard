
## Update Dynamic Messages — Remove Pressure, Add Positivity

### What changes

Remove "Your team is counting on you" from the subtitles array and expand both the greetings and subtitles pools with more positive, encouraging variants.

### Updated message pools

**Greetings (8 total — 2 new):**
- "Welcome back,"
- "Good to see you,"
- "Let's build momentum,"
- "Ready to lead,"
- "Great things ahead,"
- "Let's make it count,"
- "You're on a roll," *(new)*
- "Another great day ahead," *(new)*

**Subtitles (8 total — removed 1, added 3):**
- "Here's what's happening today"
- "Your operations are in motion"
- "Let's see where you stand"
- "The numbers are telling a story"
- "Here's your snapshot for today"
- ~~"Your team is counting on you"~~ *(removed)*
- "Everything's moving in the right direction" *(new)*
- "You're set up for a strong day" *(new)*
- "Let's keep the momentum going" *(new)*

### Technical detail

**File: `src/pages/dashboard/DashboardHome.tsx` (lines 64-80)**

Replace the `GREETINGS` and `SUBTITLES` arrays with the expanded versions above. No other file changes needed.
