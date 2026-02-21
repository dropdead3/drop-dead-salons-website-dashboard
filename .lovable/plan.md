

## Improve Schedule Grid Line Visibility

### Problem
The time slot grid lines in the scheduling calendar are nearly invisible due to very low opacity border classes (`border-border/60`, `border-border/40`, `border-border/20`), making it difficult to distinguish between time slots.

### Changes

**File: `src/components/dashboard/schedule/DayView.tsx`** (lines 130-134)

Increase the border opacity for all three grid line tiers:

| Slot Type | Current | New |
|-----------|---------|-----|
| Hour mark (:00) | `border-t border-border/60` | `border-t border-border` (full opacity, solid) |
| Half-hour (:30) | `border-t border-dotted border-border/40` | `border-t border-dashed border-border/60` |
| Quarter-hour (:15, :45) | `border-t border-dotted border-border/20` | `border-t border-dotted border-border/35` |

This creates a clear visual hierarchy:
- **Hour lines**: Solid, full contrast -- anchors for quick scanning
- **Half-hour lines**: Dashed, moderate contrast -- secondary rhythm
- **Quarter-hour lines**: Dotted, subtle but visible -- fine granularity without clutter

