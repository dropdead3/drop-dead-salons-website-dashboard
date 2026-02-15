

## Dynamic Welcome & Subtitle Messages

### What changes

Replace the static "Welcome back, [name]" and "Here's what's happening today" strings with arrays of rotating messages that change each time the user visits the dashboard.

### Message pools

**Greetings (replaces "Welcome back, [name]"):**
- "Welcome back,"
- "Good to see you,"
- "Let's build momentum,"
- "Ready to lead,"
- "Great things ahead,"
- "Let's make it count,"

**Subtitles (replaces "Here's what's happening today"):**
- "Here's what's happening today"
- "Your operations are in motion"
- "Let's see where you stand"
- "The numbers are telling a story"
- "Here's your snapshot for today"
- "Your team is counting on you"

### How rotation works

Use a simple `useMemo` seeded by `Date.now()` at the session/component-mount level. Each time the user navigates to the dashboard (or refreshes), they get a random pair. The selection is stable for the duration of that page session (no flickering on re-renders).

### Technical detail

**File: `src/pages/dashboard/DashboardHome.tsx`**

1. Add two constant arrays of greeting and subtitle strings at the top of the file (outside the component).
2. Inside the component, use `useState` with a lazy initializer to pick a random index from each array once per mount.
3. Replace `{t('home.welcome_back')}` with the selected greeting string, and `{t('home.whats_happening')}` with the selected subtitle string.

No i18n key changes needed -- the dynamic strings will be hardcoded in the component (they can be moved to locale files later if multi-language support is needed for these messages).

