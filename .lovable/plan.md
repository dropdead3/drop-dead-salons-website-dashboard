
# Fix Mention Autocomplete Contrast

## Problem
The @mention dropdown has poor text visibility because the text color isn't explicitly set. In dark mode with the cream theme, both the background and text appear in similar light tones, making names hard to read.

## Solution
Add explicit text color classes to ensure proper contrast:

### Changes to `MentionAutocomplete.tsx`

1. **Container**: Add `text-popover-foreground` to the outer div so all text inherits a contrasting color

2. **Selected state button**: Add `text-accent-foreground` when selected to ensure the text remains readable against the accent background

3. **Name text**: Ensure the name span has explicit foreground color

### Specific Code Changes

**Line 51** - Add foreground color to container:
```tsx
className="absolute bottom-full left-0 mb-2 z-50 bg-popover text-popover-foreground border rounded-md shadow-lg overflow-hidden min-w-[200px]"
```

**Lines 65-69** - Add foreground color for selected state:
```tsx
className={cn(
  'w-full flex items-center gap-2 px-3 py-2 text-left',
  'hover:bg-accent hover:text-accent-foreground transition-colors',
  index === selectedIndex && 'bg-accent text-accent-foreground'
)}
```

This ensures:
- Default text uses `popover-foreground` (dark on light, light on dark)
- Hovered/selected items use `accent-foreground` for proper contrast against the accent background
