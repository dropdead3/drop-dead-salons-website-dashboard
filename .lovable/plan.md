

## Add Session Navigation History (Back / Forward Arrows)

### What Changes

Add browser-style back and forward navigation arrows to the dashboard top bar, placed between the sidebar toggle button and the center search bar. These use an in-memory navigation history stack (session-only, not persisted) so users can quickly retrace their steps through the dashboard.

### Layout

```text
[ Sidebar Toggle ] [ < ] [ > ]        [ Search... ]        [ controls... ]
```

The arrows sit to the right of the sidebar collapse button in the left section of the header bar, directly beside the existing controls. They mirror the browser back/forward paradigm that users already understand.

### How It Works

1. **NavigationHistoryContext** -- a new React context that maintains an in-memory stack of visited paths during the current session
   - Tracks a `history` array and a `currentIndex` pointer
   - Listens to `react-router-dom` location changes and pushes new entries (deduplicating consecutive duplicates)
   - Exposes `canGoBack`, `canGoForward`, `goBack()`, `goForward()` 
   - Ignores navigations triggered by its own `goBack`/`goForward` calls (flag-based) to avoid double-pushing
   - Session-only: resets on page refresh or logout -- no persistence needed

2. **Navigation Arrows in DashboardLayout** -- two small ghost icon buttons (`ArrowLeft`, `ArrowRight`) added to the left section of the top bar
   - Disabled state (reduced opacity) when `canGoBack` / `canGoForward` is false
   - Tooltips: "Back" and "Forward"
   - Same `h-8 w-8` sizing as the sidebar toggle for visual consistency

### Technical Details

**New file: `src/contexts/NavigationHistoryContext.tsx`**
- Wraps children, listens to `useLocation()` changes
- Maintains `history: string[]` (pathname + search + hash) and `currentIndex: number`
- On location change: if not triggered internally, slice history at currentIndex+1 and push new entry
- `goBack`: decrement index, navigate to `history[currentIndex - 1]` with internal flag
- `goForward`: increment index, navigate to `history[currentIndex + 1]` with internal flag
- Cap history at ~50 entries to prevent unbounded growth

**Modified file: `src/components/dashboard/DashboardLayout.tsx`**
- Import `NavigationHistoryProvider` and `useNavigationHistory`
- Wrap the layout (or add provider at the DashboardLayout level, inside the Router)
- Add two `Button variant="ghost" size="icon"` with `ArrowLeft` / `ArrowRight` icons in the left section of the top bar, after the sidebar toggle and before the org switcher
- Buttons call `goBack()` / `goForward()` and are disabled when `!canGoBack` / `!canGoForward`
- Wrapped in `Tooltip` for "Back" / "Forward" labels

### Files
- **New:** `src/contexts/NavigationHistoryContext.tsx`
- **Modified:** `src/components/dashboard/DashboardLayout.tsx` (provider wrap + arrow buttons in header)

### Edge Cases Handled
- Consecutive visits to the same URL are deduplicated
- Internal navigation (from goBack/goForward) does not push to history
- History capped at 50 entries
- Query param changes (e.g. tab switches in Analytics Hub) are tracked as separate history entries
- Works alongside existing breadcrumbs without conflict
