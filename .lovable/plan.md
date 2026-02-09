
# Add Subtle Outline to Announcement Cards

## Overview

Add a subtle border outline around each announcement card in the sidebar widget to visually separate them from each other.

## Current Styling (Line 154-157)

```typescript
className={cn(
  "p-3 bg-muted/50 border-l-2 rounded-r-md text-xs",
  priorityColors[announcement.priority]
)}
```

- Only left border for priority color
- Only right corners rounded
- No full outline

## Updated Styling

```typescript
className={cn(
  "p-3 bg-muted/50 border border-border/50 border-l-2 rounded-md text-xs",
  priorityColors[announcement.priority]
)}
```

**Changes:**
- `border border-border/50` - Adds a subtle outline using the theme's border color at 50% opacity
- `rounded-r-md` → `rounded-md` - Full rounded corners on all sides to match the complete border
- Keeps the left border override for priority color via `border-l-2` and the priority color class

## File to Modify

**`src/components/dashboard/SidebarAnnouncementsWidget.tsx`** - Line 155

## Result

Each announcement card will have a subtle, semi-transparent border around it, making cards visually distinct from one another while maintaining the priority-colored left accent.
