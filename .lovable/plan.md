

# Sticky Zura Guidance Panel (Follow-Along Mode)

## Overview
Replace the simple "Return to Zura" pill with a rich, sticky guidance panel that stays at the bottom of the page when you navigate away from the insights card. This lets you read Zura's suggestions **while acting on them** -- like a follow-along guide.

## User Experience

The panel has two states:

**Collapsed (default on arrival)**: A slim bar at the bottom showing the Zura avatar, the insight title, and expand/dismiss buttons. Stays out of the way but always accessible.

**Expanded**: Slides up to reveal the full guidance markdown content in a scrollable area (max ~40% viewport height). You can read each step while looking at the analytics page, payroll hub, or whatever Zura linked you to.

```text
+--------------------------------------------------+
|  [destination page content -- e.g. Analytics]     |
|                                                   |
|                                                   |
|                                                   |
+==================================================+
| [Z] Revenue Pulse: How to Improve    [^] [X]     |  <-- collapsed bar
+==================================================+

      click expand arrow [^] ...

+--------------------------------------------------+
|  [destination page content]                       |
|                                                   |
+==================================================+
| [Z] Revenue Pulse: How to Improve    [v] [X]     |
|--------------------------------------------------|
| ### Step 1: Review your Daily Revenue tab         |
| Check for patterns in your peak hours...          |
|                                                   |
| ### Step 2: Adjust your pricing strategy          |
| Consider increasing rates for high-demand...      |
|                                                   |
| [Powered by Zura AI]                              |
+==================================================+
```

Clicking "Return to Zura" in the collapsed bar still navigates back and restores the full insights card. The X dismisses the panel entirely.

## Technical Details

### 1. Replace `src/components/dashboard/ZuraReturnPill.tsx` with `ZuraStickyGuidance.tsx`
Transform the simple pill into a collapsible panel:
- **Collapsed state**: Slim bar (h-12) with Zura avatar, truncated title, expand chevron, return button, and dismiss X
- **Expanded state**: Adds a ScrollArea below the bar showing the full guidance markdown (max-h-[40vh])
- Uses `framer-motion` for smooth slide-up animation on mount and expand/collapse transitions
- Renders the same `ReactMarkdown` setup from `GuidancePanel.tsx` for consistent link handling
- Internal links within the sticky panel also work (navigate + keep the panel open)
- Glassmorphism styling: `bg-card/95 backdrop-blur-xl` with a subtle top border gradient

### 2. Update `src/contexts/ZuraNavigationContext.tsx`
No structural changes needed -- the existing `savedState` already carries `guidanceText` and `suggestedTasks`. The new sticky component just reads from the same context.

### 3. Update `src/components/dashboard/DashboardLayout.tsx`
- Replace `<ZuraReturnPill />` with `<ZuraStickyGuidance />`
- Import updated component

### 4. Update `src/components/dashboard/GuidancePanel.tsx`
- No changes needed -- the `saveAndNavigate` logic already saves the full guidance text

### Files Created
- `src/components/dashboard/ZuraStickyGuidance.tsx` -- New sticky panel component

### Files Modified
- `src/components/dashboard/DashboardLayout.tsx` -- Swap pill for sticky panel
- `src/components/dashboard/ZuraReturnPill.tsx` -- Will be replaced/removed

### No new dependencies
Uses existing `framer-motion`, `react-markdown`, `@radix-ui/react-scroll-area`, and `react-router-dom`.

