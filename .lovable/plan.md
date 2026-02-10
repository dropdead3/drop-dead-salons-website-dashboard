

# Animated Arrow on Guidance Buttons

## Overview
Replace the background-highlight hover effect on the "How to improve" and "What you should do" buttons with a right arrow (ChevronRight) that slides in from the left on hover, giving a directional cue that matches the slide-over navigation pattern.

## Changes

### 1. Update `GuidanceTrigger` in `AIInsightsDrawer.tsx`
- Remove `variant="ghost"` background hover by switching to `variant="link"` or using custom classes with `hover:bg-transparent`
- Add a `ChevronRight` icon after the label, hidden by default (`opacity-0 -translate-x-1`)
- On hover of the button, animate the arrow in (`group-hover:opacity-100 group-hover:translate-x-0`) with a smooth transition
- Add the `group` class to the button wrapper

### 2. Apply the same change in `AIInsightsCard.tsx`
- The same `GuidanceTrigger` component is duplicated there -- apply identical changes

### Technical Detail
```
// Before:
<Button variant="ghost" ...>
  <Lightbulb /> {label}
</Button>

// After:
<button className="group inline-flex items-center gap-1 ...  hover:bg-transparent">
  <Lightbulb className="w-3 h-3" />
  {label}
  <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
</button>
```

### Files to Modify
- `src/components/dashboard/AIInsightsDrawer.tsx` -- Update the `GuidanceTrigger` component
- `src/components/dashboard/AIInsightsCard.tsx` -- Same update to its copy of `GuidanceTrigger`

