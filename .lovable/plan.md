

## Fix: Square Corners Bug on Dashboard Elements

### Root Cause

In `src/index.css` (line 147), the CSS variable `--radius` is set to `0rem`:

```css
--radius: 0rem;
```

Many UI components from the component library internally reference `var(--radius)` for their default border-radius calculations. When this is set to `0`, those components render with sharp/square corners instead of the soft, rounded "bento" look you had before.

Components that explicitly use Tailwind classes like `rounded-2xl` (such as the main dashboard cards) are unaffected since they pull from `tailwind.config.ts` values directly. But elements using the CSS variable -- including default dialog corners, input fields, dropdown menus, and some nested card elements -- all become square.

### The Fix

Change `--radius` from `0rem` to a value that matches the luxury bento aesthetic. A value of `0.75rem` (12px) provides soft, premium-feeling default rounding for all components that rely on this variable:

**File:** `src/index.css`, line 147

```css
/* Before */
--radius: 0rem;

/* After */
--radius: 0.75rem;
```

This single-line change will restore rounded corners across all affected components while preserving the explicit `rounded-2xl` and `rounded-xl` classes already used on dashboard bento cards.

### Technical Details

- The `--radius` variable is defined once in the `:root` / `.theme-cream` block and cascades to all themes (rose, sage, ocean, etc.)
- shadcn components (Dialog, Select, Popover, DropdownMenu, etc.) use `calc(var(--radius) - Xpx)` internally for nested elements, so a `0rem` base causes all of them to collapse to zero or negative values
- The explicit Tailwind border-radius classes in `tailwind.config.ts` remain unchanged and continue to work as expected
- No other files need to change

