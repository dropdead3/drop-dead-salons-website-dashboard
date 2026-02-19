

## Enhance Top Bar Glassmorphism

### Current State
The top bar uses `bg-card/90 backdrop-blur-2xl border border-border/50 shadow-sm` -- decent but still fairly opaque at 90% card color.

### Changes

**File: `src/components/dashboard/DashboardLayout.tsx` (line 1082)**

Update the inner top bar `<div>` classes from:
```
bg-card/90 backdrop-blur-2xl rounded-2xl border border-border/50 shadow-sm overflow-hidden
```
To:
```
bg-card/50 backdrop-blur-2xl rounded-2xl border border-border/15 shadow-sm overflow-hidden
```

- `bg-card/90` drops to `bg-card/50` -- significantly more transparent, letting the cream background show through
- `border-border/50` drops to `border-border/15` -- a subtler structural edge that doesn't compete with the glass effect

This aligns with the project's glassmorphism standard (documented in style memory: `bg-card/50`, `backdrop-blur-2xl`, `border-border/15`).

One line change, one file.
