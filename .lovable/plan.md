

## Separate Feedback Buttons Into Their Own Bento Card

### What Changes

The Lightbulb and Bug feedback buttons currently sit inside the same bento card as the Clock In and Lock buttons. We will pull them out into their own visually distinct bento card above the existing one, matching the same rounded/border styling.

### Implementation

**File: `src/components/dashboard/SidebarNavContent.tsx`** (lines 625-641)

Wrap `SidebarFeedbackButtons` in its own bento card container, separate from the Clock/Lock card:

```
Before (single card):
  [Feedback] [Clock] [Lock]

After (two cards):
  Card 1: [Feedback buttons]
  Card 2: [Clock] [Lock]
```

The new card will use the same styling as the existing one (`rounded-lg bg-muted/30 border border-border/50`) with appropriate padding based on `isCollapsed`. A small gap (`gap-2`) separates the two cards.

**File: `src/components/dashboard/SidebarFeedbackButtons.tsx`**

The component itself stays unchanged -- the separation is purely structural in the parent layout.

### Technical Details

| File | Change |
|------|--------|
| `src/components/dashboard/SidebarNavContent.tsx` | Move `SidebarFeedbackButtons` into its own bento card wrapper above the existing Clock/Lock card. Add `flex flex-col gap-2` to the footer container. |

One file, ~6 lines changed.

