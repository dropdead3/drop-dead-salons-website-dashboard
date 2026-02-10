

# Smart Navigation Memory for Zura Guidance Links

## The Problem
When Zura's guidance contains links like "check your [Sales Analytics](/dashboard/admin/analytics?tab=sales)", clicking them navigates the entire page away. The user loses the Zura card's state (which insight they were viewing, the guidance text) and has no easy way back.

## Solution: "Return to Zura" Navigation Memory

### How It Works

1. When a user clicks an internal link inside Zura's guidance, the current guidance state (active insight, guidance text, scroll position) is saved to a lightweight context/store before navigating.
2. A small floating "Return to Zura" pill appears at the bottom of the screen on the destination page.
3. Clicking it navigates back to the dashboard and automatically restores the Zura card to the exact guidance panel they were reading.
4. The pill auto-dismisses after 5 minutes or if the user manually closes it.

### User Flow

```text
+----------------------------+       +--------------------------+       +----------------------------+
| Zura Guidance Panel        |       | Sales Analytics Page     |       | Zura Guidance Panel        |
|                            |       |                          |       |                            |
| "Check your Sales          |       |  [charts, tables, data]  |       | (restored to exact state)  |
|  Analytics for details"    | ----> |                          | ----> |                            |
|  [Sales Analytics] (link)  |       |  [Return to Zura] pill   |       | Same insight, same text    |
+----------------------------+       +--------------------------+       +----------------------------+
   Click saves state                    Click restores state
```

### Bonus: Link Interaction Options
Each internal link will show a small tooltip or hover state indicating it navigates away, with an option to open in a new tab instead (middle-click or Ctrl+click already works, but we'll add a subtle icon to signal it).

## Technical Details

### 1. Create `src/contexts/ZuraNavigationContext.tsx`
A lightweight React context that holds:
- `savedGuidance`: The active guidance request object (type, title, description, category, priority)
- `savedGuidanceText`: The AI-generated guidance markdown
- `savedSuggestedTasks`: Any suggested tasks from the guidance
- `saveAndNavigate(href, guidanceState)`: Saves state then navigates
- `restore()`: Returns the saved state and clears it
- `dismiss()`: Clears saved state without restoring
- Auto-expiry after 5 minutes using a timeout

State is stored in a React ref + state (not localStorage) so it only persists within the current session.

### 2. Create `src/components/dashboard/ZuraReturnPill.tsx`
A small floating pill component:
- Renders at `fixed bottom-6 left-1/2 -translate-x-1/2` (centered bottom)
- Shows the Zura avatar + "Return to Zura" text
- Animate in with framer-motion (slide up + fade)
- Has a dismiss (X) button
- Clicking navigates to `/dashboard` and triggers state restoration
- Only renders when `savedGuidance` exists in context

### 3. Update `src/components/dashboard/GuidancePanel.tsx`
- Import the Zura navigation context
- Update the internal link handler: instead of calling `navigate(href)` directly, call `saveAndNavigate(href, { guidance state })` which saves the current guidance before navigating
- Add a small external-link icon next to internal links to signal navigation

### 4. Update `src/components/dashboard/AIInsightsCard.tsx` and `AIInsightsDrawer.tsx`
- On mount, check the Zura navigation context for saved state
- If saved state exists, auto-restore: set `activeGuidance` and `guidanceText` from the saved state
- This makes the card slide directly into the guidance panel the user was reading

### 5. Mount the context and pill
- Wrap the Zura navigation context provider in the dashboard layout (or app-level)
- Render `ZuraReturnPill` inside the dashboard layout so it appears on all dashboard sub-pages

### Files Created
- `src/contexts/ZuraNavigationContext.tsx` -- Navigation memory context
- `src/components/dashboard/ZuraReturnPill.tsx` -- Floating return pill

### Files Modified
- `src/components/dashboard/GuidancePanel.tsx` -- Use saveAndNavigate instead of navigate
- `src/components/dashboard/AIInsightsCard.tsx` -- Restore saved guidance on mount
- `src/components/dashboard/AIInsightsDrawer.tsx` -- Restore saved guidance on mount
- Dashboard layout file -- Add context provider and render return pill

