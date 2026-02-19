

## Fix Bottom Padding on Clock/Lock Button Container

### Problem
The Clock In and Lock Dashboard buttons sit in a rounded bento container near the bottom of the sidebar. The bottom spacing below this container doesn't visually match the side margins (`mx-3` = 12px), creating an unbalanced look around the edges.

### Solution

**File: `src/components/dashboard/SidebarNavContent.tsx`**

Adjust the bottom spacer from `h-2` (8px) to `h-3` (12px) so it matches the horizontal margin (`mx-3` = 12px), creating consistent visual padding on all sides of the footer area.

### Technical Detail

```
// Line 697
// Before
<div className="h-2" />

// After
<div className="h-3" />
```

Single-line change. The bottom breathing room will now match the left/right margins for a visually balanced footer.

