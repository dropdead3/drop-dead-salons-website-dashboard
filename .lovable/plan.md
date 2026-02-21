
# Replace Gender Dropdown with Bubble Selection

## What Changes

The Gender field in the New Client Dialog will switch from a `Select` dropdown to a row of tappable pill/bubble buttons. The selected option gets a highlighted style (primary background); unselected options remain outlined. Tapping a selected bubble again deselects it (since gender is optional).

## Options Displayed

- Male
- Female
- Non-Binary
- Prefer not to say

## Technical Details

**File Modified:** `src/components/dashboard/schedule/NewClientDialog.tsx`

- Remove the `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` markup for gender (lines 221-231)
- Replace with a `flex flex-wrap gap-2` container holding four bubble buttons
- Each bubble: `rounded-full px-4 py-2 text-sm border transition-colors cursor-pointer`
  - **Selected state**: `bg-primary text-primary-foreground border-primary`
  - **Unselected state**: `bg-background text-foreground border-input hover:bg-accent/50`
- `onClick` toggles: if already selected, clears to `''`; otherwise sets the value
- No new components or files needed -- inline toggle buttons using standard Tailwind classes
- Font uses `font-sans` per design system rules; no bold weights
