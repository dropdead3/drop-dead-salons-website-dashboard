

# Left-Reveal Card Controls

## Overview
Relocate the Zura AI and Pin icons from the bottom hover row to the **left edge** of each card. On hover, the icons slide in from the left and the card header content shifts right to accommodate them, keeping the card height completely stable.

## Current Behavior
- Icons appear in a collapsible row **below** the card on hover
- This causes vertical layout shift as the row expands/collapses
- Cards grow taller on hover, pushing content below them down

## New Behavior
- Icons sit on the **left edge** of the card, hidden by default (zero width, opacity 0)
- On card hover, the icon column expands (~40px) and fades in
- The card content shifts right with a smooth CSS transition
- No vertical layout shift at all

## Technical Approach

### 1. Refactor `PinnableCard.tsx`
- Change the layout from a vertical stack (children + bottom bar) to a **horizontal flex row** (icon column + children)
- The icon column uses `max-w-0 opacity-0 group-hover:max-w-[40px] group-hover:opacity-100` with `overflow-hidden` and `transition-all`
- Icons stack vertically in the column (Zura on top, Pin below)
- The `children` wrapper gets `transition-all` so it smoothly adjusts as the icon column appears

### 2. Icon Column Styling
- Flex column, centered, with a subtle right border separator (`border-r border-border/30`)
- Icons sized at their current compact dimensions (h-7 w-7 touch targets)
- Vertically centered relative to the card header area

### 3. Remove Bottom Bar
- Delete the existing bottom-expanding `div` with `max-h-0` / `group-hover:max-h-10` pattern entirely

### 4. No Changes Needed to Child Components
- `ZuraCardInsight` and `CommandCenterVisibilityToggle` components remain unchanged -- only their container moves

