

## Match Feedback Button Hover State to Clock In / Lock Dashboard

### Problem
The feedback buttons (Lightbulb, Bug) use `hover:bg-background/80` with `rounded-md`, while Clock In and Lock Dashboard use `hover:bg-muted/60` with `rounded-lg` and `transition-all duration-200 ease-out`. This creates an inconsistent, lighter hover highlight on the feedback buttons.

### Fix

**File: `src/components/dashboard/SidebarFeedbackButtons.tsx`**

Update both button elements' className from:
```
rounded-md ... hover:bg-background/80 transition-all
```
to:
```
rounded-lg ... hover:bg-muted/60 transition-all duration-200 ease-out
```

This aligns the hover background color, border radius, and transition timing with the Clock In and Lock Dashboard buttons directly below.

One file, two lines changed.

