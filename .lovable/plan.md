

## Move Chevron and Ratio in Pipeline Location Cards

### Changes

**File: `src/components/dashboard/analytics/BookingPipelineContent.tsx`** (lines 261-290)

**Current layout:**
- Header row: [dot + name + chevron] ... [ratio: X%]
- Progress bar row: [bar] [X%]

**New layout:**
- Header row: [dot + name] ... [chevron arrow]
- Progress bar: full-width bar (no inline percentage)
- Below bar: "ratio: X%" text anchored bottom-left

### Specific Changes

1. **Remove** the `ChevronDown` from inside the name cluster (line 266) and place it as a standalone element on the right side of the header `justify-between` div
2. **Remove** the ratio percentage from the top-right conditional block (lines 268-272)
3. **Replace** the progress bar layout: remove the `flex items-center gap-3` wrapper and inline percentage label; instead render the `Progress` at full width, then a `span` below it (with `mt-1.5`) showing "ratio: X%" aligned left
